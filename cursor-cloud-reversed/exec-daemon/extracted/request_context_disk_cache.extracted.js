const REQUEST_CONTEXT_DISK_CACHE_PATH = "/opt/cursor/.exec-daemon/request-context-cache.json";
/**
 * Atomically write the whole computed `RequestContext` to disk (temp file +
 * rename) so a reader never observes a partially-written file even if the build
 * is interrupted mid-write.
 */
async function writeRequestContextDiskCache(ctx, filePath, requestContext) {
    await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.mkdir)(node_path__WEBPACK_IMPORTED_MODULE_1___default().dirname(filePath), { recursive: true });
    const serialized = {
        version: REQUEST_CONTEXT_DISK_CACHE_VERSION,
        builtAtMs: Date.now(),
        requestContext: requestContext.toJson(),
    };
    const tmpPath = `${filePath}.tmp-${process.pid}`;
    await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.writeFile)(tmpPath, JSON.stringify(serialized), "utf8");
    await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.rename)(tmpPath, filePath);
    logger.info(ctx, "Wrote request-context disk cache", {
        filePath,
        ruleCount: requestContext.rules.length,
        agentSkillCount: requestContext.agentSkills.length,
        customSubagentCount: requestContext.customSubagents.length,
        repositoryInfoCount: requestContext.repositoryInfo.length,
        hasCloudRule: requestContext.cloudRule !== undefined &&
            requestContext.cloudRule.length > 0,
    });
}
/**
 * Read and validate the baked `RequestContext`. Returns `undefined` (never
 * throws) when the file is absent, unreadable, malformed, or written by an
 * incompatible version, so the caller transparently falls back to computing the
 * request context live.
 */
async function readRequestContextDiskCache(ctx, filePath) {
    let raw;
    try {
        raw = await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.readFile)(filePath, "utf8");
    }
    catch (error) {
        // Logged (not silent) so a miss can be told apart from a hit, and an
        // unexpected errno (e.g. a writer/reader data-dir mismatch) from a
        // genuinely-absent bake (ENOENT on a snapshot that never baked).
        logger.info(ctx, "Request-context disk cache not read", {
            filePath,
            code: error?.code,
        });
        return undefined;
    }
    try {
        const parsed = JSON.parse(raw);
        if (parsed.version !== REQUEST_CONTEXT_DISK_CACHE_VERSION) {
            logger.warn(ctx, "Ignoring request-context disk cache: version mismatch", {
                filePath,
                found: parsed.version,
                expected: REQUEST_CONTEXT_DISK_CACHE_VERSION,
            });
            return undefined;
        }
        if (typeof parsed.requestContext !== "object" ||
            parsed.requestContext === null) {
            logger.warn(ctx, "Ignoring request-context disk cache: missing requestContext", { filePath });
            return undefined;
        }
        return _anysphere_proto_agent_v1_request_context_exec_pb_js__WEBPACK_IMPORTED_MODULE_3__/* .RequestContext */ .bb.fromJson(parsed.requestContext, {
            ignoreUnknownFields: true,
        });
    }
    catch (error) {
        logger.warn(ctx, "Ignoring request-context disk cache: parse failed", {
            filePath,
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
}
/**
 * Merge the live plugin-provisioned static content (rules, agent skills,
 * subagents) on top of the snapshot-baked baseline, mutating `target` in place.
 *
 * The baked baseline is plugin-free: cloud plugins are materialized per-agent at
 * runtime, after the snapshot, so the env build that produced the cache never
 * saw them. Plugins are therefore the only static content not provisioned ahead
 * of time, and merging them here is what keeps a baked context correct once an
 * agent's plugins are installed.
 */
function mergeBakedStaticIntoRequestContext(target, baked, plugins) {
    const agentSkills = [...baked.agentSkills, ...plugins.agentSkills];
    target.agentSkills = agentSkills;
    target.rules = plugins.dedupeRules([...baked.rules, ...plugins.rules], agentSkills);
    target.customSubagents = [...baked.customSubagents, ...plugins.subagents];
    target.repositoryInfo = baked.repositoryInfo;
    if (baked.cloudRule !== undefined && baked.cloudRule.length > 0) {
        target.cloudRule = baked.cloudRule;
    }
}
/**
 * Request-context executor that optionally serves the whole snapshot-baked
 * context when the caller sets `RequestContextArgs.useCached` (intended for the
 * cold first turn after an env-build snapshot). Otherwise falls through to the
 * full (pre-disk-cache) executor with its in-process caches.
 *
 * When serving the bake, live plugin content is still merged on top because
 * plugins are materialized per-agent after the snapshot. The full executor is
 * also constructed on a successful cache hit so its caches warm while the bake
 * is served, keeping the next non-cached call fast.
 *
 * Callers must not set `useCached` on later turns: workspace-mutating fields
 * (e.g. git status) would go stale.
 */
class DiskBackedRequestContextExecutor {
    options;
    fullExecutor;
    constructor(options) {
        this.options = options;
    }
    async execute(ctx, args, options) {
        if (args.useCached === true) {
            const baked = await this.options.read(ctx).catch(() => undefined);
            if (baked !== undefined) {
                logger.info(ctx, "Serving request-context from disk cache (hit)", {
                    ruleCount: baked.rules.length,
                    agentSkillCount: baked.agentSkills.length,
                    customSubagentCount: baked.customSubagents.length,
                    repositoryInfoCount: baked.repositoryInfo.length,
                });
                // Warm the full executor in the background for subsequent non-cached calls.
                this.getFullExecutor();
                return this.serveBaked(ctx, baked);
            }
            logger.info(ctx, "Request-context disk cache miss; computing live", {});
        }
        return this.getFullExecutor().execute(ctx, args, options);
    }
    /**
     * Serve the whole baked context, merging live plugin-provisioned static
     * content on top. Clones the baked context so the memoized instance is never
     * mutated.
     */
    async serveBaked(ctx, baked) {
        const [rules, agentSkills, subagents] = await Promise.all([
            this.options.getPluginRules(ctx).catch(() => []),
            this.options.getPluginAgentSkills(ctx).catch(() => []),
            this.options.getPluginSubagents().catch(() => []),
        ]);
        const requestContext = baked.clone();
        mergeBakedStaticIntoRequestContext(requestContext, baked, {
            rules,
            agentSkills,
            subagents,
            dedupeRules: this.options.dedupeRules,
        });
        await this.options.updateBaked?.(ctx, requestContext);
        return new _anysphere_proto_agent_v1_request_context_exec_pb_js__WEBPACK_IMPORTED_MODULE_3__/* .RequestContextResult */ ._G({
            result: {
                case: "success",
                value: new _anysphere_proto_agent_v1_request_context_exec_pb_js__WEBPACK_IMPORTED_MODULE_3__/* .RequestContextSuccess */ .yW({
                    requestContext,
                    servedFromDiskCache: true,
                }),
            },
        });
    }
    getFullExecutor() {
        if (this.fullExecutor === undefined) {
            this.fullExecutor = this.options.createFullExecutor();
        }
        return this.fullExecutor;
    }
}