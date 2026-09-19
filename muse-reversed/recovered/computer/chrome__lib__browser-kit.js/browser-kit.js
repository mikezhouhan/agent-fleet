// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/lib/browser-kit.js
// kind: full-copy
// name: browser-kit.js
// byteRange: [0, 42159)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

// browser-kit.js — Shared page-interaction functions for Hatch browser automation.
// Canonical source: par-msl/jarvis  tools/hatch-browser/browser-kit.js
// Consumed by: jarvis (Rust CDP inject), endo Chrome extension, homehub Python CDP inject
// Sync: run scripts/sync-browser-kit.sh in the consumer repo; CI enforces sha256 parity.
//
// All functions are self-contained (no imports, no closures over outer scope)
// so they can be injected into page context via chrome.scripting.executeScript
// or CDP Runtime.evaluate / Page.addScriptToEvaluateOnNewDocument.

// ── Block / CAPTCHA Detection ──

function checkIfBlocked() {
  const signals = [
    'verify you are human',
    'are you a robot',
    'captcha',
    'access denied',
    'please complete the security check',
    'enable javascript and cookies',
    'checking your browser',
    'ray id',
    'cf-browser-verification',
    'cf-challenge',
    'challenge-platform',
    '403 forbidden',
    'automated access',
    'bot detection',
    'press & hold',
    'security check',
    'verify you\'re human',
    'human verification',
    'perimeter x',
    'distil networks',
  ];

  const text = (document.body?.innerText || '').substring(0, 3000).toLowerCase();
  const title = (document.title || '').toLowerCase();
  const bodyLen = text.trim().length;

  for (const signal of signals) {
    if (text.includes(signal) || title.includes(signal)) {
      return { blocked: true, reason: 'signal_match', signal, body_length: bodyLen };
    }
  }

  const cfChallenge = document.querySelector(
    '#challenge-running, #challenge-form, .cf-browser-verification, ' +
    '#px-captcha, .g-recaptcha, .h-captcha, #cf-please-wait'
  );
  if (cfChallenge) {
    return { blocked: true, reason: 'challenge_element', selector: cfChallenge.id || cfChallenge.className };
  }

  return { blocked: false, body_length: bodyLen };
}

// ── Page Description / Element Enumeration ──

