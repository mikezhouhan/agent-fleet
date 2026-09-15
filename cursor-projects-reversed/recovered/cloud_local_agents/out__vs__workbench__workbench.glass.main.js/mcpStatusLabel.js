// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mcpStatusLabel.js
// byteRange: [16905479, 16906823)
// beautified: false
// truncated: false
O({"mcpStatusLabel.js"(){"use strict";hyn()}});function jSt(t,e,n=!1){const i=t||"",r=e||"",s=H7t.value.collator.compare(i,r);return H7t.value.collatorIsNumeric&&s===0&&i!==r?i<r?-1:1:s}function oCp(t,e){const[n,i]=aCp(t),[r,s]=aCp(e);let o=H7t.value.collator.compare(i,s);if(o===0){if(H7t.value.collatorIsNumeric&&i!==s)return i<s?-1:1;if(o=H7t.value.collator.compare(n,r),H7t.value.collatorIsNumeric&&o===0&&n!==r)return n<r?-1:1}return o}function aCp(t,e=!1){const n=t?lCp.exec(t):[];let i=[n&&n[1]||"",n&&n[3]||""];return e&&(!i[0]&&i[1]||i[0]&&i[0].charAt(0)===".")&&(i=[i[0]+"."+i[1],""]),i}function kWy(t,e,n=!1){return n||(t=t&&t.toLowerCase(),e=e&&e.toLowerCase()),t===e?0:t<e?-1:1}function $4r(t,e,n=!1){const i=t.split(wS),r=e.split(wS),s=i.length-1,o=r.length-1;let a,l;for(let c=0;;c++){if(a=s===c,l=o===c,a&&l)return jSt(i[c],r[c],n);if(a)return-1;if(l)return 1;const u=kWy(i[c],r[c],n);if(u!==0)return u}}function W4r(t,e,n){const i=t.toLowerCase(),r=e.toLowerCase(),s=CWy(t,e,n);if(s)return s;const o=i.endsWith(n),a=r.endsWith(n);if(o!==a)return o?-1:1;const l=jSt(i,r);return l!==0?l:i.localeCompare(r)}function CWy(t,e,n){const i=t.toLowerCase(),r=e.toLowerCase(),s=i.startsWith(n),o=r.startsWith(n);if(s!==o)return s?-1:1;if(s&&o){if(i.length<r.length)return-1;if(i.length>r.length)return 1}return 0}var H7t,TWy,EWy,lCp,Ihi=
