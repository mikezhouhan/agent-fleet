const ControlService = {
    typeName: "agent.v1.ControlService",
    methods: {
        /**
         * @generated from rpc agent.v1.ControlService.Ping
         */
        ping: {
            name: "Ping",
            I: control_service_pb/* PingRequest */.qp,
            O: control_service_pb/* PingResponse */.eJ,
            kind: MethodKind.Unary,
        },
        /**
         * Capabilities supported  (e.g. computer use)
         *
         * @generated from rpc agent.v1.ControlService.GetCapabilities
         */
        getCapabilities: {
            name: "GetCapabilities",
            I: control_service_pb/* GetCapabilitiesRequest */.cQ,
            O: control_service_pb/* GetCapabilitiesResponse */.y3,
            kind: MethodKind.Unary,
        },
        /**
         * Spawn
         *
         * @generated from rpc agent.v1.ControlService.Exec
         */
        exec: {
            name: "Exec",
            I: control_service_pb/* ExecRequest */.D7,
            O: control_service_pb/* ExecResponse */.fY,
            kind: MethodKind.ServerStreaming,
        },
        /**
         * Filesystem browsing (arbitrary paths).
         *
         * @generated from rpc agent.v1.ControlService.ListDirectory
         */
        listDirectory: {
            name: "ListDirectory",
            I: control_service_pb/* ListDirectoryRequest */.fV,
            O: control_service_pb/* ListDirectoryResponse */.Rz,
            kind: MethodKind.Unary,
        },
        /**
         * File read / write (arbitrary filesystem paths).
         *
         * @generated from rpc agent.v1.ControlService.ReadTextFile
         */
        readTextFile: {
            name: "ReadTextFile",
            I: control_service_pb/* ReadTextFileRequest */.b3,
            O: control_service_pb/* ReadTextFileResponse */.vy,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.WriteTextFile
         */
        writeTextFile: {
            name: "WriteTextFile",
            I: control_service_pb/* WriteTextFileRequest */.Wz,
            O: control_service_pb/* WriteTextFileResponse */.eb,
            kind: MethodKind.Unary,
        },
        /**
         * Binary file read / write
         *
         * @generated from rpc agent.v1.ControlService.ReadBinaryFile
         */
        readBinaryFile: {
            name: "ReadBinaryFile",
            I: control_service_pb/* ReadBinaryFileRequest */.nS,
            O: control_service_pb/* ReadBinaryFileResponse */.TV,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.WriteBinaryFile
         */
        writeBinaryFile: {
            name: "WriteBinaryFile",
            I: control_service_pb/* WriteBinaryFileRequest */.OS,
            O: control_service_pb/* WriteBinaryFileResponse */.Qp,
            kind: MethodKind.Unary,
        },
        /**
         * Workspace-contained streaming file export for user-initiated saves.
         *
         * @generated from rpc agent.v1.ControlService.ExportFile
         */
        exportFile: {
            name: "ExportFile",
            I: control_service_pb/* ExportFileRequest */.YQ,
            O: control_service_pb/* ExportFileResponse */.o_,
            kind: MethodKind.ServerStreaming,
        },
        /**
         * Git
         *
         * @generated from rpc agent.v1.ControlService.GetDiff
         */
        getDiff: {
            name: "GetDiff",
            I: utils_pb/* GetDiffRequest */.Vq,
            O: utils_pb/* GetDiffResponse */.df,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.BatchGetDiff
         */
        batchGetDiff: {
            name: "BatchGetDiff",
            I: control_service_pb/* BatchGetDiffRequest */.fi,
            O: control_service_pb/* BatchGetDiffResponse */.hO,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.GetWorkspaceChangesHash
         */
        getWorkspaceChangesHash: {
            name: "GetWorkspaceChangesHash",
            I: control_service_pb/* GetWorkspaceChangesHashRequest */.Sv,
            O: control_service_pb/* GetWorkspaceChangesHashResponse */.Y_,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.RefreshGithubAccessToken
         */
        refreshGithubAccessToken: {
            name: "RefreshGithubAccessToken",
            I: control_service_pb/* RefreshGithubAccessTokenRequest */.Vd,
            O: control_service_pb/* RefreshGithubAccessTokenResponse */.Jm,
            kind: MethodKind.Unary,
        },
        /**
         * Remote access
         *
         * @generated from rpc agent.v1.ControlService.WarmRemoteAccessServer
         */
        warmRemoteAccessServer: {
            name: "WarmRemoteAccessServer",
            I: control_service_pb/* WarmRemoteAccessServerRequest */.Er,
            O: control_service_pb/* WarmRemoteAccessServerResponse */.Ks,
            kind: MethodKind.Unary,
        },
        /**
         * Artifact uploads
         *
         * @generated from rpc agent.v1.ControlService.ListArtifacts
         */
        listArtifacts: {
            name: "ListArtifacts",
            I: control_service_pb/* ListArtifactsRequest */.FG,
            O: control_service_pb/* ListArtifactsResponse */.pl,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.UploadArtifacts
         */
        uploadArtifacts: {
            name: "UploadArtifacts",
            I: control_service_pb/* UploadArtifactsRequest */.AH,
            O: control_service_pb/* UploadArtifactsResponse */.Ce,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.PersistArtifactsToAgentStore
         */
        persistArtifactsToAgentStore: {
            name: "PersistArtifactsToAgentStore",
            I: control_service_pb/* PersistArtifactsToAgentStoreRequest */.OT,
            O: control_service_pb/* PersistArtifactsToAgentStoreResponse */.sK,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.PersistArtifactsToParentStore
         */
        persistArtifactsToParentStore: {
            name: "PersistArtifactsToParentStore",
            I: control_service_pb/* PersistArtifactsToParentStoreRequest */.D9,
            O: control_service_pb/* PersistArtifactsToParentStoreResponse */.f,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.RestoreArtifacts
         */
        restoreArtifacts: {
            name: "RestoreArtifacts",
            I: control_service_pb/* RestoreArtifactsRequest */.tA,
            O: control_service_pb/* RestoreArtifactsResponse */.pt,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.GetMcpRefreshTokens
         */
        getMcpRefreshTokens: {
            name: "GetMcpRefreshTokens",
            I: control_service_pb/* GetMcpRefreshTokensRequest */.RH,
            O: control_service_pb/* GetMcpRefreshTokensResponse */.TL,
            kind: MethodKind.Unary,
        },
        /**
         * Download (but do not start) the cursor server for a given commit.
         * This is used to pre-download the cursor server binary so that subsequent
         * WarmRemoteAccessServer calls are faster.
         *
         * @generated from rpc agent.v1.ControlService.DownloadCursorServer
         */
        downloadCursorServer: {
            name: "DownloadCursorServer",
            I: control_service_pb/* DownloadCursorServerRequest */.JO,
            O: control_service_pb/* DownloadCursorServerResponse */.Nj,
            kind: MethodKind.Unary,
        },
        /**
         * Update the exec-daemon's environment variables for subsequent process spawns.
         * This does NOT affect already-running processes.
         *
         * @generated from rpc agent.v1.ControlService.UpdateEnvironmentVariables
         */
        updateEnvironmentVariables: {
            name: "UpdateEnvironmentVariables",
            I: control_service_pb/* UpdateEnvironmentVariablesRequest */.t3,
            O: control_service_pb/* UpdateEnvironmentVariablesResponse */.zj,
            kind: MethodKind.Unary,
        },
        /**
         * Per-scope secrets for shell injection: the daemon sets them on exactly the
         * shell commands whose ShellArgs.secret_scope_id matches (a Grok Bot's agent
         * id), never on the daemon-wide environment, so a bot's values are absent
         * from every other command's environment and shell snapshot by default. The
         * scope id is caller-asserted under the daemon's shared bearer token, so
         * this is not a boundary against a hostile caller that already holds that
         * token (such a caller can also Exec or rewrite the daemon environment); the
         * box is one trust domain. With `secrets` unset the call only reports the
         * revision the daemon holds; with it set the daemon replaces the scope's
         * values at `revision`, ignoring a push older than what it already holds.
         * Revisions come from the server; values live in daemon memory only.
         *
         * @generated from rpc agent.v1.ControlService.SyncScopedSecrets
         */
        syncScopedSecrets: {
            name: "SyncScopedSecrets",
            I: control_service_pb/* SyncScopedSecretsRequest */.sD,
            O: control_service_pb/* SyncScopedSecretsResponse */.qM,
            kind: MethodKind.Unary,
        },
        /**
         * Reload agent skills from disk (~/.cursor/skills/, workspace skills, etc.).
         * Call after writing new SKILL.md files so the next agent turn sees them.
         *
         * @generated from rpc agent.v1.ControlService.ReloadAgentSkills
         */
        reloadAgentSkills: {
            name: "ReloadAgentSkills",
            I: control_service_pb/* ReloadAgentSkillsRequest */.Qj,
            O: control_service_pb/* ReloadAgentSkillsResponse */.q2,
            kind: MethodKind.Unary,
        },
        /**
         * Reload plugin-backed skills/subagents after the cloud harness materializes
         * plugin files onto disk. Empty reload_targets means "reload everything".
         *
         * @generated from rpc agent.v1.ControlService.ReloadPlugins
         */
        reloadPlugins: {
            name: "ReloadPlugins",
            I: control_service_pb/* ReloadPluginsRequest */.D3,
            O: control_service_pb/* ReloadPluginsResponse */.dj,
            kind: MethodKind.Unary,
        },
        /**
         * Download a plugin artifact tarball from a presigned URL and extract it on the VM.
         *
         * @generated from rpc agent.v1.ControlService.InstallPluginArtifact
         */
        installPluginArtifact: {
            name: "InstallPluginArtifact",
            I: control_service_pb/* InstallPluginArtifactRequest */.kM,
            O: control_service_pb/* InstallPluginArtifactResponse */.wY,
            kind: MethodKind.Unary,
        },
        /**
         * Load (and optionally reconcile) session MCP servers on the daemon from a
         * desired MCP config. The same operation the private-worker bridge performs
         * in-process at claim time, exposed for co-located callers (e.g. the Sand
         * in-box host) whose MCP config changes while the daemon runs. Servers are
         * registered lazily (child processes spawn on first use); servers already
         * registered with the same config are left untouched.
         *
         * @generated from rpc agent.v1.ControlService.LoadMcpServers
         */
        loadMcpServers: {
            name: "LoadMcpServers",
            I: control_service_pb/* LoadMcpServersRequest */.i5,
            O: control_service_pb/* LoadMcpServersResponse */.I,
            kind: MethodKind.Unary,
        },
        /**
         * In-memory per-desktop input lease: who may drive X11 on this VM. A human
         * acquire preempts a computer-use agent and aborts its in-flight input;
         * stamped ComputerUseArgs.desktop_lease_actor_id actions are rejected while
         * another actor holds the desktop. Authoritative on this daemon only.
         *
         * @generated from rpc agent.v1.ControlService.DesktopLease
         */
        desktopLease: {
            name: "DesktopLease",
            I: control_service_pb/* DesktopLeaseRequest */.A9,
            O: control_service_pb/* DesktopLeaseResponse */.Mj,
            kind: MethodKind.Unary,
        },
    }
};