function describePageElements(rootSelector, maxElements) {
  function getUniqueSelector(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const tag = el.tagName.toLowerCase();
    const name = el.getAttribute('name');
    if (name) return `${tag}[name="${CSS.escape(name)}"]`;
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return `[aria-label="${CSS.escape(ariaLabel)}"]`;
    const parent = el.parentElement;
    if (!parent) return tag;
    const siblings = [...parent.children].filter((s) => s.tagName === el.tagName);
    const index = siblings.indexOf(el) + 1;
    const parentSel = parent.id ? `#${CSS.escape(parent.id)}` : parent.tagName.toLowerCase();
    return `${parentSel} > ${tag}:nth-of-type(${index})`;
  }

  function getLabel(el) {
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const parts = labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim()).filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    if (el.id) {
      const labelEl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (labelEl) return labelEl.textContent.trim().substring(0, 100);
    }
    const parentLabel = el.closest('label');
    if (parentLabel) {
      const clone = parentLabel.cloneNode(true);
      for (const child of clone.querySelectorAll('input,select,textarea')) child.remove();
      const text = clone.textContent.trim();
      if (text) return text.substring(0, 100);
    }
    return el.getAttribute('placeholder') || undefined;
  }

  function describeEl(el) {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role') || undefined;
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select'
      || role === 'textbox' || role === 'combobox' || el.getAttribute('contenteditable') === 'true';
    const entry = {
      tag,
      type: el.getAttribute('type') || undefined,
      role,
      text: el.innerText?.trim().substring(0, 100) || undefined,
      label: getLabel(el),
      placeholder: el.getAttribute('placeholder') || undefined,
      name: el.getAttribute('name') || undefined,
      id: el.id || undefined,
      href: el.getAttribute('href') || undefined,
      value: isInput ? (el.value || el.textContent?.trim().substring(0, 200) || undefined) : undefined,
      selector: getUniqueSelector(el),
      visible: el.getBoundingClientRect().top < window.innerHeight && el.getBoundingClientRect().bottom > 0,
      disabled: el.disabled || el.getAttribute('aria-disabled') === 'true' || false,
    };
    if (isInput) {
      if (el.getAttribute('aria-required') === 'true' || el.required) entry.required = true;
      if (el.getAttribute('aria-invalid') === 'true') entry.invalid = true;
    }
    return entry;
  }

  const root = document.querySelector(rootSelector) || document.body;
  const INTERACTIVE = 'a, button, input, select, textarea, [role="button"], [role="link"], ' +
    '[role="tab"], [role="menuitem"], [role="combobox"], [role="textbox"], [role="switch"], ' +
    '[role="checkbox"], [role="radio"], [onclick], [contenteditable="true"]';
  const priorityRoles = new Set(['combobox', 'textbox']);
  const priorityTypes = new Set(['text', 'email', 'password', 'search', 'tel', 'url', 'number']);

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function sortPriority(a, b) {
    const aPri = priorityRoles.has(a.getAttribute('role')) || priorityTypes.has(a.getAttribute('type')) ? 0 : 1;
    const bPri = priorityRoles.has(b.getAttribute('role')) || priorityTypes.has(b.getAttribute('type')) ? 0 : 1;
    return aPri - bPri;
  }

  const forms = root.querySelectorAll('form');
  const formGroups = [];
  const formElements = new Set();

  for (const form of forms) {
    const fields = [...form.querySelectorAll(INTERACTIVE)].filter(isVisible).sort(sortPriority);
    if (fields.length === 0) continue;
    fields.forEach((el) => formElements.add(el));
    const formEntry = {
      form_selector: getUniqueSelector(form),
      form_action: form.getAttribute('action') || undefined,
      form_method: (form.getAttribute('method') || 'get').toUpperCase(),
    };
    const fieldsets = form.querySelectorAll('fieldset');
    if (fieldsets.length > 0) {
      const groups = [];
      const fieldsetElements = new Set();
      for (const fs of fieldsets) {
        const legend = fs.querySelector('legend');
        const fsFields = [...fs.querySelectorAll(INTERACTIVE)].filter(isVisible).sort(sortPriority);
        fsFields.forEach((el) => fieldsetElements.add(el));
        if (fsFields.length > 0) {
          groups.push({
            legend: legend?.textContent?.trim().substring(0, 100) || undefined,
            elements: fsFields.slice(0, maxElements).map(describeEl),
          });
        }
      }
      const ungrouped = fields.filter((el) => !fieldsetElements.has(el));
      if (ungrouped.length > 0) {
        groups.unshift({ legend: undefined, elements: ungrouped.slice(0, maxElements).map(describeEl) });
      }
      formEntry.groups = groups;
    } else {
      formEntry.elements = fields.slice(0, maxElements).map(describeEl);
    }
    formGroups.push(formEntry);
  }

  const loose = [...root.querySelectorAll(INTERACTIVE)]
    .filter((el) => !formElements.has(el) && isVisible(el))
    .sort(sortPriority);
  const elements = [];
  for (const el of loose) {
    if (elements.length >= maxElements) break;
    elements.push(describeEl(el));
  }

  const needsAttention = [...root.querySelectorAll('[aria-invalid="true"]')]
    .filter(isVisible)
    .map((el) => ({ selector: getUniqueSelector(el), label: getLabel(el) }));

  return {
    url: window.location.href,
    title: document.title,
    forms: formGroups.length > 0 ? formGroups : undefined,
    elements,
    needs_attention: needsAttention.length > 0 ? needsAttention : undefined,
    iframes: [...root.querySelectorAll('iframe')].map((f) => ({
      tag: 'iframe', src: f.src,
      name: f.name || f.id || undefined,
      selector: f.id ? `#${CSS.escape(f.id)}` : `iframe[src="${f.src}"]`,
    })),
    scroll: {
      top: window.scrollY,
      height: document.documentElement.scrollHeight,
      viewport_height: window.innerHeight,
    },
  };
}

// ── Click ──

function clickElement(selector, text, rightClick, doubleClick) {
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  }

  function scoreElement(el) {
    const rect = el.getBoundingClientRect();
    let score = 0;
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) score += 100;
    const last = window.__hh_last_interacted;
    if (last && last.isConnected) {
      const lr = last.getBoundingClientRect();
      score += Math.max(0, 500 - Math.hypot(rect.left - lr.left, rect.top - lr.top));
    }
    if (el.closest('form')) score += 50;
    if (el.type === 'submit') score += 50;
    score += Math.min(Math.max(rect.top, 0), 1000) * 0.1;
    return score;
  }

  function pickBest(list) {
    const visible = list.filter(isVisible);
    const pool = visible.length > 0 ? visible : list;
    if (pool.length <= 1) return pool[0] || null;
    let best = pool[0], bestScore = scoreElement(pool[0]);
    for (let i = 1; i < pool.length; i++) {
      const s = scoreElement(pool[i]);
      if (s > bestScore) { best = pool[i]; bestScore = s; }
    }
    return best;
  }

  let el = null;
  if (selector) {
    el = pickBest([...document.querySelectorAll(selector)]);
  }
  if (!el && text) {
    const candidates = document.querySelectorAll(
      'a, button, [role="button"], input[type="submit"], input[type="button"]'
    );
    const lower = text.toLowerCase();
    el = pickBest([...candidates].filter((c) =>
      (c.innerText || c.textContent || c.value || '').toLowerCase().includes(lower)
    ));
  }
  if (!el) return { ok: false, error: `Element not found: ${selector || text}` };

  window.__hh_last_interacted = el;
  el.scrollIntoView({ block: 'center', behavior: 'instant' });

  // Exactly ONE activation per call. The previous form dispatched a synthetic
  // `click` MouseEvent and then also called `el.click()`, so every listener ran
  // twice: a counter advanced by two, and a checkbox toggled to its new state and
  // straight back while the command still returned ok — the agent is told the
  // click landed and the page looks untouched. Native `click()` already fires a
  // click event AND performs default activation (submit, label association), so
  // the synthetic dispatch is only a fallback for targets that lack the method.
  //
  // A right click no longer activates the element either: it used to send
  // `contextmenu` *and* the left-button activation above, so asking for a context
  // menu could follow the link it was opened on.
  if (rightClick) {
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }));
  } else if (doubleClick) {
    el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, button: 0 }));
  } else if (typeof el.click === 'function') {
    el.click();
  } else {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  }

  return { ok: true, tag: el.tagName.toLowerCase(), text: (el.innerText || '').substring(0, 80) };
}

