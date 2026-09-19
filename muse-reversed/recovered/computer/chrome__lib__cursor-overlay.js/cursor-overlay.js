// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/lib/cursor-overlay.js
// kind: full-copy
// name: cursor-overlay.js
// byteRange: [0, 19399)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

// cursor-overlay.js — Figma-style "driver cursor" for the Hatch Chrome
// extension. Injects a non-interactive SVG cursor + name bubble + click
// ripple + software keyboard into a CLOSED Shadow DOM mounted on the
// top-level document, so the user sees a visual trail of what Hatch is
// doing while the agent drives the page.
//
// Contract:
//   * Overlay host is `#__hatch_cursor_host` on `document.documentElement`
//     with `z-index: 2147483647`, `pointer-events: none`, and a CLOSED
//     Shadow DOM. Page scripts can neither reach in nor have overlay
//     CSS leak out.
//   * IIFE is idempotent: second mount in the same world is a no-op.
//   * Injected via `chrome.scripting.executeScript({world:'ISOLATED'})`
//     from the host, so no CDP debugger attach is required and it
//     works on every page covered by `<all_urls>` host permissions.
//   * All cursor animations are fire-and-forget from the host side —
//     agent actions do not wait for tweens to complete.

/**
 * Map a page's computed `cursor` CSS value into one of the overlay's
 * supported cursor art slots. Kept pure so unit tests can exercise it
 * without a DOM.
 *
 * @param {string | null | undefined} cssCursor
 * @returns {'default' | 'pointer' | 'text' | 'grab' | 'not-allowed'}
 */
function cssCursorToOverlayCursor(cssCursor) {
  if (!cssCursor || typeof cssCursor !== 'string') return 'default';
  const normalized = cssCursor.trim().toLowerCase();
  if (normalized.startsWith('url(')) {
    const fallback = normalized.split(/\s+/).pop() || '';
    return cssCursorToOverlayCursor(fallback);
  }
  if (normalized === 'pointer') return 'pointer';
  if (
    normalized === 'text' ||
    normalized === 'vertical-text' ||
    normalized.endsWith('-text')
  ) {
    return 'text';
  }
  if (normalized === 'grab' || normalized === 'grabbing') return 'grab';
  if (normalized === 'not-allowed' || normalized === 'no-drop') {
    return 'not-allowed';
  }
  return 'default';
}

/**
 * Deterministic pastel-friendly color for a given display name. Stable
 * across reloads so the same Hatch always shows in the same color.
 * Pure — no DOM.
 *
 * @param {string} name
 * @returns {string} hex color like `#3B82F6`
 */
function colorForName(name) {
  const PALETTE = [
    '#F43F5E', '#3B82F6', '#10B981', '#A855F7',
    '#F97316', '#14B8A6', '#EAB308', '#EC4899',
    '#6366F1', '#22C55E',
  ];
  const key = String(name || 'Muse');
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}

/**
 * Identify the QWERTY key slot for a single-character input. Returns
 * `null` for characters that are not present on the rendered keyboard.
 * Pure — no DOM.
 *
 * @param {string} ch - one character
 * @returns {{row: number, key: string} | null}
 */
function keyboardKeyForChar(ch) {
  if (!ch || typeof ch !== 'string') return null;
  const c = ch.toLowerCase();
  if (c === ' ') return { row: 3, key: 'space' };
  const ROWS = [
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
  ];
  for (let r = 0; r < ROWS.length; r++) {
    if (ROWS[r].includes(c)) return { row: r, key: c };
  }
  return null;
}

