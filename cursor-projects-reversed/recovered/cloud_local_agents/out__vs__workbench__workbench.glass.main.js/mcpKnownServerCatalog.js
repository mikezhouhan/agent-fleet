// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mcpKnownServerCatalog.js
// byteRange: [17950830, 17952130)
// beautified: false
// truncated: false
O({"mcpKnownServerCatalog.js"(){"use strict"}});function M7p(t){return t.trim().toLowerCase().replace(/[-_\s]+/g,"")}function vJy(t){const e=B7p[t];return e!==void 0?e:/[a-z]/.test(t)&&/\d/.test(t)&&(t.match(/[a-z]+/g)??[]).every(i=>i.length<=2)?t.replace(/[a-z]+/g,i=>i.toUpperCase()):t.charAt(0).toUpperCase()+t.slice(1)}function D7p(t){const e=t.trim();if(!e||!U7p.test(e))return;const n=e.split(/[-_\s]+/).filter(i=>i.length>0).map(vJy).join(" ");if(!(!n||n===e))return n}function N7p(t){return t.trim().split(j7p).filter(e=>e.length>0)}function L7p(t){const e=t.join(" ");return D7p(e)??e}function O7p(t){const e=t[0]??[],n=[];for(let i=0;i<e.length;i++){const r=e[i];if(!t.every(o=>o[i]?.toLowerCase()===r.toLowerCase()))break;n.push(r)}return n}function bJy(t){const e=t.map(N7p),n=O7p(e),i=n.length>0&&e.every(r=>r.length>n.length);return e.map((r,s)=>{const o=i?r.slice(n.length):r;return o.length>0?L7p(o):t[s].trim()})}function F7p(t){if(t.length<2)return;const e=O7p(t.map(N7p));if(e.length!==0)return L7p(e)}function _Jy(t){const e=t.rawName.trim();if(!e)return;const n=t.knownServerName?.trim();if(n&&n!==e)return n;const i=t.plugin?.displayName?.trim();if(i&&i!==e){const s=(t.plugin?.mcpServerNames??[]).length===1,o=M7p(i)===M7p(e);if(s||o)return i}return D7p(e)}var B7p,U7p,j7p,z2a=
