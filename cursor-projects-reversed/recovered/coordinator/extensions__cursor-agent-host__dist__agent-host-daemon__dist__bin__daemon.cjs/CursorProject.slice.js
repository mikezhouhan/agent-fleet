// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: extensions/cursor-agent-host/dist/agent-host-daemon/dist/bin/daemon.cjs
// kind: marker-window
// name: CursorProject
// byteRange: [19622583, 19630788)
// beautified: false
// truncated: false
           } catch {
                fileDiff.afterFileContents = "";
              }
            }
          }
        } else {
          fileDiff.afterFileContents = "";
        }
      } catch (error2) {
        logger23.error(ctx, "Error fetching file contents for diff", error2);
      }
    }));
  }
  const fileDiffMap = /* @__PURE__ */ new Map();
  for (const fileDiff of diff.diffs) {
    const filePath = fileDiff.to !== "/dev/null" ? fileDiff.to : fileDiff.from;
    if (filePath) {
      fileDiffMap.set(filePath, fileDiff);
    }
  }
  const allFilePaths = [...fileDiffMap.keys()];
  const refForContent = request.ref.length > 0 ? request.ref : "HEAD";
  try {
    const generatedResults = await checkFilesGenerated({
      repoRoot: cwd,
      filePaths: allFilePaths,
      getContent: async (filePath) => {
        const fileDiff = fileDiffMap.get(filePath);
        if (!fileDiff) {
          return void 0;
        }
        if (fileDiff.afterFileContents !== void 0) {
          return fileDiff.afterFileContents;
        }
        try {
          if (fileDiff.to && fileDiff.to !== "/dev/null") {
            return await runGit(cwd, ["show", `${refForContent}:${fileDiff.to}`], {
              shouldNotTrimOutput: true
            });
          }
        } catch {
        }
        return void 0;
      }
    });
    for (const [filePath, result] of generatedResults) {
      const fileDiff = fileDiffMap.get(filePath);
      if (fileDiff) {
        fileDiff.isGenerated = result.isGenerated;
      }
    }
  } catch (error2) {
    logger23.warn(ctx, "Generated-file detection failed; continuing without it", {
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  }
  const patchId = request.computePatchId === true ? await computeStablePatchId(cwd, appendDiffForPatchId(diffRaw, serializeUntrackedFilesForPatchId(untrackedFilesForPatchId))) : void 0;
  const headSha = request.returnHeadSha === true ? (await runGit(cwd, ["rev-parse", "HEAD"])).trim() : void 0;
  const hasUncommittedChanges = request.returnHeadSha === true ? (await runGit(cwd, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all"
  ])).trim().length > 0 : void 0;
  const response = new GetDiffResponse({
    diff,
    submoduleDiffs: [],
    patchId,
    headSha,
    hasUncommittedChanges
  });
  const maxResponseBytes = request.maxResponseBytes ?? 0;
  if (maxResponseBytes > 0) {
    const responseBytes = response.toBinary().byteLength;
    if (responseBytes > maxResponseBytes) {
      throw new Error(`GetDiffResponseTooLarge: ${responseBytes} bytes exceeds the ${maxResponseBytes} byte limit`);
    }
  }
  return response;
}
var fs10, import_node_path50, logger23, COMMON_DEFAULT_BRANCHES, LocalGitDiffExecutor;
var init_git_diff3 = __esm({
  "../local-exec/dist/git-diff.js"() {
    "use strict";
    fs10 = __toESM(require("node:fs/promises"), 1);
    import_node_path50 = __toESM(require("node:path"), 1);
    init_dist2();
    init_dist5();
    init_utils_pb2();
    init_git_diff_parser();
    logger23 = createLogger("local-git-diff");
    COMMON_DEFAULT_BRANCHES = ["main", "master", "develop"];
    LocalGitDiffExecutor = class {
      async execute(ctx, args) {
        return getLocalGitDiff(ctx, args.cwd, args);
      }
    };
  }
});

// ../local-exec/dist/mcp-allowlist-precheck.js
var LocalMcpAllowlistPrecheckExecutor;
var init_mcp_allowlist_precheck2 = __esm({
  "../local-exec/dist/mcp-allowlist-precheck.js"() {
    "use strict";
    init_mcp_allowlist_precheck_exec_pb();
    LocalMcpAllowlistPrecheckExecutor = class {
      constructor(permissionsService) {
        this.permissionsService = permissionsService;
      }
      async execute(ctx, args) {
        const allowlisted = await this.permissionsService.isMcpFullyAllowlisted(ctx, {
          providerIdentifier: args.providerIdentifier,
          toolName: args.toolName,
          annotationsJson: args.annotationsJson
        });
        return new McpAllowlistPrecheckResult({ allowlisted });
      }
    };
  }
});