// Mount function that chrome.scripting.executeScript invokes via
// `func: mountHatchCursorOverlay`. We pass a real function reference
// — NOT a string — because MV3 blocks `eval`/`new Function` in
// extension contexts including the scripting isolated world. Chrome
// serializes this function via `Function.prototype.toString()` and
// re-parses it in the target tab, so it has no eval involved.
// Idempotent: second mount in the same world is a no-op.
function mountHatchCursorOverlay() {
  if (window.__hatch_cursor_overlay && document.getElementById('__hatch_cursor_host')) return;

  console.log('[Muse overlay] mounting');

  const MAX_Z = 2147483647;
  const PALETTE = ['#F43F5E', '#3B82F6', '#10B981', '#A855F7', '#F97316', '#14B8A6', '#EAB308', '#EC4899', '#6366F1', '#22C55E'];
  const KEY_ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m'],
  ];

  // Cursor visual size. 1.0 = native system-cursor size. A little
  // larger than native reads better as an "agent cursor" — Figma's
  // multiplayer cursors do the same. Bump to 3 to re-enable the
  // bright debug size we used while validating the injection path.
  const CURSOR_SCALE = 1.4;
  const SHOW_BORDER = true;

  function colorForName(name) {
    const key = String(name || 'Muse');
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
  }

  function keyboardKeyForChar(ch) {
    if (!ch || typeof ch !== 'string') return null;
    const c = ch.toLowerCase();
    if (c === ' ') return { row: 3, key: 'space' };
    for (let r = 0; r < KEY_ROWS.length; r++) {
      if (KEY_ROWS[r].includes(c)) return { row: r, key: c };
    }
    return null;
  }

  const host = document.createElement('div');
  host.id = '__hatch_cursor_host';
  host.style.cssText = 'position:fixed;top:8px;left:8px;width:calc(100vw - 16px);height:calc(100vh - 16px);pointer-events:none;z-index:' + MAX_Z + ';margin:0;padding:0;' + (SHOW_BORDER ? 'border:2px dashed rgba(59,130,246,.45);border-radius:12px;' : '');
  const container = document.documentElement || document.body;
  if (!container) {
    console.warn('[Muse overlay] no container to mount on');
    return;
  }
  container.appendChild(host);

  const root = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = [
    ':host,*{box-sizing:border-box;margin:0;padding:0;}',
    // Cursor div itself is only translated — each SVG art variant
    // inside it is what gets scaled. Keeps the label bubble at
    // natural size next to the cursor tip instead of ballooning.
    '.cursor{position:absolute;top:0;left:0;will-change:transform;transition:transform 280ms cubic-bezier(.25,.46,.45,.94),opacity 300ms ease;pointer-events:none;}',
    '.cursor .art{display:none;position:absolute;top:0;left:0;transform:scale(' + CURSOR_SCALE + ');transform-origin:0 0;overflow:visible;filter:drop-shadow(0 3px 8px rgba(0,0,0,.38));}',
    '.cursor .label{position:absolute;top:' + (17 * CURSOR_SCALE + 4) + 'px;left:' + (2 * CURSOR_SCALE) + 'px;background:var(--hc,#3B82F6);color:#fff;font:600 11px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:3px 7px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);letter-spacing:.015em;}',
    '.cursor[data-hidden="true"]{opacity:0.15;}',
    // Variant visibility. `pointer` (hand) is intentionally disabled
    // for now — updateVariantFromPoint never sets data-variant to
    // "pointer". The SVG stays in the DOM as dead code so we can
    // re-enable it later without re-injection.
    '.cursor[data-variant="default"] .arrow{display:block;}',
    '.cursor[data-variant="click"] .click{display:block;}',
    '.cursor[data-variant="text"] .ibeam{display:block;}',
    '.ripple{position:absolute;width:' + (18 * CURSOR_SCALE) + 'px;height:' + (18 * CURSOR_SCALE) + 'px;border-radius:50%;background:var(--hc,#3B82F6);transform:translate(-50%,-50%);pointer-events:none;animation:hc-ripple 620ms ease-out forwards;}',
    '@keyframes hc-ripple{0%{transform:translate(-50%,-50%) scale(.4);opacity:.85;}100%{transform:translate(-50%,-50%) scale(5);opacity:0;}}',
    '.keyboard{position:fixed;bottom:28px;left:50%;transform:translate(-50%,140%);transition:transform 320ms cubic-bezier(.25,.46,.45,.94),opacity 260ms ease;opacity:0;pointer-events:none;padding:12px 12px 14px;background:rgba(22,24,28,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-radius:14px;display:grid;gap:6px;font:600 14px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff;box-shadow:0 16px 40px rgba(0,0,0,.45);}',
    '.keyboard[data-open="true"]{transform:translate(-50%,0);opacity:1;}',
    '.keyboard .row{display:flex;gap:5px;justify-content:center;}',
    '.keyboard .key{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);border-radius:6px;transition:transform 80ms ease,background-color 120ms ease;text-transform:uppercase;}',
    '.keyboard .key.wide{width:160px;}',
    '.keyboard .key[data-pressed="true"]{background:var(--hc,#3B82F6);border-color:transparent;transform:scale(.92);box-shadow:0 0 0 3px rgba(255,255,255,.18) inset;}',
    '.banner{position:fixed;top:18px;right:18px;padding:10px 14px;background:#F43F5E;color:#fff;font:700 13px/1.2 -apple-system,sans-serif;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.45);transition:opacity 400ms ease;pointer-events:none;}',
  ].join('\n');
  root.appendChild(style);

  // --- cursor element ------------------------------------------------
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.dataset.variant = 'default';
  // DEBUG: start visible at viewport center so you see SOMETHING on mount,
  // regardless of whether any moveTo call has fired yet.
  const centerX = Math.floor(window.innerWidth / 2);
  const centerY = Math.floor(window.innerHeight / 2);
  cursor.dataset.hidden = 'false';
  cursor.style.transform = 'translate(' + centerX + 'px,' + centerY + 'px)';
  // Cursor art: Lucide (lucide.dev) paths, restyled with dark fill +
  // thin white outline so they read clearly on any page background.
  // Each SVG's viewBox is cropped so user-space (hotspot_x, hotspot_y)
  // maps to SVG top-left (0, 0) — the parent cursor div's translate
  // places that corner at the target point, so the cursor tip lands
  // exactly where moveTo/clickAt was called. overflow:visible lets
  // decorative parts (e.g. click radiating lines) extend outside the
  // viewBox without clipping.
  cursor.innerHTML = [
    // ── Default arrow ── Lucide mouse-pointer-2 (closed path → fillable)
    // Hotspot: path starts at (4.037, 4.688). viewBox crops there.
    '<svg class="art arrow" width="17" height="17" viewBox="4 4.5 18 18" xmlns="http://www.w3.org/2000/svg">',
    '  <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"',
    '        fill="#111" stroke="#fff" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>',
    '</svg>',

    // ── Click emphasis ── Lucide mouse-pointer-click (arrow + radiating strokes)
    // Hotspot: main arrow starts at (9.037, 9.69). The radiating click
    // lines sit up-and-left of that — with overflow:visible they still
    // render past the cropped viewBox, which is exactly where they
    // should appear: emanating from the click point.
    '<svg class="art click" width="17" height="17" viewBox="9 9.5 14 14" xmlns="http://www.w3.org/2000/svg">',
    '  <g fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">',
    '    <path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/>',
    '  </g>',
    '  <g fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
    '    <path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/>',
    '  </g>',
    '  <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"',
    '        fill="#111" stroke="#fff" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>',
    '</svg>',

    // ── Pointer (hover over link) ── Lucide pointer (hand icon)
    // Hotspot: fingertip at roughly (8, 2). Paths are open strokes —
    // draw twice (white halo under, dark stroke on top) so it reads
    // like a filled+outlined cursor icon.
    '<svg class="art hand" width="20" height="20" viewBox="8 2 16 22" xmlns="http://www.w3.org/2000/svg">',
    '  <g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">',
    '    <path d="M22 14a8 8 0 0 1-8 8"/>',
    '    <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>',
    '    <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/>',
    '    <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/>',
    '    <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    '  </g>',
    '  <g fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
    '    <path d="M22 14a8 8 0 0 1-8 8"/>',
    '    <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>',
    '    <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/>',
    '    <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/>',
    '    <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    '  </g>',
    '</svg>',

    // ── Text I-beam ── Lucide text-cursor, halo treatment.
    // Hotspot centered on the I-beam (natural text-cursor hotspot).
    '<svg class="art ibeam" width="13" height="22" viewBox="4 1 16 22" xmlns="http://www.w3.org/2000/svg">',
    '  <g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">',
    '    <path d="M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1"/>',
    '    <path d="M7 22h1a4 4 0 0 0 4-4v-1"/>',
    '    <path d="M7 2h1a4 4 0 0 1 4 4v1"/>',
    '  </g>',
    '  <g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '    <path d="M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1"/>',
    '    <path d="M7 22h1a4 4 0 0 0 4-4v-1"/>',
    '    <path d="M7 2h1a4 4 0 0 1 4 4v1"/>',
    '  </g>',
    '</svg>',

    '<div class="label">Muse</div>',
  ].join('');
  root.appendChild(cursor);
  const label = cursor.querySelector('.label');

  // --- software keyboard --------------------------------------------
  const keyboard = document.createElement('div');
  keyboard.className = 'keyboard';
  const keyEls = new Map();
  for (let r = 0; r < KEY_ROWS.length; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'row';
    for (const ch of KEY_ROWS[r]) {
      const k = document.createElement('div');
      k.className = 'key';
      k.textContent = ch;
      rowEl.appendChild(k);
      keyEls.set(ch, k);
    }
    keyboard.appendChild(rowEl);
  }
  const spaceRow = document.createElement('div');
  spaceRow.className = 'row';
  const space = document.createElement('div');
  space.className = 'key wide';
  space.textContent = '';
  spaceRow.appendChild(space);
  keyboard.appendChild(spaceRow);
  keyEls.set('space', space);
  root.appendChild(keyboard);

  // --- state ---------------------------------------------------------
  let keyboardTimer = null;
  let clickVariantTimer = null;

  function applyColor(name) {
    const c = colorForName(name);
    host.style.setProperty('--hc', c);
    cursor.style.setProperty('--hc', c);
    keyboard.style.setProperty('--hc', c);
    label.style.background = c;
  }

  function updateVariantFromPoint(x, y) {
    // Don't override the click variant while its brief animation is
    // playing — we want the click rays to stay visible for the full
    // duration, not flip back to arrow on the same-tick moveTo.
    if (clickVariantTimer) return;
    const el = document.elementFromPoint(x, y);
    if (!el) return;
    let css = '';
    try { css = (window.getComputedStyle(el).cursor || '').toLowerCase(); } catch {}
    // `pointer` (hand-on-link-hover) intentionally disabled for now —
    // the Lucide hand icon didn't look native enough. Falls through to
    // the default arrow even when the page's CSS cursor is `pointer`.
    if (css === 'text' || css === 'vertical-text' || css.endsWith('-text')) {
      cursor.dataset.variant = 'text';
    } else {
      cursor.dataset.variant = 'default';
    }
  }

  function scheduleIdleFade() {}

  function moveTo(x, y) {
    x = Number(x); y = Number(y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    cursor.dataset.hidden = 'false';
    // Cursor art's hotspot is at SVG (0,0); the translate alone puts
    // the tip exactly at (x, y). No cursor-scale math needed here —
    // the SVG itself is scaled via CSS with transform-origin:0 0.
    cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    updateVariantFromPoint(x, y);
    scheduleIdleFade();
  }

  function clickAt(x, y) {
    x = Number(x); y = Number(y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    // Ripple at the click point.
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    root.appendChild(ripple);
    setTimeout(() => { try { ripple.remove(); } catch {} }, 700);

    // Swap the cursor to the Lucide mouse-pointer-click art for a
    // brief moment so it visually "clicks" — radiating lines pulse
    // out from the tip, then it reverts.
    moveTo(x, y);
    const prev = cursor.dataset.variant || 'default';
    cursor.dataset.variant = 'click';
    if (clickVariantTimer) clearTimeout(clickVariantTimer);
    clickVariantTimer = setTimeout(() => {
      clickVariantTimer = null;
      // Only revert if no other variant took over in the meantime.
      if (cursor.dataset.variant === 'click') {
        cursor.dataset.variant = prev === 'click' ? 'default' : prev;
      }
    }, 280);
  }

  function typeChar(ch) {
    if (!ch) return;
    const slot = keyboardKeyForChar(String(ch).charAt(0));
    const el = slot ? keyEls.get(slot.key) : null;
    if (!el) return;
    el.dataset.pressed = 'true';
    setTimeout(() => { try { el.dataset.pressed = 'false'; } catch {} }, 140);
  }

  function showKeyboard() {
    if (keyboardTimer) { clearTimeout(keyboardTimer); keyboardTimer = null; }
    keyboard.dataset.open = 'true';
  }

  function hideKeyboard(delayMs) {
    if (keyboardTimer) clearTimeout(keyboardTimer);
    const d = Math.max(0, Number(delayMs) || 0);
    keyboardTimer = setTimeout(() => { keyboard.dataset.open = 'false'; }, d);
  }

  function setName(name) {
    const n = String(name || 'Muse').slice(0, 32);
    label.textContent = n;
    applyColor(n);
  }

  function detach() {
    try { host.remove(); } catch {}
    delete window.__hatch_cursor_overlay;
  }

  function __debugMountBanner() {}

  applyColor('Muse');
  console.log('[Muse overlay] ready at', centerX, centerY, 'scale', CURSOR_SCALE);

  window.__hatch_cursor_overlay = {
    moveTo,
    clickAt,
    typeChar,
    showKeyboard,
    hideKeyboard,
    setName,
    detach,
    __debugMountBanner,
    __version: 8,
  };
}

// -------------------------------------------------------------------
// Expose the pure helpers + mount function to the service worker
// global for both runtime use (commands.js passes `mountHatchCursorOverlay`
// directly as the `func:` arg to chrome.scripting.executeScript) and
// unit tests (which load this file via vm sandbox).
// -------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
var __cursorOverlayExports = {
  cssCursorToOverlayCursor,
  colorForName,
  keyboardKeyForChar,
  mountHatchCursorOverlay,
};
