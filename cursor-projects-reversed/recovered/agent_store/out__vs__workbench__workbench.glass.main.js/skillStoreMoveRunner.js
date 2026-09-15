// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: skillStoreMoveRunner.js
// byteRange: [26335875, 26337110)
// beautified: false
// truncated: false
O({"skillStoreMoveRunner.js"(){"use strict";Vs(),WIg(),HIg={info:ei.Info,warning:ei.Warning,error:ei.Error},zIg={confirmed:!1,deleted:!1,storeUnavailable:!0}}});async function S41(t,e){const{authService:n,commandService:i,notificationService:r,progressService:s,pluginsProviderService:o,marketplaceProvider:a,onLocalSkillRestored:l,onSkillFilesMoved:c}=t;try{await s.withProgress({location:15,title:`Unpublishing skill "${e.name}"...`},async()=>{const u=await i.executeCommand(Afl,{pluginId:e.pluginId});if(u===void 0||!u.restored)throw new Error(u?.error??"Could not restore the skill to your local skills, so nothing was unpublished.");const d=await n.dashboardClient(),h=n.getTeamId();await d.unpublishPlugin(new S1a({pluginId:BigInt(e.pluginId),...h!==void 0?{teamId:h}:{},commitMessage:`Unpublish skill ${e.name}`}),{headers:qd(vi())}),l(u.skillPaths);try{if(u.filesMove!==void 0)try{await c(u.filesMove)}catch{}await i.executeCommand(Rfl,{pluginId:e.pluginId}),await Promise.all([o.refreshPluginData(),o.refreshInstalledPlugins({useReplica:!1})]),await o.refreshMarketplacePlugins(a),o.notifyPluginsChanged()}catch{}})}catch(u){r.error(`Failed to unpublish skill "${e.name}": ${u instanceof Error?u.message:String(u)}`)}}var w41=
