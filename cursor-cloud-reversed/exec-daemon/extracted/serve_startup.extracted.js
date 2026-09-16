// Subcommand: prebuild-request-context-cache
//
// Run once during an environment build (after repos are checked out, before the
// snapshot) to compute the request context and write the whole thing to the
// daemon's on-disk cache. A pod started from the resulting snapshot serves this
// whole baked context (static rules/skills/subagents/codebase ref/cloud rule
// plus the dynamic env, MCP, git, notes) on its cold first turn, merging only
// live plugin content on top, instead of rescanning the whole workspace. Every
// turn after the first bypasses the cache and recomputes live, so runtime-varying
// fields like git status never go stale.
program
    .command("prebuild-request-context-cache")
    .description("Compute the request context and write it to disk for snapshot reuse")
    .option("--cloud-rules-enabled", "Enable cloud rules", false)
    .option("--mcp-meta-tool-enabled", "Enable MCP meta-tool discovery", false)
    .option("--strip-agent-skill-content", "Omit AgentSkill.content from the baked request context for non-plugin skills", false)
    .option("--mcp-meta-tool-slim-descriptors", "Omit per-tool MCP descriptions/schemas from the baked request context", false)
    .option("--mcp-input-schema-json", "Carry remaining MCP schemas as flat JSON strings in the baked request context", false)
    .option("--claude-md-enabled", "Enable claude.md loading", true)
    .option("--no-claude-md-enabled", "Disable claude.md loading")
    .option("--project-dir <path>", "Overrides the project directory for the exec daemon")
    // Mirror `serve`: default to PATH-resolved "rg" (the bundled ripgrep is on
    // PATH via prependExecDaemonBundleToPath), so the static rule/skill scan works.
    .option("--rg-path <path>", "Path to ripgrep executable", "rg")
    .addOption(new _commander_js_extra_typings__WEBPACK_IMPORTED_MODULE_8__/* .Option */ .c$("--log-level <level>", "Log level").choices([
    "debug",
    "info",
    "warn",
    "error",
]))
    .action(async (opts) => {
    filteredLoggerBackend.setMinLevel(opts.logLevel);
    (0,_anysphere_shell_exec__WEBPACK_IMPORTED_MODULE_6__.configureRipgrepPath)(opts.rgPath);
    try {
        await prebuildRequestContextCache(opts);
        process.exit(0);
    }
    catch (error) {
        execDaemonLogger.error(globalContext, "Failed to prebuild request-context cache", error instanceof Error ? error : new Error(String(error)));
        process.exit(1);
    }
});
// Subcommand: serve (default). The option surface + unknown-option tolerance
// live in createServeCommand() so they can be unit-tested without booting the
// daemon; the action stays here because it wires module-level singletons.
const serveCommand = (0,_serveCommand_js__WEBPACK_IMPORTED_MODULE_14__/* .createServeCommand */ .l)().action(async (opts, command) => {
    // Surface any option-looking tokens serve tolerated but did not recognize (see
    // createServeCommand's header). They are ignored so a newer launcher flag can
    // never brick an older daemon, but logging keeps a generator typo visible.
    const unknownServeOptions = (0,_serveCommand_js__WEBPACK_IMPORTED_MODULE_14__/* .collectUnknownServeOptions */ .E)(command.args);
    if (unknownServeOptions.length > 0) {
        execDaemonLogger.warn(globalContext, "Ignoring unrecognized exec-daemon serve options", { unknownServeOptions });
    }
    filteredLoggerBackend.setMinLevel(opts.logLevel);
    (0,_anysphere_shell_exec__WEBPACK_IMPORTED_MODULE_6__.configureRipgrepPath)(opts.rgPath);
    if (opts.originCliEnabled) {
        (0,_bundledToolPath_js__WEBPACK_IMPORTED_MODULE_9__/* .prependExecDaemonGatedToolsToPath */ .W2)();
    }
    if (opts.sandboxHelperPath) {
        (0,_anysphere_shell_exec__WEBPACK_IMPORTED_MODULE_6__.configureSandboxPrereqs)({ sandboxBinaryPath: opts.sandboxHelperPath });
    }
    await runServer({
        ...opts,
        logLevel: opts.logLevel ?? filteredLoggerBackend.getMinLevel(),
    });
});
program.addCommand(serveCommand, { isDefault: true });
await program.parseAsync(process.argv);
/**
 * Compute the request context once during an environment build and persist the
 * whole thing to the daemon's on-disk cache, so a pod started from this build's
 * snapshot serves the whole baked context (static rules/skills/subagents/
 * codebase ref/cloud rule plus the dynamic env, MCP, git, notes) from disk on
 * its cold first turn instead of rescanning the workspace. Subsequent turns
 * recompute live, so the baked dynamic fields only ever back the first turn.
 *
 * Reuses `setupDaemon` so the baked data is computed by the exact same provider
 * wiring the runtime daemon uses, and disables the disk cache during this run so
 * a stale file from a prior build is never round-tripped back out.
 */
