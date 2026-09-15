// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: reactTranscriptGalleryData.js
// byteRange: [29977247, 29981356)
// beautified: false
// truncated: false
O({"reactTranscriptGalleryData.js"(){"use strict";Pt(),od(),gLt(),han(),ior(),lan(),CQe(),ZGn(),oLt(),hre(),nan(),Xu(),af(),bu(),bWe(),Sgg(),Sns(),kns(),VCn(),TAi=Date.UTC(2024,0,1,12,0,0),UVt=ws.AI,fPl=ws.HUMAN,vPl=Zs.TOOL_FORMER,whf=Zs.THINKING,khf=`export function Settings() {
	return (
		<div className="settings">
			<h1>Settings</h1>
		</div>
	);
}`,Chf=`import { Toggle } from "./Toggle";
import { useTheme } from "../hooks/useTheme";

export function Settings() {
	const { darkMode, toggle } = useTheme();
	return (
		<div className="settings">
			<h1>Settings</h1>
			<Toggle checked={darkMode} onChange={toggle} label="Dark mode" />
		</div>
	);
}`,Thf=`export function useTheme() {
	const [darkMode, setDarkMode] = useState(false);
	return { darkMode, toggle: () => setDarkMode(v => !v) };
}`,Ehf=`export function useTheme() {
	const [darkMode, setDarkMode] = useState(
		() => localStorage.getItem("theme") === "dark"
	);
	useEffect(() => {
		localStorage.setItem("theme", darkMode ? "dark" : "light");
	}, [darkMode]);
	return { darkMode, toggle: () => setDarkMode(v => !v) };
}`,xhf=["## Dark mode toggle added","","I added a `useTheme` hook and wired a toggle into the settings page.","","- Reads the saved preference from `localStorage`","- Falls back to the system `prefers-color-scheme`","- Toggles the `.dark` class on the document root","","```tsx","const { darkMode, toggle } = useTheme();","```","","See the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/CSS/prefers-color-scheme) for details."].join(`
`)}});import{useMemo as Ihf,useState as Ibs}from"./react-runtime/react/esm-index-production.js";import{jsx as Mke,jsxs as Abs}from"./react-runtime/react/esm-jsx-runtime-production.js";function bPl({active:t,children:e,onClick:n}){return Mke("button",{className:`px-2 py-1 text-xs rounded border cursor-pointer ${t?"bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] border-transparent":"bg-transparent text-[var(--vscode-foreground)] border-[var(--vscode-input-border)]"}`,onClick:n,type:"button",children:e})}function L80({copyToClipboard:t,onUrlClick:e}){const[n,i]=Ibs("compact-grouped"),[r,s]=Ibs(!0),[o,a]=Ibs(!1),[l,c]=Ibs(new Set),u=Ihf(()=>D80({density:n,generating:r,approvals:o}),[n,r,o]),d=Ihf(()=>({isOpen:h=>l.has(h.rowId),onOpenChange:(h,p)=>c(g=>{const v=new Set(g);return p?v.add(h.rowId):v.delete(h.rowId),v})}),[l]);return Abs("div",{className:"p-4 flex flex-col gap-4 w-full box-border overflow-y-auto h-full",children:[Abs("div",{className:"flex flex-col gap-1",children:[Mke("h3",{className:"text-base font-semibold",children:"React Transcript"}),Mke("p",{className:"text-sm text-[var(--vscode-descriptionForeground)]",children:'Real transcript pipeline over mock composer data: header/bubble entry creation, grouping, hydration, tool-call conversion, and tail status \u2014 rendered with AgentTranscriptRowView. Activity groups and thinking are collapsed by default; while generating, a live status row reports the current action. Turn on Approvals for a third turn with three queued pending tools (stacked deck on the surfaced card, "3 tools pending" in the group).'})]}),Abs("div",{className:"flex flex-row flex-wrap items-center gap-2",children:[Mke("span",{className:"text-xs text-[var(--vscode-descriptionForeground)] w-16",children:"Density"}),Ahf.map(h=>Mke(bPl,{active:h===n,onClick:()=>i(h),children:h},h))]}),Abs("div",{className:"flex flex-row flex-wrap items-center gap-2",children:[Mke("span",{className:"text-xs text-[var(--vscode-descriptionForeground)] w-16",children:"State"}),Mke(bPl,{active:r,onClick:()=>s(h=>!h),children:"Generating"}),Mke(bPl,{active:o,onClick:()=>a(h=>!h),children:"Approvals"})]}),Mke("div",{className:"virtualized-composer-messages-content-shell","data-react-transcript":"true",style:Rhf,children:Mke(Yii,{conversationDensity:n,copyToClipboard:t,getTurnActions:Phf,onFileClick:()=>{},onUrlClick:e,renderEndOfTurnSummary:Mhf,richLinkPresentationProvider:Kll,children:Mke(rZo,{value:Dhf,children:u.map(h=>Mke(B_t,{row:h,workGroupControl:d},h.rowId))})})})]})}var Ahf,Rhf,Phf,Mhf,Dhf,O80=
