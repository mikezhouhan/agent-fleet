// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: worktreePathUtils.js
// byteRange: [25821668, 25854737)
// beautified: false
// truncated: false
O({"worktreePathUtils.js"(){"use strict";tN(),Sl(),Pi()}});function gR1(){return!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(gxn.userAgent)||/Macintosh/i.test(gxn.userAgent)&&gxn.maxTouchPoints&&gxn.maxTouchPoints>1||!isSecureContext)}function Zos(t,e){return{...t,...e,tags:{...t.tags,...e.tags},onFormOpen:()=>{e.onFormOpen?.(),t.onFormOpen?.()},onFormClose:()=>{e.onFormClose?.(),t.onFormClose?.()},onSubmitSuccess:(n,i)=>{e.onSubmitSuccess?.(n,i),t.onSubmitSuccess?.(n,i)},onSubmitError:n=>{e.onSubmitError?.(n),t.onSubmitError?.(n)},onFormSubmitted:()=>{e.onFormSubmitted?.(),t.onFormSubmitted?.()},themeDark:{...t.themeDark,...e.themeDark},themeLight:{...t.themeLight,...e.themeLight}}}function fR1(t){const e=ZL.createElement("style");return e.textContent=`
.widget__actor {
  position: fixed;
  z-index: var(--z-index);
  margin: var(--page-margin);
  inset: var(--actor-inset);

  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;

  font-family: inherit;
  font-size: var(--font-size);
  font-weight: 600;
  line-height: 1.14em;
  text-decoration: none;

  background: var(--actor-background, var(--background));
  border-radius: var(--actor-border-radius, 1.7em/50%);
  border: var(--actor-border, var(--border));
  box-shadow: var(--actor-box-shadow, var(--box-shadow));
  color: var(--actor-color, var(--foreground));
  fill: var(--actor-color, var(--foreground));
  cursor: pointer;
  opacity: 1;
  transition: transform 0.2s ease-in-out;
  transform: translate(0, 0) scale(1);
}
.widget__actor[aria-hidden="true"] {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transform: translate(0, 16px) scale(0.98);
}

.widget__actor:hover {
  background: var(--actor-hover-background, var(--background));
  filter: var(--interactive-filter);
}

.widget__actor svg {
  width: 1.14em;
  height: 1.14em;
}

@media (max-width: 600px) {
  .widget__actor span {
    display: none;
  }
}
`,t&&e.setAttribute("nonce",t),e}function hke(t,e){return Object.entries(e).forEach(([n,i])=>{t.setAttributeNS(null,n,i)}),t}function vR1(){const t=a=>C2e.document.createElementNS(Zyg,a),e=hke(t("svg"),{width:`${iGt}`,height:`${iGt}`,viewBox:`0 0 ${iGt} ${iGt}`,fill:"var(--actor-color, var(--foreground))"}),n=hke(t("g"),{clipPath:"url(#clip0_57_80)"}),i=hke(t("path"),{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M15.6622 15H12.3997C12.2129 14.9959 12.031 14.9396 11.8747 14.8375L8.04965 12.2H7.49956V19.1C7.4875 19.3348 7.3888 19.5568 7.22256 19.723C7.05632 19.8892 6.83435 19.9879 6.59956 20H2.04956C1.80193 19.9968 1.56535 19.8969 1.39023 19.7218C1.21511 19.5467 1.1153 19.3101 1.11206 19.0625V12.2H0.949652C0.824431 12.2017 0.700142 12.1783 0.584123 12.1311C0.468104 12.084 0.362708 12.014 0.274155 11.9255C0.185602 11.8369 0.115689 11.7315 0.0685419 11.6155C0.0213952 11.4995 -0.00202913 11.3752 -0.00034808 11.25V3.75C-0.00900498 3.62067 0.0092504 3.49095 0.0532651 3.36904C0.0972798 3.24712 0.166097 3.13566 0.255372 3.04168C0.344646 2.94771 0.452437 2.87327 0.571937 2.82307C0.691437 2.77286 0.82005 2.74798 0.949652 2.75H8.04965L11.8747 0.1625C12.031 0.0603649 12.2129 0.00407221 12.3997 0H15.6622C15.9098 0.00323746 16.1464 0.103049 16.3215 0.278167C16.4966 0.453286 16.5964 0.689866 16.5997 0.9375V3.25269C17.3969 3.42959 18.1345 3.83026 18.7211 4.41679C19.5322 5.22788 19.9878 6.32796 19.9878 7.47502C19.9878 8.62209 19.5322 9.72217 18.7211 10.5333C18.1345 11.1198 17.3969 11.5205 16.5997 11.6974V14.0125C16.6047 14.1393 16.5842 14.2659 16.5395 14.3847C16.4948 14.5035 16.4268 14.6121 16.3394 14.7042C16.252 14.7962 16.147 14.8698 16.0307 14.9206C15.9144 14.9714 15.7891 14.9984 15.6622 15ZM1.89695 10.325H1.88715V4.625H8.33715C8.52423 4.62301 8.70666 4.56654 8.86215 4.4625L12.6872 1.875H14.7247V13.125H12.6872L8.86215 10.4875C8.70666 10.3835 8.52423 10.327 8.33715 10.325H2.20217C2.15205 10.3167 2.10102 10.3125 2.04956 10.3125C1.9981 10.3125 1.94708 10.3167 1.89695 10.325ZM2.98706 12.2V18.1625H5.66206V12.2H2.98706ZM16.5997 9.93612V5.01393C16.6536 5.02355 16.7072 5.03495 16.7605 5.04814C17.1202 5.13709 17.4556 5.30487 17.7425 5.53934C18.0293 5.77381 18.2605 6.06912 18.4192 6.40389C18.578 6.73866 18.6603 7.10452 18.6603 7.47502C18.6603 7.84552 18.578 8.21139 18.4192 8.54616C18.2605 8.88093 18.0293 9.17624 17.7425 9.41071C17.4556 9.64518 17.1202 9.81296 16.7605 9.90191C16.7072 9.91509 16.6536 9.9265 16.5997 9.93612Z"});e.appendChild(n).appendChild(i);const r=t("defs"),s=hke(t("clipPath"),{id:"clip0_57_80"}),o=hke(t("rect"),{width:`${iGt}`,height:`${iGt}`,fill:"white"});return s.appendChild(o),r.appendChild(s),e.appendChild(r).appendChild(s).appendChild(o),e}function bR1({triggerLabel:t,triggerAriaLabel:e,shadow:n,styleNonce:i}){const r=ZL.createElement("button");if(r.type="button",r.className="widget__actor",r.ariaHidden="false",r.ariaLabel=e||t||Phl,r.appendChild(vR1()),t){const o=ZL.createElement("span");o.appendChild(ZL.createTextNode(t)),r.appendChild(o)}const s=fR1(i);return{el:r,appendToDom(){n.appendChild(s),n.appendChild(r)},removeFromDom(){r.remove(),s.remove()},show(){r.ariaHidden="false"},hide(){r.ariaHidden="true"}}}function yyg(t){return`
  --foreground: ${t.foreground};
  --background: ${t.background};
  --accent-foreground: ${t.accentForeground};
  --accent-background: ${t.accentBackground};
  --success-color: ${t.successColor};
  --error-color: ${t.errorColor};
  --border: ${t.border};
  --box-shadow: ${t.boxShadow};
  --outline: ${t.outline};
  --interactive-filter: ${t.interactiveFilter};
  `}function _R1({colorScheme:t,themeDark:e,themeLight:n,styleNonce:i}){const r=ZL.createElement("style");return r.textContent=`
:host {
  --font-family: system-ui, 'Helvetica Neue', Arial, sans-serif;
  --font-size: 14px;
  --z-index: 100000;

  --page-margin: 16px;
  --inset: auto 0 0 auto;
  --actor-inset: var(--inset);

  font-family: var(--font-family);
  font-size: var(--font-size);

  ${t!=="system"?"color-scheme: only light;":""}

  ${yyg(t==="dark"?{...Nhl,...e}:{...Jyg,...n})}
}

${t==="system"?`
@media (prefers-color-scheme: dark) {
  :host {
    ${yyg({...Nhl,...e})}
  }
}`:""}
}
`,i&&r.setAttribute("nonce",i),r}function yR1(){return Qd()?.getIntegrationByName("Feedback")}function Zkt(t,e){for(var n in e)t[n]=e[n];return t}function Syg(t){var e=t.parentNode;e&&e.removeChild(t)}function yE(t,e,n){var i,r,s,o={};for(s in e)s=="key"?i=e[s]:s=="ref"?r=e[s]:o[s]=e[s];if(arguments.length>2&&(o.children=arguments.length>3?ras.call(arguments,2):n),typeof t=="function"&&t.defaultProps!=null)for(s in t.defaultProps)o[s]===void 0&&(o[s]=t.defaultProps[s]);return Jos(t,o,i,r,null)}function Jos(t,e,n,i,r){var s={type:t,props:e,key:n,ref:i,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,constructor:void 0,__v:r??++eSg,__i:-1,__u:0};return r==null&&bO.vnode!=null&&bO.vnode(s),s}function Aki(t){return t.children}function eas(t,e){this.props=t,this.context=e}function pxn(t,e){if(e==null)return t.__?pxn(t.__,t.__i+1):null;for(var n;e<t.__k.length;e++)if((n=t.__k[e])!=null&&n.__e!=null)return n.__e;return typeof t.type=="function"?pxn(t):null}function SR1(t,e,n){var i,r=t.__v,s=r.__e,o=t.__P;if(o)return(i=Zkt({},r)).__v=r.__v+1,bO.vnode&&bO.vnode(i),Shl(o,i,r,t.__n,o.ownerSVGElement!==void 0,32&r.__u?[s]:null,e,s??pxn(r),!!(32&r.__u),n),i.__.__k[i.__i]=i,i.__d=void 0,i.__e!=s&&wyg(i),i}function wyg(t){var e,n;if((t=t.__)!=null&&t.__c!=null){for(t.__e=t.__c.base=null,e=0;e<t.__k.length;e++)if((n=t.__k[e])!=null&&n.__e!=null){t.__e=t.__c.base=n.__e;break}return wyg(t)}}function kyg(t){(!t.__d&&(t.__d=!0)&&rGt.push(t)&&!tas.__r++||tSg!==bO.debounceRendering)&&((tSg=bO.debounceRendering)||nSg)(tas)}function tas(){var t,e,n,i=[],r=[];for(rGt.sort(Ohl);t=rGt.shift();)t.__d&&(n=rGt.length,e=SR1(t,i,r)||e,n===0||rGt.length>n?(whl(i,e,r),r.length=i.length=0,e=void 0,rGt.sort(Ohl)):e&&bO.__c&&bO.__c(e,sas));e&&whl(i,e,r),tas.__r=0}function Cyg(t,e,n,i,r,s,o,a,l,c,u){var d,h,p,g,v,b=i&&i.__k||sas,_=e.length;for(n.__d=l,wR1(n,e,b),l=n.__d,d=0;d<_;d++)(p=n.__k[d])!=null&&typeof p!="boolean"&&typeof p!="function"&&(h=p.__i===-1?fxn:b[p.__i]||fxn,p.__i=d,Shl(t,p,h,r,s,o,a,l,c,u),g=p.__e,p.ref&&h.ref!=p.ref&&(h.ref&&khl(h.ref,null,p),u.push(p.ref,p.__c||g,p)),v==null&&g!=null&&(v=g),65536&p.__u||h.__k===p.__k?l=Tyg(p,l,t):typeof p.type=="function"&&p.__d!==void 0?l=p.__d:g&&(l=g.nextSibling),p.__d=void 0,p.__u&=-196609);n.__d=l,n.__e=v}function wR1(t,e,n){var i,r,s,o,a,l=e.length,c=n.length,u=c,d=0;for(t.__k=[],i=0;i<l;i++)(r=t.__k[i]=(r=e[i])==null||typeof r=="boolean"||typeof r=="function"?null:typeof r=="string"||typeof r=="number"||typeof r=="bigint"||r.constructor==String?Jos(null,r,null,null,r):oas(r)?Jos(Aki,{children:r},null,null,null):r.constructor===void 0&&r.__b>0?Jos(r.type,r.props,r.key,r.ref?r.ref:null,r.__v):r)!=null?(r.__=t,r.__b=t.__b+1,a=kR1(r,n,o=i+d,u),r.__i=a,s=null,a!==-1&&(u--,(s=n[a])&&(s.__u|=131072)),s==null||s.__v===null?(a==-1&&d--,typeof r.type!="function"&&(r.__u|=65536)):a!==o&&(a===o+1?d++:a>o?u>l-o?d+=a-o:d--:d=a<o&&a==o-1?a-o:0,a!==i+d&&(r.__u|=65536))):(s=n[i])&&s.key==null&&s.__e&&(s.__e==t.__d&&(t.__d=pxn(s)),Chl(s,s,!1),n[i]=null,u--);if(u)for(i=0;i<c;i++)(s=n[i])!=null&&(131072&s.__u)==0&&(s.__e==t.__d&&(t.__d=pxn(s)),Chl(s,s))}function Tyg(t,e,n){var i,r;if(typeof t.type=="function"){for(i=t.__k,r=0;i&&r<i.length;r++)i[r]&&(i[r].__=t,e=Tyg(i[r],e,n));return e}t.__e!=e&&(n.insertBefore(t.__e,e||null),e=t.__e);do e=e&&e.nextSibling;while(e!=null&&e.nodeType===8);return e}function kR1(t,e,n,i){var r=t.key,s=t.type,o=n-1,a=n+1,l=e[n];if(l===null||l&&r==l.key&&s===l.type)return n;if(i>(l!=null&&(131072&l.__u)==0?1:0))for(;o>=0||a<e.length;){if(o>=0){if((l=e[o])&&(131072&l.__u)==0&&r==l.key&&s===l.type)return o;o--}if(a<e.length){if((l=e[a])&&(131072&l.__u)==0&&r==l.key&&s===l.type)return a;a++}}return-1}function Eyg(t,e,n){e[0]==="-"?t.setProperty(e,n??""):t[e]=n==null?"":typeof n!="number"||iSg.test(e)?n:n+"px"}function nas(t,e,n,i,r){var s;e:if(e==="style")if(typeof n=="string")t.style.cssText=n;else{if(typeof i=="string"&&(t.style.cssText=i=""),i)for(e in i)n&&e in n||Eyg(t.style,e,"");if(n)for(e in n)i&&n[e]===i[e]||Eyg(t.style,e,n[e])}else if(e[0]==="o"&&e[1]==="n")s=e!==(e=e.replace(/(PointerCapture)$|Capture$/i,"$1")),e=e.toLowerCase()in t?e.toLowerCase().slice(2):e.slice(2),t.l||(t.l={}),t.l[e+s]=n,n?i?n.u=i.u:(n.u=Date.now(),t.addEventListener(e,s?Iyg:xyg,s)):t.removeEventListener(e,s?Iyg:xyg,s);else{if(r)e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!=="width"&&e!=="height"&&e!=="href"&&e!=="list"&&e!=="form"&&e!=="tabIndex"&&e!=="download"&&e!=="rowSpan"&&e!=="colSpan"&&e!=="role"&&e in t)try{t[e]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&e[4]!=="-"?t.removeAttribute(e):t.setAttribute(e,n))}}function xyg(t){if(this.l){var e=this.l[t.type+!1];if(t.t){if(t.t<=e.u)return}else t.t=Date.now();return e(bO.event?bO.event(t):t)}}function Iyg(t){if(this.l)return this.l[t.type+!0](bO.event?bO.event(t):t)}function Shl(t,e,n,i,r,s,o,a,l,c){var u,d,h,p,g,v,b,_,y,S,k,C,T,E,I,A=e.type;if(e.constructor!==void 0)return null;128&n.__u&&(l=!!(32&n.__u),s=[a=e.__e=n.__e]),(u=bO.__b)&&u(e);e:if(typeof A=="function")try{if(_=e.props,y=(u=A.contextType)&&i[u.__c],S=u?y?y.props.value:u.__:i,n.__c?b=(d=e.__c=n.__c).__=d.__E:("prototype"in A&&A.prototype.render?e.__c=d=new A(_,S):(e.__c=d=new eas(_,S),d.constructor=A,d.render=TR1),y&&y.sub(d),d.props=_,d.state||(d.state={}),d.context=S,d.__n=i,h=d.__d=!0,d.__h=[],d._sb=[]),d.__s==null&&(d.__s=d.state),A.getDerivedStateFromProps!=null&&(d.__s==d.state&&(d.__s=Zkt({},d.__s)),Zkt(d.__s,A.getDerivedStateFromProps(_,d.__s))),p=d.props,g=d.state,d.__v=e,h)A.getDerivedStateFromProps==null&&d.componentWillMount!=null&&d.componentWillMount(),d.componentDidMount!=null&&d.__h.push(d.componentDidMount);else{if(A.getDerivedStateFromProps==null&&_!==p&&d.componentWillReceiveProps!=null&&d.componentWillReceiveProps(_,S),!d.__e&&(d.shouldComponentUpdate!=null&&d.shouldComponentUpdate(_,d.__s,S)===!1||e.__v===n.__v)){for(e.__v!==n.__v&&(d.props=_,d.state=d.__s,d.__d=!1),e.__e=n.__e,e.__k=n.__k,e.__k.forEach(function(P){P&&(P.__=e)}),k=0;k<d._sb.length;k++)d.__h.push(d._sb[k]);d._sb=[],d.__h.length&&o.push(d);break e}d.componentWillUpdate!=null&&d.componentWillUpdate(_,d.__s,S),d.componentDidUpdate!=null&&d.__h.push(function(){d.componentDidUpdate(p,g,v)})}if(d.context=S,d.props=_,d.__P=t,d.__e=!1,C=bO.__r,T=0,"prototype"in A&&A.prototype.render){for(d.state=d.__s,d.__d=!1,C&&C(e),u=d.render(d.props,d.state,d.context),E=0;E<d._sb.length;E++)d.__h.push(d._sb[E]);d._sb=[]}else do d.__d=!1,C&&C(e),u=d.render(d.props,d.state,d.context),d.state=d.__s;while(d.__d&&++T<25);d.state=d.__s,d.getChildContext!=null&&(i=Zkt(Zkt({},i),d.getChildContext())),h||d.getSnapshotBeforeUpdate==null||(v=d.getSnapshotBeforeUpdate(p,g)),Cyg(t,oas(I=u!=null&&u.type===Aki&&u.key==null?u.props.children:u)?I:[I],e,n,i,r,s,o,a,l,c),d.base=e.__e,e.__u&=-161,d.__h.length&&o.push(d),b&&(d.__E=d.__=null)}catch(P){e.__v=null,l||s!=null?(e.__e=a,e.__u|=l?160:32,s[s.indexOf(a)]=null):(e.__e=n.__e,e.__k=n.__k),bO.__e(P,e,n)}else s==null&&e.__v===n.__v?(e.__k=n.__k,e.__e=n.__e):e.__e=CR1(n.__e,e,n,i,r,s,o,l,c);(u=bO.diffed)&&u(e)}function whl(t,e,n){for(var i=0;i<n.length;i++)khl(n[i],n[++i],n[++i]);bO.__c&&bO.__c(e,t),t.some(function(r){try{t=r.__h,r.__h=[],t.some(function(s){s.call(r)})}catch(s){bO.__e(s,r.__v)}})}function CR1(t,e,n,i,r,s,o,a,l){var c,u,d,h,p,g,v,b=n.props,_=e.props,y=e.type;if(y==="svg"&&(r=!0),s!=null){for(c=0;c<s.length;c++)if((p=s[c])&&"setAttribute"in p==!!y&&(y?p.localName===y:p.nodeType===3)){t=p,s[c]=null;break}}if(t==null){if(y===null)return document.createTextNode(_);t=r?document.createElementNS("http://www.w3.org/2000/svg",y):document.createElement(y,_.is&&_),s=null,a=!1}if(y===null)b===_||a&&t.data===_||(t.data=_);else{if(s=s&&ras.call(t.childNodes),b=n.props||fxn,!a&&s!=null)for(b={},c=0;c<t.attributes.length;c++)b[(p=t.attributes[c]).name]=p.value;for(c in b)p=b[c],c=="children"||(c=="dangerouslySetInnerHTML"?d=p:c==="key"||c in _||nas(t,c,null,p,r));for(c in _)p=_[c],c=="children"?h=p:c=="dangerouslySetInnerHTML"?u=p:c=="value"?g=p:c=="checked"?v=p:c==="key"||a&&typeof p!="function"||b[c]===p||nas(t,c,p,b[c],r);if(u)a||d&&(u.__html===d.__html||u.__html===t.innerHTML)||(t.innerHTML=u.__html),e.__k=[];else if(d&&(t.innerHTML=""),Cyg(t,oas(h)?h:[h],e,n,i,r&&y!=="foreignObject",s,o,s?s[0]:n.__k&&pxn(n,0),a,l),s!=null)for(c=s.length;c--;)s[c]!=null&&Syg(s[c]);a||(c="value",g!==void 0&&(g!==t[c]||y==="progress"&&!g||y==="option"&&g!==b[c])&&nas(t,c,g,b[c],!1),c="checked",v!==void 0&&v!==t[c]&&nas(t,c,v,b[c],!1))}return t}function khl(t,e,n){try{typeof t=="function"?t(e):t.current=e}catch(i){bO.__e(i,n)}}function Chl(t,e,n){var i,r;if(bO.unmount&&bO.unmount(t),(i=t.ref)&&(i.current&&i.current!==t.__e||khl(i,null,e)),(i=t.__c)!=null){if(i.componentWillUnmount)try{i.componentWillUnmount()}catch(s){bO.__e(s,e)}i.base=i.__P=null,t.__c=void 0}if(i=t.__k)for(r=0;r<i.length;r++)i[r]&&Chl(i[r],e,n||typeof t.type!="function");n||t.__e==null||Syg(t.__e),t.__=t.__e=t.__d=void 0}function TR1(t,e,n){return this.constructor(t,n)}function ER1(t,e,n){var i,r,s,o;bO.__&&bO.__(t,e),r=(i=!1)?null:e.__k,s=[],o=[],Shl(e,t=e.__k=yE(Aki,null,[t]),r||fxn,fxn,e.ownerSVGElement!==void 0,r?null:e.firstChild?ras.call(e.childNodes):null,s,r?r.__e:e.firstChild,i,o),t.__d=void 0,whl(s,t,o)}function tGt(t,e){d8.__h&&d8.__h(_O,t,sGt||e),sGt=0;var n=_O.__H||(_O.__H={__:[],__h:[]});return t>=n.__.length&&n.__.push({__V:Mki}),n.__[t]}function nGt(t){return sGt=1,Ayg(Pyg,t)}function Ayg(t,e,n){var i=tGt(Qst++,2);if(i.t=t,!i.__c&&(i.__=[n?n(e):Pyg(void 0,e),function(a){var l=i.__N?i.__N[0]:i.__[0],c=i.t(l,a);l!==c&&(i.__N=[c,i.__[1]],i.__c.setState({}))}],i.__c=_O,!_O.u)){var r=function(a,l,c){if(!i.__c.__H)return!0;var u=i.__c.__H.__.filter(function(h){return!!h.__c});if(u.every(function(h){return!h.__N}))return!s||s.call(this,a,l,c);var d=!1;return u.forEach(function(h){if(h.__N){var p=h.__[0];h.__=h.__N,h.__N=void 0,p!==h.__[0]&&(d=!0)}}),!(!d&&i.__c.props===a)&&(!s||s.call(this,a,l,c))};_O.u=!0;var s=_O.shouldComponentUpdate,o=_O.componentWillUpdate;_O.componentWillUpdate=function(a,l,c){if(this.__e){var u=s;s=void 0,r(a,l,c),s=u}o&&o.call(this,a,l,c)},_O.shouldComponentUpdate=r}return i.__N||i.__}function xR1(t,e){var n=tGt(Qst++,3);!d8.__s&&Ehl(n.__H,e)&&(n.__=t,n.i=e,_O.__H.__h.push(n))}function Ryg(t,e){var n=tGt(Qst++,4);!d8.__s&&Ehl(n.__H,e)&&(n.__=t,n.i=e,_O.__h.push(n))}function IR1(t){return sGt=5,Rki(function(){return{current:t}},[])}function AR1(t,e,n){sGt=6,Ryg(function(){return typeof t=="function"?(t(e()),function(){return t(null)}):t?(t.current=e(),function(){return t.current=null}):void 0},n==null?n:n.concat(t))}function Rki(t,e){var n=tGt(Qst++,7);return Ehl(n.__H,e)?(n.__V=t(),n.i=e,n.__h=t,n.__V):n.__}function mxn(t,e){return sGt=8,Rki(function(){return t},e)}function RR1(t){var e=_O.context[t.__c],n=tGt(Qst++,9);return n.c=t,e?(n.__==null&&(n.__=!0,e.sub(_O)),e.props.value):t.__}function PR1(t,e){d8.useDebugValue&&d8.useDebugValue(e?e(t):t)}function MR1(t){var e=tGt(Qst++,10),n=nGt();return e.__=t,_O.componentDidCatch||(_O.componentDidCatch=function(i,r){e.__&&e.__(i,r),n[1](i)}),[n[0],function(){n[1](void 0)}]}function DR1(){var t=tGt(Qst++,11);if(!t.__){for(var e=_O.__v;e!==null&&!e.__m&&e.__!==null;)e=e.__;var n=e.__m||(e.__m=[0,0]);t.__="P"+n[0]+"-"+n[1]++}return t.__}function NR1(){for(var t;t=Bhl.shift();)if(t.__P&&t.__H)try{t.__H.__h.forEach(ias),t.__H.__h.forEach(Thl),t.__H.__h=[]}catch(e){t.__H.__h=[],d8.__e(e,t.__v)}}function LR1(t){var e,n=function(){clearTimeout(i),Ghl&&cancelAnimationFrame(e),setTimeout(t)},i=setTimeout(n,100);Ghl&&(e=requestAnimationFrame(n))}function ias(t){var e=_O,n=t.__c;typeof n=="function"&&(t.__c=void 0,n()),_O=e}function Thl(t){var e=_O;t.__c=t.__(),_O=e}function Ehl(t,e){return!t||t.length!==e.length||e.some(function(n,i){return n!==t[i]})}function Pyg(t,e){return typeof e=="function"?e(t):e}function OR1(){const t=i=>ZL.createElementNS(oSg,i),e=hke(t("svg"),{width:"32",height:"30",viewBox:"0 0 72 66",fill:"inherit"}),n=hke(t("path"),{transform:"translate(11, 11)",d:"M29,2.26a4.67,4.67,0,0,0-8,0L14.42,13.53A32.21,32.21,0,0,1,32.17,40.19H27.55A27.68,27.68,0,0,0,12.09,17.47L6,28a15.92,15.92,0,0,1,9.23,12.17H4.62A.76.76,0,0,1,4,39.06l2.94-5a10.74,10.74,0,0,0-3.36-1.9l-2.91,5a4.54,4.54,0,0,0,1.69,6.24A4.66,4.66,0,0,0,4.62,44H19.15a19.4,19.4,0,0,0-8-17.31l2.31-4A23.87,23.87,0,0,1,23.76,44H36.07a35.88,35.88,0,0,0-16.41-31.8l4.67-8a.77.77,0,0,1,1.05-.27c.53.29,20.29,34.77,20.66,35.17a.76.76,0,0,1-.68,1.13H40.6q.09,1.91,0,3.81h4.78A4.59,4.59,0,0,0,50,39.43a4.49,4.49,0,0,0-.62-2.28Z"});return e.appendChild(n),e}function FR1({options:t}){const e=Rki(()=>({__html:OR1().outerHTML}),[]);return yE("h2",{class:"dialog__header"},yE("span",{class:"dialog__title"},t.formTitle),t.showBranding?yE("a",{class:"brand-link",target:"_blank",href:"https://sentry.io/welcome/",title:"Powered by Sentry",rel:"noopener noreferrer",dangerouslySetInnerHTML:e}):null)}function BR1(t,e){const n=[];return e.isNameRequired&&!t.name&&n.push(e.nameLabel),e.isEmailRequired&&!t.email&&n.push(e.emailLabel),t.message||n.push(e.messageLabel),n}function xhl(t,e){const n=t.get(e);return typeof n=="string"?n.trim():""}function UR1({options:t,defaultEmail:e,defaultName:n,onFormClose:i,onSubmit:r,onSubmitSuccess:s,onSubmitError:o,showEmail:a,showName:l,screenshotInput:c}){const{tags:u,addScreenshotButtonLabel:d,removeScreenshotButtonLabel:h,cancelButtonLabel:p,emailLabel:g,emailPlaceholder:v,isEmailRequired:b,isNameRequired:_,messageLabel:y,messagePlaceholder:S,nameLabel:k,namePlaceholder:C,submitButtonLabel:T,isRequiredLabel:E}=t,[I,A]=nGt(!1),[P,N]=nGt(null),[L,B]=nGt(!1),F=c?.input,[U,$]=nGt(null),G=mxn(z=>{$(z),B(!1)},[]),W=mxn(z=>{const V=BR1(z,{emailLabel:g,isEmailRequired:b,isNameRequired:_,messageLabel:y,nameLabel:k});return V.length>0?N(`Please enter in the following required fields: ${V.join(", ")}`):N(null),V.length===0},[g,b,_,y,k]),q=mxn(async z=>{A(!0);try{if(z.preventDefault(),!(z.target instanceof HTMLFormElement))return;const V=new FormData(z.target),Q=await(c&&L?c.value():void 0),X={name:xhl(V,"name"),email:xhl(V,"email"),message:xhl(V,"message"),attachments:Q?[Q]:void 0};if(!W(X))return;try{const J=await r({name:X.name,email:X.email,message:X.message,source:Yyg,tags:u},{attachments:X.attachments});s(X,J)}catch(J){Pki&&eo.error(J),N(J),o(J)}}finally{A(!1)}},[c&&L,s,o]);return yE("form",{class:"form",onSubmit:q},F&&L?yE(F,{onError:G}):null,yE("fieldset",{class:"form__right","data-sentry-feedback":!0,disabled:I},yE("div",{class:"form__top"},P?yE("div",{class:"form__error-container"},P):null,l?yE("label",{for:"name",class:"form__label"},yE(Ihl,{label:k,isRequiredLabel:E,isRequired:_}),yE("input",{class:"form__input",defaultValue:n,id:"name",name:"name",placeholder:C,required:_,type:"text"})):yE("input",{"aria-hidden":!0,value:n,name:"name",type:"hidden"}),a?yE("label",{for:"email",class:"form__label"},yE(Ihl,{label:g,isRequiredLabel:E,isRequired:b}),yE("input",{class:"form__input",defaultValue:e,id:"email",name:"email",placeholder:v,required:b,type:"email"})):yE("input",{"aria-hidden":!0,value:e,name:"email",type:"hidden"}),yE("label",{for:"message",class:"form__label"},yE(Ihl,{label:y,isRequiredLabel:E,isRequired:!0}),yE("textarea",{autoFocus:!0,class:"form__input form__input--textarea",id:"message",name:"message",placeholder:S,required:!0,rows:5})),F?yE("label",{for:"screenshot",class:"form__label"},yE("button",{class:"btn btn--default",disabled:I,type:"button",onClick:()=>{$(null),B(z=>!z)}},L?h:d),U?yE("div",{class:"form__error-container"},U.message):null):null),yE("div",{class:"btn-group"},yE("button",{class:"btn btn--primary",disabled:I,type:"submit"},T),yE("button",{class:"btn btn--default",disabled:I,type:"button",onClick:i},p))))}function Ihl({label:t,isRequired:e,isRequiredLabel:n}){return yE("span",{class:"form__label__text"},t,e&&yE("span",{class:"form__label__text--required"},n))}function jR1(){const t=l=>C2e.document.createElementNS(aSg,l),e=hke(t("svg"),{width:`${Dki}`,height:`${qhl}`,viewBox:`0 0 ${Dki} ${qhl}`,fill:"inherit"}),n=hke(t("g"),{clipPath:"url(#clip0_57_156)"}),i=hke(t("path"),{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M3.55544 15.1518C4.87103 16.0308 6.41775 16.5 8 16.5C10.1217 16.5 12.1566 15.6571 13.6569 14.1569C15.1571 12.6566 16 10.6217 16 8.5C16 6.91775 15.5308 5.37103 14.6518 4.05544C13.7727 2.73985 12.5233 1.71447 11.0615 1.10897C9.59966 0.503466 7.99113 0.34504 6.43928 0.653721C4.88743 0.962403 3.46197 1.72433 2.34315 2.84315C1.22433 3.96197 0.462403 5.38743 0.153721 6.93928C-0.15496 8.49113 0.00346625 10.0997 0.608967 11.5615C1.21447 13.0233 2.23985 14.2727 3.55544 15.1518ZM4.40546 3.1204C5.46945 2.40946 6.72036 2.03 8 2.03C9.71595 2.03 11.3616 2.71166 12.575 3.92502C13.7883 5.13838 14.47 6.78405 14.47 8.5C14.47 9.77965 14.0905 11.0306 13.3796 12.0945C12.6687 13.1585 11.6582 13.9878 10.476 14.4775C9.29373 14.9672 7.99283 15.0953 6.73777 14.8457C5.48271 14.596 4.32987 13.9798 3.42502 13.075C2.52018 12.1701 1.90397 11.0173 1.65432 9.76224C1.40468 8.50718 1.5328 7.20628 2.0225 6.02404C2.5122 4.8418 3.34148 3.83133 4.40546 3.1204Z"}),r=hke(t("path"),{d:"M6.68775 12.4297C6.78586 12.4745 6.89218 12.4984 7 12.5C7.11275 12.4955 7.22315 12.4664 7.32337 12.4145C7.4236 12.3627 7.51121 12.2894 7.58 12.2L12 5.63999C12.0848 5.47724 12.1071 5.28902 12.0625 5.11098C12.0178 4.93294 11.9095 4.77744 11.7579 4.67392C11.6064 4.57041 11.4221 4.52608 11.24 4.54931C11.0579 4.57254 10.8907 4.66173 10.77 4.79999L6.88 10.57L5.13 8.56999C5.06508 8.49566 4.98613 8.43488 4.89768 8.39111C4.80922 8.34735 4.713 8.32148 4.61453 8.31498C4.51605 8.30847 4.41727 8.32147 4.32382 8.35322C4.23038 8.38497 4.14413 8.43484 4.07 8.49999C3.92511 8.63217 3.83692 8.81523 3.82387 9.01092C3.81083 9.2066 3.87393 9.39976 4 9.54999L6.43 12.24C6.50187 12.3204 6.58964 12.385 6.68775 12.4297Z"});e.appendChild(n).append(r,i);const s=t("defs"),o=hke(t("clipPath"),{id:"clip0_57_156"}),a=hke(t("rect"),{width:`${Dki}`,height:`${Dki}`,fill:"white",transform:"translate(0 0.5)"});return o.appendChild(a),s.appendChild(o),e.appendChild(s).appendChild(o).appendChild(a),e}function $R1({open:t,onFormSubmitted:e,...n}){const i=n.options,r=Rki(()=>({__html:jR1().outerHTML}),[]),[s,o]=nGt(null),a=mxn(()=>{s&&(clearTimeout(s),o(null)),e()},[s]),l=mxn((c,u)=>{n.onSubmitSuccess(c,u),o(setTimeout(()=>{e(),o(null)},Qyg))},[e]);return yE(Aki,null,s?yE("div",{class:"success__position",onClick:a},yE("div",{class:"success__content"},i.successMessageText,yE("span",{class:"success__icon",dangerouslySetInnerHTML:r}))):yE("dialog",{class:"dialog",onClick:i.onFormClose,open:t},yE("div",{class:"dialog__position"},yE("div",{class:"dialog__content",onClick:c=>{c.stopPropagation()}},yE(FR1,{options:i}),yE(UR1,{...n,onSubmitSuccess:l})))))}function WR1(t){const e=ZL.createElement("style");return e.textContent=`
:host {
  --dialog-inset: var(--inset);
}

${lSg}
${cSg}
${uSg}
${dSg}
${hSg}
`,t&&e.setAttribute("nonce",t),e}function HR1(){const t=t_().getUser(),e=RP().getUser(),n=Wye().getUser();return t&&Object.keys(t).length?t:e&&Object.keys(e).length?e:n}function zR1({h:t}){return function(){return t("svg",{"data-test-id":"icon-close",viewBox:"0 0 16 16",fill:"#2B2233",height:"25px",width:"25px"},t("circle",{r:"7",cx:"8",cy:"8",fill:"white"}),t("path",{strokeWidth:"1.5",d:"M8,16a8,8,0,1,1,8-8A8,8,0,0,1,8,16ZM8,1.53A6.47,6.47,0,1,0,14.47,8,6.47,6.47,0,0,0,8,1.53Z"}),t("path",{strokeWidth:"1.5",d:"M5.34,11.41a.71.71,0,0,1-.53-.22.74.74,0,0,1,0-1.06l5.32-5.32a.75.75,0,0,1,1.06,1.06L5.87,11.19A.74.74,0,0,1,5.34,11.41Z"}),t("path",{strokeWidth:"1.5",d:"M10.66,11.41a.74.74,0,0,1-.53-.22L4.81,5.87A.75.75,0,0,1,5.87,4.81l5.32,5.32a.74.74,0,0,1,0,1.06A.71.71,0,0,1,10.66,11.41Z"}))}}function GR1(t){const e=ZL.createElement("style"),n="#1A141F",i="#302735";return e.textContent=`
.editor {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
}

.editor__image-container {
  justify-items: center;
  padding: 15px;
  position: relative;
  height: 100%;
  border-radius: var(--menu-border-radius, 6px);

  background-color: ${n};
  background-image: repeating-linear-gradient(
      -145deg,
      transparent,
      transparent 8px,
      ${n} 8px,
      ${n} 11px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 15px,
      ${i} 15px,
      ${i} 16px
    );
}

.editor__canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor__canvas-container > * {
  object-fit: contain;
  position: absolute;
}

.editor__tool-container {
  padding-top: 8px;
  display: flex;
  justify-content: center;
}

.editor__tool-bar {
  display: flex;
  gap: 8px;
}

.editor__tool {
  display: flex;
  padding: 8px 12px;
  justify-content: center;
  align-items: center;
  border: var(--button-border, var(--border));
  border-radius: var(--button-border-radius, 6px);
  background: var(--button-background, var(--background));
  color: var(--button-color, var(--foreground));
}

.editor__tool--active {
  background: var(--button-primary-background, var(--accent-background));
  color: var(--button-primary-color, var(--accent-foreground));
}

.editor__rect {
  position: absolute;
  z-index: 2;
}

.editor__rect button {
  opacity: 0;
  position: absolute;
  top: -12px;
  right: -12px;
  cursor: pointer;
  padding: 0;
  z-index: 3;
  border: none;
  background: none;
}

.editor__rect:hover button {
  opacity: 1;
}
`,t&&e.setAttribute("nonce",t),e}function qR1({h:t}){return function({action:n,setAction:i,options:r}){return t("div",{class:"editor__tool-container"},t("div",{class:"editor__tool-bar"},t("button",{type:"button",class:`editor__tool ${n==="highlight"?"editor__tool--active":""}`,onClick:()=>{i(n==="highlight"?"":"highlight")}},r.highlightToolText),t("button",{type:"button",class:`editor__tool ${n==="hide"?"editor__tool--active":""}`,onClick:()=>{i(n==="hide"?"":"hide")}},r.hideToolText)))}}function VR1({hooks:t}){function e(){const[n,i]=t.useState(C2e.devicePixelRatio??1);return t.useEffect(()=>{const r=()=>{i(C2e.devicePixelRatio)},s=matchMedia(`(resolution: ${C2e.devicePixelRatio}dppx)`);return s.addEventListener("change",r),()=>{s.removeEventListener("change",r)}},[]),n}return function({onBeforeScreenshot:i,onScreenshot:r,onAfterScreenshot:s,onError:o}){const a=e();t.useEffect(()=>{(async()=>{i();const c=await gxn.mediaDevices.getDisplayMedia({video:{width:C2e.innerWidth*a,height:C2e.innerHeight*a},audio:!1,monitorTypeSurfaces:"exclude",preferCurrentTab:!0,selfBrowserSurface:"include",surfaceSwitching:"exclude"}),u=ZL.createElement("video");await new Promise((d,h)=>{u.srcObject=c,u.onloadedmetadata=()=>{r(u,a),c.getTracks().forEach(p=>p.stop()),d()},u.play().catch(h)}),s()})().catch(o)},[])}}function KR1(t,e,n){switch(t.type){case"highlight":{e.shadowColor="rgba(0, 0, 0, 0.7)",e.shadowBlur=50,e.fillStyle=n,e.fillRect(t.x-1,t.y-1,t.w+2,t.h+2),e.clearRect(t.x,t.y,t.w,t.h);break}case"hide":e.fillStyle="rgb(0, 0, 0)",e.fillRect(t.x,t.y,t.w,t.h);break}}function Jkt(t,e,n){if(!t)return;const i=t.getContext("2d",e);i&&n(t,i)}function Ahl(t,e){Jkt(t,{alpha:!0},(n,i)=>{i.drawImage(e,0,0,e.width,e.height,0,0,n.width,n.height)})}function Rhl(t,e,n){Jkt(t,{alpha:!0},(i,r)=>{n.length&&(r.fillStyle="rgba(0, 0, 0, 0.25)",r.fillRect(0,0,i.width,i.height)),n.forEach(s=>{KR1(s,r,e)})})}function YR1({h:t,hooks:e,outputBuffer:n,dialog:i,options:r}){const s=VR1({hooks:e}),o=qR1({h:t}),a=zR1({h:t}),l={__html:GR1(r.styleNonce).innerText},c=i.el.style,u=({screenshot:d})=>{const[h,p]=e.useState("highlight"),[g,v]=e.useState([]),b=e.useRef(null),_=e.useRef(null),y=e.useRef(null),S=e.useRef(null),[k,C]=e.useState(1),T=e.useMemo(()=>{const L=ZL.getElementById(r.id);if(!L)return"white";const B=getComputedStyle(L);return B.getPropertyValue("--button-primary-background")||B.getPropertyValue("--accent-background")},[r.id]);e.useLayoutEffect(()=>{const L=()=>{const B=b.current;B&&(Jkt(d.canvas,{alpha:!1},F=>{const U=Math.min(B.clientWidth/F.width,B.clientHeight/F.height);C(U)}),(B.clientHeight===0||B.clientWidth===0)&&setTimeout(L,0))};return L(),C2e.addEventListener("resize",L),()=>{C2e.removeEventListener("resize",L)}},[d]);const E=e.useCallback((L,B)=>{Jkt(L,{alpha:!0},(F,U)=>{U.scale(B,B),F.width=d.canvas.width,F.height=d.canvas.height})},[d]);e.useEffect(()=>{E(_.current,d.dpi),Ahl(_.current,d.canvas)},[d]),e.useEffect(()=>{E(y.current,d.dpi),Jkt(y.current,{alpha:!0},(L,B)=>{B.clearRect(0,0,L.width,L.height)}),Rhl(y.current,T,g)},[g,T]),e.useEffect(()=>{E(n,d.dpi),Ahl(n,d.canvas),Jkt(ZL.createElement("canvas"),{alpha:!0},(L,B)=>{B.scale(d.dpi,d.dpi),L.width=d.canvas.width,L.height=d.canvas.height,Rhl(L,T,g),Ahl(n,L)})},[g,d,T]);const I=L=>{if(!h||!S.current)return;const B=S.current.getBoundingClientRect(),F={type:h,x:L.offsetX/k,y:L.offsetY/k},U=(W,q)=>{const z=(q.clientX-B.x)/k,V=(q.clientY-B.y)/k;return{type:W.type,x:Math.min(W.x,z),y:Math.min(W.y,V),w:Math.abs(z-W.x),h:Math.abs(V-W.y)}},$=W=>{Jkt(y.current,{alpha:!0},(q,z)=>{z.clearRect(0,0,q.width,q.height)}),Rhl(y.current,T,[...g,U(F,W)])},G=W=>{const q=U(F,W);q.w*k>=1&&q.h*k>=1&&v(z=>[...z,q]),ZL.removeEventListener("mousemove",$),ZL.removeEventListener("mouseup",G)};ZL.addEventListener("mousemove",$),ZL.addEventListener("mouseup",G)},A=e.useCallback(L=>B=>{B.preventDefault(),B.stopPropagation(),v(F=>{const U=[...F];return U.splice(L,1),U})},[]),P={width:`${d.canvas.width*k}px`,height:`${d.canvas.height*k}px`},N=L=>{L.stopPropagation()};return t("div",{class:"editor"},t("style",{nonce:r.styleNonce,dangerouslySetInnerHTML:l}),t("div",{class:"editor__image-container"},t("div",{class:"editor__canvas-container",ref:b},t("canvas",{ref:_,id:"background",style:P}),t("canvas",{ref:y,id:"foreground",style:P}),t("div",{ref:S,onMouseDown:I,style:P},g.map((L,B)=>t("div",{key:B,class:"editor__rect",style:{top:`${L.y*k}px`,left:`${L.x*k}px`,width:`${L.w*k}px`,height:`${L.h*k}px`}},t("button",{"aria-label":r.removeHighlightText,onClick:A(B),onMouseDown:N,onMouseUp:N,type:"button"},t(a,null))))))),t(o,{options:r,action:h,setAction:p}))};return function({onError:h}){const[p,g]=e.useState();return s({onBeforeScreenshot:e.useCallback(()=>{c.display="none"},[]),onScreenshot:e.useCallback((v,b)=>{Jkt(ZL.createElement("canvas"),{alpha:!1},(_,y)=>{y.scale(b,b),_.width=v.videoWidth,_.height=v.videoHeight,y.drawImage(v,0,0,_.width,_.height),g({canvas:_,dpi:b})}),n.width=v.videoWidth,n.height=v.videoHeight},[]),onAfterScreenshot:e.useCallback(()=>{c.display="block"},[]),onError:e.useCallback(v=>{c.display="block",h(v)},[])}),p?t(u,{screenshot:p}):t("div",null)}}var C2e,ZL,gxn,Phl,Myg,Dyg,Nyg,Lyg,Oyg,Fyg,Byg,Uyg,jyg,$yg,Wyg,Hyg,zyg,Gyg,qyg,Vyg,Kyg,Yyg,Xyg,Qyg,Mhl,Pki,iGt,Zyg,Dhl,Jyg,Nhl,Lhl,ras,bO,eSg,rGt,tSg,nSg,Ohl,fxn,sas,iSg,oas,Qst,_O,Fhl,rSg,sGt,Bhl,Mki,d8,Uhl,jhl,$hl,Whl,Hhl,zhl,Ghl,sSg,oSg,Dki,qhl,aSg,lSg,cSg,uSg,dSg,hSg,pSg,mSg,Vhl=