// ../local-exec/dist/internal-paths.js
function getCursorProjectsInternalDir(absolutePath) {
  if (!isDescendant(CURSOR_PROJECTS_ROOT, absolutePath)) {
    return void 0;
  }
  if (absolutePath === CURSOR_PROJECTS_ROOT) {
    return void 0;
  }
  const rest = (0, import_node_path51.relative)(CURSOR_PROJECTS_ROOT, absolutePath);
  const parts = rest.split(import_node_path51.sep).filter(Boolean);
  return parts.length >= 2 ? parts[1] : void 0;
}
function isCursorProjectsPath2(absolutePath) {
  return isDescendant(CURSOR_PROJECTS_ROOT, absolutePath) && absolutePath !== CURSOR_PROJECTS_ROOT;
}
function isCursorWorktreesPath(absolutePath) {
  return isDescendant(CURSOR_WORKTREES_ROOT, absolutePath) && absolutePath !== CURSOR_WORKTREES_ROOT;
}
function getCursorWorktreeRoot(absolutePath) {
  if (!isCursorWorktreesPath(absolutePath)) {
    return void 0;
  }
  const rest = (0, import_node_path51.relative)(CURSOR_WORKTREES_ROOT, absolutePath);
  const parts = rest.split(import_node_path51.sep).filter(Boolean);
  if (parts.length === 0) {
    return void 0;
  }
  return (0, import_node_path51.join)(CURSOR_WORKTREES_ROOT, parts[0]);
}
function isCursorProjectsInternalPath(absolutePath, internalDirs) {
  const internalDir = getCursorProjectsInternalDir(absolutePath);
  return internalDir !== void 0 && internalDirs.includes(internalDir);
}
var import_node_os17, import_node_path51, CURSOR_PROJECTS_ROOT, CURSOR_WORKTREES_ROOT;
var init_internal_paths = __esm({
  "../local-exec/dist/internal-paths.js"() {
    "use strict";
    import_node_os17 = require("node:os");
    import_node_path51 = require("node:path");
    init_dist5();
    CURSOR_PROJECTS_ROOT = (0, import_node_path51.join)((0, import_node_os17.homedir)(), ".cursor", "projects");
    CURSOR_WORKTREES_ROOT = (0, import_node_path51.join)((0, import_node_os17.homedir)(), ".cursor", "worktrees");
  }
});

// ../local-exec/dist/permissions-path.js
function makePermissionsPath(resolvedPath, originalPath, resolution) {
  return {
    resolvedPath,
    originalPath,
    resolution
  };
}
function classifyErrno(err) {
  switch (err.code) {
    case "ENOENT":
      return { status: "newFile" };
    case "EACCES":
    case "EPERM":
      return { status: "permissionDenied", errno: err.code };
    case "ELOOP":
      return { status: "symlinkLoop", errno: err.code };
    default:
      return {
        status: "unknownError",
        errno: err.code ?? "UNKNOWN",
        message: err.message
      };
  }
}
async function resolvePermissionsPath(filePath, basePath) {
  const normalized = resolvePath(filePath, basePath);
  try {
    const resolved = await (0, import_promises38.realpath)(normalized);
    return makePermissionsPath(resolved, normalized, { status: "resolved" });
  } catch (realpathErr) {
    const err = realpathErr;
    if (err.code !== "ENOENT") {
      return makePermissionsPath(normalized, normalized, classifyErrno(err));
    }
    try {
      const stats = await (0, import_promises38.lstat)(normalized);
      if (stats.isSymbolicLink()) {
        let symlinkTarget = null;
        try {
          symlinkTarget = await (0, import_promises38.readlink)(normalized);
        } catch {
        }
        return makePermissionsPath(normalized, normalized, {
          status: "danglingSymlink",
          symlinkTarget
        });
      }
      return makePermissionsPath(normalized, normalized, {
        status: "unknownError",
        errno: "ENOENT",
        message: "realpath returned ENOENT but lstat found a non-symlink entry"
      });
    } catch (lstatErr) {
      const lErr = lstatErr;
      if (lErr.code === "ENOENT") {
        return resolveNewFilePath(normalized);
      }
      return makePermissionsPath(normalized, normalized, classifyErrno(lErr));
    }
  }
}
async function resolveNewFilePath(normalized) {
  let current = (0, import_node_path52.dirname)(normalized);
  const trailingComponents = [(0, import_node_path52.basename)(normalized)];
  while ((0, import_node_path52.dirname)(current) !== current) {
    try {
      const resolvedAncestor = await (0, import_promises38.realpath)(current);
      const resolvedPath = (0, import_nod
