// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: mcpKnownServerCatalog.js
// byteRange: [16827995, 16829295)
// beautified: false
// truncated: false
j({"mcpKnownServerCatalog.js"(){"use strict"}});function tCd(e){return e.trim().toLowerCase().replace(/[-_\s]+/g,"")}function oDf(e){const t=aCd[e];return t!==void 0?t:/[a-z]/.test(e)&&/\d/.test(e)&&(e.match(/[a-z]+/g)??[]).every(i=>i.length<=2)?e.replace(/[a-z]+/g,i=>i.toUpperCase()):e.charAt(0).toUpperCase()+e.slice(1)}function nCd(e){const t=e.trim();if(!t||!cCd.test(t))return;const n=t.split(/[-_\s]+/).filter(i=>i.length>0).map(oDf).join(" ");if(!(!n||n===t))return n}function iCd(e){return e.trim().split(lCd).filter(t=>t.length>0)}function rCd(e){const t=e.join(" ");return nCd(t)??t}function sCd(e){const t=e[0]??[],n=[];for(let i=0;i<t.length;i++){const r=t[i];if(!e.every(o=>o[i]?.toLowerCase()===r.toLowerCase()))break;n.push(r)}return n}function aDf(e){const t=e.map(iCd),n=sCd(t),i=n.length>0&&t.every(r=>r.length>n.length);return t.map((r,s)=>{const o=i?r.slice(n.length):r;return o.length>0?rCd(o):e[s].trim()})}function oCd(e){if(e.length<2)return;const t=sCd(e.map(iCd));if(t.length!==0)return rCd(t)}function cDf(e){const t=e.rawName.trim();if(!t)return;const n=e.knownServerName?.trim();if(n&&n!==t)return n;const i=e.plugin?.displayName?.trim();if(i&&i!==t){const s=(e.plugin?.mcpServerNames??[]).length===1,o=tCd(i)===tCd(t);if(s||o)return i}return nCd(t)}var aCd,cCd,lCd,KXs=