// ── Type ──

function typeIntoElement(selector, value, clear, submit) {
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  }

  const editableSelector = 'textarea,input:not([type]),input[type="text"],input[type="search"],' +
    'input[type="email"],input[type="tel"],input[type="url"],input[type="password"],' +
    '[contenteditable=""],[contenteditable="true"],[role="textbox"]';

  let el = null;
  if (selector) {
    const all = document.querySelectorAll(selector);
    for (const c of all) { if (isVisible(c)) { el = c; break; } }
    if (!el && all.length > 0) el = all[0];
  }
  if (!el && document.activeElement && isVisible(document.activeElement) &&
      (document.activeElement.isContentEditable || document.activeElement.matches?.(editableSelector))) {
    el = document.activeElement;
  }
  if (!el) {
    const all = document.querySelectorAll(editableSelector);
    for (const c of all) { if (isVisible(c)) { el = c; break; } }
    if (!el && all.length > 0) el = all[0];
  }
  if (!el) return { ok: false, error: 'Element not found' };

  window.__hh_last_interacted = el;

  const diag = {
    tag: el.tagName?.toLowerCase() || null,
    type: el.getAttribute('type') || null,
    name: el.name || null,
    id: el.id || null,
    resolved_selector: selector || '(auto)',
    visible: isVisible(el),
    value_before: 'value' in el ? String(el.value || '') : null,
  };

  el.focus();
  const setter =
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set ||
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

  if (clear) {
    if (el.isContentEditable) { el.innerText = ''; }
    else if (setter) setter.call(el, '');
    else el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  if (el.isContentEditable) {
    el.innerText = (clear ? '' : (el.innerText || '')) + value;
  } else if (setter) {
    setter.call(el, clear ? value : (el.value || '') + value);
  } else {
    el.value = clear ? value : (el.value || '') + value;
  }

  diag.value_after_set = 'value' in el ? String(el.value || '') : null;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  diag.value_after_events = 'value' in el ? String(el.value || '') : null;

  if (submit) {
    const form = el.closest('form');
    if (form && typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      const kOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
      el.dispatchEvent(new KeyboardEvent('keydown', kOpts));
      el.dispatchEvent(new KeyboardEvent('keypress', kOpts));
      el.dispatchEvent(new KeyboardEvent('keyup', kOpts));
      if (form && typeof form.submit === 'function') form.submit();
    }
  }

  return { ok: true, ...diag, submitted: submit };
}

// ── Select ──

function selectOption(selector, value) {
  const el = document.querySelector(selector);
  if (!el || el.tagName.toLowerCase() !== 'select')
    return { ok: false, error: 'Select element not found' };
  let found = false;
  for (const opt of el.options) {
    if (opt.value === value || opt.textContent.trim() === value) {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
      if (setter && setter.set) setter.set.call(el, opt.value);
      else el.value = opt.value;
      found = true;
      break;
    }
  }
  if (!found) return { ok: false, error: `Option not found: ${value}` };
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return { ok: true, selected: el.value };
}

// ── Scroll ──

function scrollPage(direction, pixels, selector) {
  function findScrollContainer() {
    const tags = 'main,section,article,div,[role="main"],[role="region"],aside,nav,ul,ol';
    const candidates = [];
    for (const el of document.querySelectorAll(tags)) {
      if (el.clientHeight < 100 || el.scrollHeight <= el.clientHeight) continue;
      const style = getComputedStyle(el);
      if (/auto|scroll/.test(style.overflow + style.overflowY)) candidates.push(el);
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight));
    return candidates[0];
  }

  let scrollEl, useWindow;
  if (selector) {
    const target = document.querySelector(selector);
    if (!target) return { ok: false, error: `Scroll target not found: ${selector}` };
    scrollEl = target;
    useWindow = false;
  } else {
    const container = findScrollContainer();
    if (container) { scrollEl = container; useWindow = false; }
    else { scrollEl = document.documentElement; useWindow = true; }
  }

  const before = useWindow ? window.scrollY : scrollEl.scrollTop;
  switch (direction) {
    case 'down':
      if (useWindow) window.scrollBy(0, pixels); else scrollEl.scrollTop += pixels; break;
    case 'up':
      if (useWindow) window.scrollBy(0, -pixels); else scrollEl.scrollTop -= pixels; break;
    case 'top':
      if (useWindow) window.scrollTo(0, 0); else scrollEl.scrollTop = 0; break;
    case 'bottom': {
      const max = useWindow ? document.documentElement.scrollHeight : scrollEl.scrollHeight;
      if (useWindow) window.scrollTo(0, max); else scrollEl.scrollTop = max; break;
    }
  }

  const after = useWindow ? window.scrollY : scrollEl.scrollTop;
  return {
    ok: true,
    scroll_top: after,
    scroll_height: useWindow ? document.documentElement.scrollHeight : scrollEl.scrollHeight,
    viewport_height: useWindow ? window.innerHeight : scrollEl.clientHeight,
    scrolled: Math.abs(after - before) > 0,
    container: useWindow ? 'window' : (scrollEl.tagName.toLowerCase() + (scrollEl.className ? '.' + String(scrollEl.className).split(' ')[0] : '')),
  };
}