async function prebuildRequestContextCache(opts) {
    const ctx = globalContext;
    const workspacePath = process.cwd();
    const dataDir = process.env[_setup_js__WEBPACK_IMPORTED_MODULE_16__/* .EXEC_DAEMON_DATA_DIR_ENV_VAR */ .Sg];
    const logLevel = opts.logLevel ?? filteredLoggerBackend.getMinLevel();
    const workspaceDiscovery = await (0,_workspace_discovery_js__WEBPACK_IMPORTED_MODULE_20__/* .discoverExecDaemonWorkspacePaths */ .MH)(ctx, new _anysphere_local_exec__WEBPACK_IMPORTED_MODULE_4__/* .LocalGitExecutor */ .xK7(), workspacePath);
    const result = await (0,_setup_js__WEBPACK_IMPORTED_MODULE_16__/* .setupDaemon */ .My)({
        globalContext: ctx,
        workspacePaths: workspaceDiscovery.workspacePaths,
        surface: "cloud",
        projectDir: opts.projectDir,
        logLevel,
        isCloudRulesEnabled: opts.cloudRulesEnabled,
        isMcpMetaToolEnabled: opts.mcpMetaToolEnabled,
        stripAgentSkillContent: opts.stripAgentSkillContent,
        isMcpMetaToolSlimDescriptors: opts.mcpMetaToolSlimDescriptors === true,
        mcpInputSchemaJson: opts.mcpInputSchemaJson === true,
        isSecretRedactionEnabled: true,
        getThirdPartyExtensibilityEnabled: () => opts.claudeMdEnabled,
        gitService,
        dataDir,
        // Always recompute from the live workspace so we bake a fresh cache.
        disableRequestContextDiskCache: true,
    });
    const rcResult = await result.requestContextExecutor.execute(ctx, new _anysphere_proto_agent_v1_request_context_exec_pb_js__WEBPACK_IMPORTED_MODULE_5__/* .RequestContextArgs */ ._K({}));
    if (rcResult.result.case !== "success") {
        const message = rcResult.result.case === "error"
            ? rcResult.result.value.error
            : "unknown";
        throw new Error(`request-context execute failed: ${message}`);
    }
    const requestContext = rcResult.result.value.requestContext;
    if (requestContext === undefined) {
        throw new Error("request-context execute returned no requestContext");
    }
    await (0,_request_context_disk_cache_js__WEBPACK_IMPORTED_MODULE_13__/* .writeRequestContextDiskCache */ .N6)(ctx, _request_context_disk_cache_js__WEBPACK_IMPORTED_MODULE_13__/* .REQUEST_CONTEXT_DISK_CACHE_PATH */ .Tk, requestContext);
}
// Server implementation
async function runServer(opts) {
    // Initialize tracing early, before any spans are created
    // Only enable tracing when ghost mode is disabled and trace endpoint + token are provided
    const willInitTracing = !!(opts.traceEndpoint &&
        opts.traceAuthToken &&
        !opts.ghostMode);
    execDaemonLogger.info(globalContext, "Tracing config check", {
        hasTraceEndpoint: !!opts.traceEndpoint,
        hasTraceAuthToken: !!opts.traceAuthToken,
        ghostMode: opts.ghostMode,
        willInitTracing,
    });
    if (willInitTracing) {
        execDaemonLogger.info(globalContext, "Initializing tracing...");
        (0,_tracing_js__WEBPACK_IMPORTED_MODULE_19__/* .initTracing */ .Hu)({
            ctx: globalContext,
            traceEndpoint: opts.traceEndpoint,
            authToken: opts.traceAuthToken,
            insecure: opts.traceInsecure,
            traceAttributes: opts.traceAttributes,
        });
    }
    else {
        execDaemonLogger.info(globalContext, "Tracing NOT initialized", {
            reason: !opts.traceEndpoint
                ? "no trace endpoint provided"
                : !opts.traceAuthToken
                    ? "no trace auth token provided"
                    : "ghost mode is enabled",
        });
    }
    // Boot-time record of the workload cgroup placement (resolved once at
    // module load). An exported contract the daemon could not use is the
    // suspicious case, so that one logs at warn.
    const workloadPlacement = (0,_anysphere_utils__WEBPACK_IMPORTED_MODULE_7__/* .getWorkloadPlacement */ .NG)();
    const exportedWorkloadCgroup = process.env[_anysphere_utils__WEBPACK_IMPORTED_MODULE_7__/* .WORKLOAD_CGROUP_ENV_VAR */ .ZH];
    const placementDegraded = workloadPlacement.kind === "direct" && exportedWorkloadCgroup !== undefined;
    const placementFields = {
        placement: workloadPlacement.kind,
        exportedWorkloadCgroup,
    };
    if (placementDegraded) {
        execDaemonLogger.warn(globalContext, "Workload cgroup placement resolved", placementFields);
    }
    else {
        execDaemonLogger.info(globalContext, "Workload cgroup placement resolved", placementFields);
    }
    const startupTraceparent = (0,_startup_traceparent_js__WEBPACK_IMPORTED_MODULE_17__/* .withStartupTraceparent */ .t1)(globalContext);
    if (startupTraceparent.status === "invalid") {
        execDaemonLogger.warn(globalContext, "Ignoring invalid exec-daemon startup traceparent");
    }
    const startupCtx = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .withSpan */ .fR)(startupTraceparent.ctx.withName("exec_daemon.startup"));
    const startupSpan = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .getSpan */ .fU)(startupCtx);
    startupSpan?.setAttribute("exec_daemon.port", opts.port);
    startupSpan?.setAttribute("exec_daemon.pty_websocket_port", opts.ptyWebsocketPort);
    startupSpan?.setAttribute("exec_daemon.ghost_mode", opts.ghostMode);
    startupSpan?.setAttribute("exec_daemon.workload_cgroup_placement", workloadPlacement.kind);
    const runStartupStep = async (name, fn) => {
        const stepCtx = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .withSpan */ .fR)(startupCtx.withName(name));
        const stepSpan = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .getSpan */ .fU)(stepCtx);
        try {
            return await fn(stepCtx);
        }
        catch (error) {
            stepSpan?.recordException(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
        finally {
            stepSpan?.end();
        }
    };
    let startupSpanEnded = false;
    const endStartupSpan = (error) => {
        if (startupSpanEnded) {
            return;
        }
        if (error) {
            startupSpan?.recordException(error instanceof Error ? error : new Error(String(error)));
        }
        startupSpan?.end();
        startupSpanEnded = true;
    };
    const workspacePath = process.cwd();
    const dataDir = process.env[_setup_js__WEBPACK_IMPORTED_MODULE_16__/* .EXEC_DAEMON_DATA_DIR_ENV_VAR */ .Sg];
    const workspaceDiscovery = await runStartupStep("exec_daemon.startup.discover_workspaces", async (stepCtx) => await (0,_workspace_discovery_js__WEBPACK_IMPORTED_MODULE_20__/* .discoverExecDaemonWorkspacePaths */ .MH)(stepCtx, new _anysphere_local_exec__WEBPACK_IMPORTED_MODULE_4__/* .LocalGitExecutor */ .xK7(), workspacePath));
    startupSpan?.setAttribute("exec_daemon.workspace_count", workspaceDiscovery.workspacePaths.length);
    execDaemonLogger.info(startupCtx, "Discovered exec-daemon workspaces"