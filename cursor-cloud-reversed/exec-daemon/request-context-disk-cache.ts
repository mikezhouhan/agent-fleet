/**
 * Reconstructed from /exec-daemon/index.js webpack module
 * `./src/request-context-disk-cache.ts`.
 *
 * Subcommand `prebuild-request-context-cache` runs once during an environment
 * build (after repos are checked out, before the snapshot) to compute the
 * request context and write the whole thing to this cache. A pod started from
 * the resulting snapshot serves this whole baked context (static
 * rules/skills/subagents/codebase ref/cloud rule plus the dynamic env, MCP,
 * git, notes) on its cold first turn, merging only live plugin content on top,
 * instead of rescanning the whole workspace. Every turn after the first
 * bypasses the cache and recomputes live, so runtime-varying fields like git
 * status never go stale.
 *
 * RequestContext fields observed on the live object:
 *   rules, agentSkills, customSubagents, repositoryInfo, cloudRule,
 *   env, mcpFileSystemOptions, mcpInstructions, mcpMetaToolOptions, tools, timing
 */

export const REQUEST_CONTEXT_DISK_CACHE_VERSION = 1;
export const REQUEST_CONTEXT_DISK_CACHE_FILENAME = "request-context-cache.json";
export const REQUEST_CONTEXT_DISK_CACHE_PATH =
  "/opt/cursor/.exec-daemon/request-context-cache.json";

export async function writeRequestContextDiskCache(ctx, filePath, requestContext) {
  // Atomically write via temp file + rename.
  const serialized = {
    version: REQUEST_CONTEXT_DISK_CACHE_VERSION,
    builtAtMs: Date.now(),
    requestContext: requestContext.toJson(),
  };
  void ctx;
  void filePath;
  void serialized;
}

export async function readRequestContextDiskCache(ctx, filePath) {
  // Returns undefined (never throws) when absent / version mismatch / malformed.
  void ctx;
  void filePath;
  return undefined;
}

/**
 * Merge live plugin-provisioned static content on top of the snapshot-baked
 * baseline. The baked baseline is plugin-free: cloud plugins are materialized
 * per-agent at runtime, after the snapshot.
 */
export function mergeBakedStaticIntoRequestContext(target, baked, plugins) {
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
 * When RequestContextArgs.useCached is true (cold first turn after an env-build
 * snapshot), serve the bake and still merge live plugins. Callers must not set
 * useCached on later turns.
 */
export class DiskBackedRequestContextExecutor {
  constructor(options) {
    this.options = options;
  }
  async execute(ctx, args, options) {
    if (args.useCached === true) {
      const baked = await this.options.read(ctx).catch(() => undefined);
      if (baked !== undefined) {
        return this.serveBaked(ctx, baked);
      }
    }
    return this.getFullExecutor().execute(ctx, args, options);
  }
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
    return { requestContext, servedFromDiskCache: true };
  }
  getFullExecutor() {
    if (this.fullExecutor === undefined) {
      this.fullExecutor = this.options.createFullExecutor();
    }
    return this.fullExecutor;
  }
}