// ── Key Dispatch ──

function dispatchKey(key) {
  const el = document.activeElement || document.body;
  const keyMap = {
    Enter: { code: 'Enter', keyCode: 13 },
    Tab: { code: 'Tab', keyCode: 9 },
    Escape: { code: 'Escape', keyCode: 27 },
    Backspace: { code: 'Backspace', keyCode: 8 },
    ArrowDown: { code: 'ArrowDown', keyCode: 40 },
    ArrowUp: { code: 'ArrowUp', keyCode: 38 },
    ArrowLeft: { code: 'ArrowLeft', keyCode: 37 },
    ArrowRight: { code: 'ArrowRight', keyCode: 39 },
    Space: { code: 'Space', keyCode: 32 },
    Delete: { code: 'Delete', keyCode: 46 },
  };
  const mapped = keyMap[key];
  if (!mapped) return { ok: false, error: `Unknown key: ${key}` };
  for (const type of ['keydown', 'keypress', 'keyup']) {
    el.dispatchEvent(new KeyboardEvent(type, {
      key, code: mapped.code, keyCode: mapped.keyCode, bubbles: true, cancelable: true,
    }));
  }
  return { ok: true, key };
}

// ── Form Fill ──

function fillForm(fields, submit) {
  const results = [];
  for (const field of fields) {
    const el = document.querySelector(field.selector);
    if (!el) { results.push({ selector: field.selector, ok: false, error: 'Not found' }); continue; }
    el.focus();
    const setter =
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set ||
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (setter) setter.call(el, field.value);
    else el.value = field.value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    results.push({ selector: field.selector, ok: true });
  }
  if (submit) {
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
  }
  return { ok: true, results };
}

// ── Snapshot (text extraction) ──

function snapshotPage() {
  const title = document.title || '';
  const url = window.location.href || '';
  const text = (document.body?.innerText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim();
  return { title, url, text };
}

// ── Content Extraction ──

function extractPageContent(selector, format, maxChars) {
  const el = document.querySelector(selector) || document.body;
  if (format === 'html') return el.innerHTML.substring(0, maxChars);
  return el.innerText.substring(0, maxChars);
}

// ── Accessibility Snapshot ──

function buildSnapshotFromAXNodes(nodes, interactive, prevStableToRef) {
  var INTERACTIVE_ROLES = {
    button:1, link:1, textbox:1, checkbox:1, radio:1, combobox:1, listbox:1,
    menuitem:1, menuitemcheckbox:1, menuitemradio:1, option:1, searchbox:1,
    slider:1, spinbutton:1, switch:1, tab:1, treeitem:1
  };
  var CONTENT_ROLES = {
    heading:1, cell:1, gridcell:1, columnheader:1, rowheader:1, listitem:1,
    article:1, region:1, main:1, navigation:1, img:1
  };
  var INVISIBLE_RE = /[\uFEFF\u200B\u200C\u200D\u2060\u00A0]/g;
  var NAME_MAX = 100;

  function str(v) { return (v && v.value != null) ? String(v.value) : ''; }
  function clean(s) { return s.replace(INVISIBLE_RE, '').trim().substring(0, NAME_MAX); }

  // Pull a single property out of an AX node's `properties` array.
  function axProp(props, name) {
    if (!props) return undefined;
    for (var k = 0; k < props.length; k++) {
      if (props[k].name === name) {
        var v = props[k].value;
        return v && ('value' in v) ? v.value : undefined;
      }
    }
    return undefined;
  }

  // Extract useful state flags (disabled / checked / required / etc.)
  // so agents can tell at a glance why `click @e61` isn't working or which
  // radio is already chosen, without an extra round-trip.
  // Only surface tags when the attribute is actually set — zero cost on
  // ordinary elements.
  function stateTags(n) {
    var tags = [];
    var props = n.properties;
    if (!props) return tags;
    if (axProp(props, 'disabled') === true) tags.push('disabled');
    var checked = axProp(props, 'checked');
    if (checked === 'true' || checked === true) tags.push('checked');
    else if (checked === 'mixed') tags.push('mixed');
    if (axProp(props, 'selected') === true) tags.push('selected');
    if (axProp(props, 'required') === true) tags.push('required');
    if (axProp(props, 'readonly') === true) tags.push('readonly');
    var pressed = axProp(props, 'pressed');
    if (pressed === 'true' || pressed === true) tags.push('pressed');
    var expanded = axProp(props, 'expanded');
    if (expanded === true) tags.push('expanded');
    else if (expanded === false) tags.push('collapsed');
    var invalid = axProp(props, 'invalid');
    if (invalid && invalid !== 'false') tags.push('invalid');
    return tags;
  }

  // Phase 1: build tree nodes with parent-child links from AX childIds
  var idToIdx = {};
  var T = []; // tree node array, parallel to `nodes`
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var role = str(n.role);
    var name = clean(str(n.name));
    var val = str(n.value).trim();
    if (val) val = val.substring(0, NAME_MAX);
    var ignored = (n.ignored && role !== 'RootWebArea') || role === 'InlineTextBox';
    T.push({
      r: ignored ? '' : role,
      n: name,
      v: val,
      bid: n.backendDOMNodeId,
      flags: ignored ? [] : stateTags(n),
      ch: [],
      ref: null,
      isI: !ignored && !!INTERACTIVE_ROLES[role],
      isC: !ignored && !!CONTENT_ROLES[role],
    });
    idToIdx[n.nodeId] = i;
  }
  for (var i = 0; i < nodes.length; i++) {
    var cids = nodes[i].childIds;
    if (!cids) continue;
    for (var j = 0; j < cids.length; j++) {
      var ci = idToIdx[cids[j]];
      if (ci !== undefined) T[i].ch.push(ci);
    }
  }

  // Phase 2: aggregate consecutive StaticText children
  for (var i = 0; i < T.length; i++) {
    var ch = T[i].ch;
    if (ch.length === 0) continue;
    var s = 0;
    while (s < ch.length) {
      if (T[ch[s]].r !== 'StaticText') { s++; continue; }
      var e = s + 1;
      while (e < ch.length && T[ch[e]].r === 'StaticText') e++;
      if (e > s + 1) {
        var agg = '';
        for (var k = s; k < e; k++) agg += T[ch[k]].n;
        T[ch[s]].n = agg.substring(0, NAME_MAX);
        for (var k = s + 1; k < e; k++) T[ch[k]].r = '';
      }
      s = e;
    }
    if (ch.length === 1 && T[ch[0]].r === 'StaticText' && T[ch[0]].n === T[i].n) {
      T[ch[0]].r = '';
    }
  }

  // Phase 3: assign stable refs to interactive elements.
  // Two-pass allocation keeps @eN stable across snapshots on the same page:
  // pass A reuses numbers from prevStableToRef, pass B fills gaps.
  var elements = [];
  var refMap = {};
  var isChild = [];
  for (var i = 0; i < T.length; i++) isChild.push(false);
  for (var i = 0; i < T.length; i++) {
    var ch = T[i].ch;
    for (var j = 0; j < ch.length; j++) isChild[ch[j]] = true;
  }
  var roots = [];
  for (var i = 0; i < T.length; i++) { if (!isChild[i]) roots.push(i); }

  function stableKeyFor(t, headingPath) {
    return (t.r || '') + '|' + (t.n || '') + '|' + (t.bid != null ? t.bid : '') + '|' + (headingPath || '');
  }

  function collectInteractive(idx, headingPath, out) {
    var t = T[idx];
    if (!t.r) { for (var c = 0; c < t.ch.length; c++) collectInteractive(t.ch[c], headingPath, out); return; }
    var nextPath = headingPath;
    if (t.r === 'heading' && t.n) nextPath = headingPath ? (headingPath + ' > ' + t.n) : t.n;
    if (t.isI) { t.stableKey = stableKeyFor(t, headingPath); out.push(idx); }
    for (var c = 0; c < t.ch.length; c++) collectInteractive(t.ch[c], nextPath, out);
  }

  var interactiveIdx = [];
  for (var ri = 0; ri < roots.length; ri++) collectInteractive(roots[ri], '', interactiveIdx);

  var usedNums = {};
  if (prevStableToRef) {
    for (var i = 0; i < interactiveIdx.length; i++) {
      var t = T[interactiveIdx[i]];
      var existing = prevStableToRef[t.stableKey];
      if (existing && !usedNums[existing]) { t.ref = existing; usedNums[existing] = true; }
    }
  }
  var nextNum = 1;
  for (var i = 0; i < interactiveIdx.length; i++) {
    var t = T[interactiveIdx[i]];
    if (t.ref) continue;
    while (usedNums['@e' + nextNum]) nextNum++;
    t.ref = '@e' + nextNum; usedNums[t.ref] = true; nextNum++;
  }

  var refCounter = interactiveIdx.length;
  for (var i = 0; i < interactiveIdx.length; i++) {
    var t = T[interactiveIdx[i]];
    var entry = { role: t.r, name: t.n || null, stableKey: t.stableKey };
    if (t.bid != null) entry.bid = t.bid;
    if (t.flags && t.flags.length) entry.flags = t.flags.slice();
    if (t.v) entry.value = t.v;
    refMap[t.ref] = entry;
    if (!interactive) {
      var legacy = { role: t.r, ref: t.ref };
      if (t.n) legacy.name = t.n;
      if (t.v) legacy.value = t.v;
      elements.push(legacy);
    }
  }
  if (!interactive) {
    for (var i = 0; i < T.length; i++) {
      var t = T[i];
      if (t.isC && t.n && !t.isI) {
        var centry = { role: t.r, name: t.n };
        if (t.v) centry.value = t.v;
        elements.push(centry);
      }
    }
  }

  // Phase 4: render indented tree, collapsing structural noise.
  // Filtering rules (in order):
  //   - Drop purely structural wrappers (RootWebArea, anonymous generic /
  //     listitem, etc.) — their children render at the parent's depth.
  //   - In interactive mode, drop nodes that are neither ref-bearing nor a
  //     content role (they can't be targeted and carry no semantic label).
  //   - Drop UNNAMED content roles with no ref descendants (e.g. `region`
  //     without a label wrapping nothing interactive — structural noise).
  //   - KEEP named content roles even without ref descendants: section
  //     headings like "Unified Memory" / "SSD Storage" are the only clue an
  //     agent has that a configuration section exists below a collapsed
  //     "Show more" button. Cheaper to keep a few extra lines than to have
  //     the agent miss a whole product option.
  var lines = [];
  var subtreeRefCache = {};
  function subtreeHasRef(idx) {
    if (subtreeRefCache[idx] !== undefined) return subtreeRefCache[idx];
    var t = T[idx];
    if (t.ref) { subtreeRefCache[idx] = true; return true; }
    for (var c = 0; c < t.ch.length; c++) {
      if (subtreeHasRef(t.ch[c])) { subtreeRefCache[idx] = true; return true; }
    }
    subtreeRefCache[idx] = false;
    return false;
  }
  // Compact a string to alphanumerics only, lowercased. Used for dedup:
  // `"Pro apps. Do even more"` and `"Pro apps.Do even more"` both collapse
  // to `proappsdoevenmore`, so the whitespace-free-substring check catches
  // near-duplicates even when source markup inserts/removes spaces.
  function alnum(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }

  function render(idx, depth, ancestorAlnum) {
    var t = T[idx];
    var role = t.r;
    if (!role) {
      for (var c = 0; c < t.ch.length; c++) render(t.ch[c], depth, ancestorAlnum);
      return;
    }
    if (role === 'RootWebArea' || role === 'WebArea') {
      for (var c = 0; c < t.ch.length; c++) render(t.ch[c], depth, ancestorAlnum);
      return;
    }
    if (role === 'generic' && !t.ref && !t.n) {
      for (var c = 0; c < t.ch.length; c++) render(t.ch[c], depth, ancestorAlnum);
      return;
    }
    if (role === 'listitem' && !t.n && !t.ref) {
      for (var c = 0; c < t.ch.length; c++) render(t.ch[c], depth, ancestorAlnum);
      return;
    }
    if (role === 'StaticText') {
      // Surface user-visible description text ("Available in 16GB, 24GB, or
      // 32GB" under the Unified Memory card) as `  · "text"` child lines
      // so the agent reads them without mistaking them for interactive
      // elements.
      //
      // Dedup: web markup frequently renders a control's label as sibling
      // text nodes rather than children (e.g. radio "512GB Included" has a
      // LabelText sibling containing `StaticText "512GB"` + `"Included"`).
      // Catch both ancestor-nested AND sibling duplicates by scanning the
      // last few emitted lines at this line's indent or shallower.
      var sn = clean(t.n);
      if (!sn) return;
      var snAlnum = alnum(sn);
      if (!snAlnum) return;
      if (ancestorAlnum && ancestorAlnum.indexOf(snAlnum) !== -1) return;
      var pad = '';
      for (var d = 0; d < depth; d++) pad += '  ';
      var bulletPad = pad + '  '; // 2-space indent for the `· "…"` line
      // The actual leading-space count of the line we're about to push —
      // same-depth sibling bullets share this indent and MUST be compared
      // against (previous `depth * 2` was off-by-two and silently skipped
      // every sibling comparison, letting fragments like "From$1099" be
      // emitted repeatedly under consecutive links/headings).
      var myIndent = bulletPad.length;
      for (var i = lines.length - 1, seen = 0; i >= 0 && seen < 32; i--, seen++) {
        var L = lines[i];
        var lIndent = L.length - L.replace(/^ +/, '').length;
        if (lIndent > myIndent) continue;
        if (alnum(L).indexOf(snAlnum) !== -1) return;
      }
      lines.push(bulletPad + '· "' + sn.replace(/"/g, '\\"') + '"');
      return;
    }
    if (interactive && !t.ref && !t.isC) {
      for (var c = 0; c < t.ch.length; c++) render(t.ch[c], depth, ancestorAlnum);
      return;
    }
    // Anonymous content role (no name) with no interactive descendants is
    // structural — skip it. Named content roles ALWAYS render (they're
    // the only labels the agent has for hidden / lazy-loaded sections).
    if (interactive && !t.ref && t.isC && !t.n && !subtreeHasRef(idx)) {
      return;
    }
    var pad = '';
    for (var d = 0; d < depth; d++) pad += '  ';
    var line = pad + '- ' + role;
    if (t.n) line += ' "' + t.n.replace(/"/g, '\\"') + '"';
    if (t.ref) line += ' ' + t.ref;
    if (t.flags && t.flags.length) line += ' [' + t.flags.join(' ') + ']';
    if (t.v && t.v !== t.n) line += ': ' + t.v;
    lines.push(line);
    var childAncestor = (ancestorAlnum || '') + alnum(t.n);
    for (var c = 0; c < t.ch.length; c++) render(t.ch[c], depth + 1, childAncestor);
  }
  for (var ri = 0; ri < roots.length; ri++) render(roots[ri], 0, '');

  var tree = lines.join('\n');
  if (!tree.trim()) tree = interactive ? '(no interactive elements)' : '(empty page)';

  if (interactive) {
    // Interactive mode: one pre-formatted `text` blob (`# refs=N\n<tree>`)
    // for agent consumption, plus `ref_map` keyed by `@eN` for host-side
    // ref resolution. Hosts (jarvis Rust CLI, endo Chrome extension, etc.)
    // print `text` verbatim to avoid JSON escape overhead — every `"` → `\"`
    // and every `\n` → `\\n` costs extra LLM tokens.
    var text = '# refs=' + refCounter + '\n' + tree;
    return { text: text, ref_count: refCounter, ref_map: refMap };
  }
  return {
    elements: elements,
    count: elements.length,
    ref_count: refCounter,
    tree: tree,
    ref_map: refMap,
  };
}

// ── Unified Command Dispatcher ──

function executeHatchCommand(command, params) {
  const p = params || {};
  switch (command) {
    case 'page.click':
      return clickElement(p.selector || null, p.text || null, p.right_click === true, p.double_click === true);
    case 'page.type':
      return typeIntoElement(p.selector || null, p.value, p.clear !== false, p.submit === true);
    case 'page.select':
      return selectOption(p.selector, p.value);
    case 'page.scroll':
      return scrollPage(p.direction || 'down', p.pixels || 500, p.selector || null);
    case 'page.fill_form': {
      const fields = typeof p.fields === 'string' ? JSON.parse(p.fields) : p.fields;
      return fillForm(fields, p.submit === true);
    }
    case 'page.describe':
      return describePageElements(p.selector || 'body', p.max_elements || 200);
    case 'page.content':
      return extractPageContent(p.selector || 'body', p.format || 'text', p.max_chars || 50000);
    case 'page.info':
      return { ok: true, title: document.title, url: location.href };
    case 'page.get_text':
      return { ok: true, title: document.title, url: location.href, text: document.body?.innerText || '' };
    case 'page.get_html':
      return { ok: true, title: document.title, url: location.href, html: document.documentElement.outerHTML };
    case 'page.submit': {
      const sel = p.selector || null;
      const el = sel ? document.querySelector(sel) : document.activeElement;
      if (!el || el === document.body) return { ok: false, error: 'No element found' };
      const form = el.closest('form');
      if (!form) return { ok: false, error: 'No form found' };
      try { form.requestSubmit(); } catch (e) { form.submit(); }
      return { ok: true, action: form.action || '' };
    }
    case 'page.elements': {
      const sels = 'a[href],button,input,select,textarea,[role="button"],[role="link"],[role="tab"],[onclick]';
      const results = [];
      for (const el of document.querySelectorAll(sels)) {
        const tag = el.tagName.toLowerCase();
        const text = (el.innerText || el.textContent || '').trim().slice(0, 80);
        const entry = { tag };
        if (text) entry.text = text;
        if (el.type) entry.type = el.type;
        if (el.name) entry.name = el.name;
        if (el.placeholder) entry.placeholder = el.placeholder;
        if (el.href) entry.href = el.href;
        const role = el.getAttribute('role');
        if (role) entry.role = role;
        if (el.id) entry.selector = '#' + CSS.escape(el.id);
        else if (el.name) entry.selector = tag + '[name=' + JSON.stringify(el.name) + ']';
        results.push(entry);
      }
      return { ok: true, count: results.length, elements: results };
    }
    case 'page.get': {
      const sel = p.selector;
      const what = p.what;
      const attrName = p.attr_name || 'href';
      if (what === 'count') {
        return { ok: true, selector: sel, count: document.querySelectorAll(sel).length };
      }
      const el = document.querySelector(sel);
      if (!el) return { ok: false, error: 'Element not found' };
      if (what === 'text') return { ok: true, text: el.innerText || el.textContent || '' };
      if (what === 'value') return { ok: true, value: el.value ?? el.textContent ?? '' };
      if (what === 'attr') return { ok: true, attr: attrName, value: el.getAttribute(attrName) };
      return { ok: false, error: 'Unknown property: ' + what };
    }
    default:
      return { ok: false, error: 'Unknown command: ' + command };
  }
}

// Playwright-style post-action settle. After a mutating action the agent
// usually wants to see the resulting state, so we wait for the page to
// quiesce before returning. This removes the need for the agent to chain
// explicit `wait`/`sleep` steps after every click.
//
// We wait on four conditions (bounded by `maxMs`):
//   1. Two requestAnimationFrames — flush the synchronous React commit +
//      style recalc that follow a dispatched click event.
//   2. readyState != 'loading' — handles full-page navigations.
//   3. No in-flight fetch()/XHR — counter maintained by the wrappers
//      installed in `__hh_install_net_tracking`. Catches the common
//      "click → XHR roundtrip → DOM update" pattern (e.g. Add-to-Bag
//      fetching cart contents) where the network response itself lags
//      300-1000ms behind the click.
//   4. MutationObserver idle window — DOM stable for `quietMs` after the
//      last mutation. Once XHR responses come back and React re-renders,
//      we wait for the last DOM write to settle.
// A small `minMs` floor guarantees we observe long enough to catch
// fetches scheduled via setTimeout / microtask (the fetch counter is
// only useful if `waitForSettle` sees it > 0 at least once).
// Pathological pages (live tickers, infinite animations, long-poll XHR)
// fall through at the maxMs cap, same as before.
// Network tracking is best-effort — some pages have frozen prototypes,
// strict CSP, or custom fetch wrappers that throw on reassignment. Any
// failure here must NOT prevent the rest of browser-kit.js from loading,
// otherwise `executeHatchCommand` is undefined and every `browser` call
// errors out with "extension bridge not available".
(function __hh_install_net_tracking() {
  try {
    if (typeof window === 'undefined') return;
    if (window.__hh_net_installed) return;
    window.__hh_net_installed = true;
    window.__hh_pending = 0;
    var origFetch = window.fetch;
    if (typeof origFetch === 'function') {
      window.fetch = function () {
        window.__hh_pending++;
        try {
          return origFetch.apply(this, arguments).finally(function () {
            if (window.__hh_pending > 0) window.__hh_pending--;
          });
        } catch (e) {
          if (window.__hh_pending > 0) window.__hh_pending--;
          throw e;
        }
      };
    }
    var OrigXHR = window.XMLHttpRequest;
    if (typeof OrigXHR === 'function' && OrigXHR.prototype && OrigXHR.prototype.send) {
      var origSend = OrigXHR.prototype.send;
      OrigXHR.prototype.send = function () {
        var self = this;
        window.__hh_pending++;
        var done = false;
        var dec = function () {
          if (done) return;
          done = true;
          if (window.__hh_pending > 0) window.__hh_pending--;
        };
        try {
          this.addEventListener('loadend', dec);
          this.addEventListener('error', dec);
          this.addEventListener('abort', dec);
        } catch (e) { /* fall through — fetch wrapper still helps */ }
        try {
          return origSend.apply(self, arguments);
        } catch (e) {
          dec();
          throw e;
        }
      };
    }
  } catch (e) {
    // best-effort: waitForSettle's fetch/XHR idle check just becomes a no-op
  }
})();

async function waitForSettle(maxMs) {
  const maxCap = Math.min(maxMs || 1500, 7500);
  const quietMs = 150;
  const minMs = 200; // floor — lets async-scheduled fetches register
  const startedAt = Date.now();
  const deadline = startedAt + maxCap;

  // rAF may be paused indefinitely on backgrounded, throttled, or navigating
  // pages. Never let the initial paint flush make Runtime.evaluate hang.
  await Promise.race([
    new Promise(function (resolve) {
      try {
        requestAnimationFrame(function () { requestAnimationFrame(resolve); });
      } catch (e) {
        resolve();
      }
    }),
    new Promise(function (resolve) { setTimeout(resolve, 100); })
  ]);

  while (document.readyState === 'loading' && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 50));
  }
  if (!document.body) return;
  let lastMutation = Date.now();
  const observer = new MutationObserver(() => { lastMutation = Date.now(); });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  try {
    while (Date.now() < deadline) {
      const elapsed = Date.now() - startedAt;
      const netIdle = !(window.__hh_pending > 0);
      const domQuiet = Date.now() - lastMutation >= quietMs;
      if (elapsed >= minMs && netIdle && domQuiet) return;
      await new Promise(r => setTimeout(r, 50));
    }
  } finally {
    observer.disconnect();
  }
}

// browser-kit.js is evaluated before most commands in the same JS world.
// Use `var` so reinjection does not fail on a top-level lexical redeclare.
var MUTATING_COMMANDS = {
  'page.click': 1, 'page.type': 1, 'page.select': 1,
  'page.scroll': 1, 'page.submit': 1, 'page.fill_form': 1,
};

async function executeHatchCommandAsync(command, params) {
  const p = params || {};
  if (command === 'page.wait') {
    const deadline = Date.now() + (p.timeout_ms || 10000);
    while (Date.now() < deadline) {
      const el = document.querySelector(p.selector);
      if (el) {
        if (p.visible === false) return { ok: true, found: true };
        const s = window.getComputedStyle(el);
        if (s.display !== 'none' && s.visibility !== 'hidden') return { ok: true, found: true };
      }
      await new Promise(r => setTimeout(r, 100));
    }
    return { ok: false, error: 'Timeout waiting for selector', found: false };
  }
  const result = executeHatchCommand(command, p);
  if (result && result.ok && MUTATING_COMMANDS[command]) {
    await waitForSettle();
  }
  return result;
}
