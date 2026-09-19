// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/lib/protocol.js
// kind: full-copy
// name: protocol.js
// byteRange: [0, 20835)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

const COMMAND_SCHEMA = {
  'tabs.list': {
    description: 'List all open tabs across all windows. Returns tab ID, URL, title, window ID, active status, and favicon URL for each tab. No required params — OMIT `invokeParamsJson` entirely when invoking (do not pass `invokeParamsJson: {}`).',
    required: {},
    optional: {
      window_id: { type: 'integer', description: 'Filter to a specific window' },
    },
  },
  'tabs.open': {
    description: "Open a new tab with the given URL. Returns the new tab's ID. Invoke via the `devices` tool as: {action:'invoke', device:<id>, invokeCommand:'tabs.open', invokeParamsJson:'{\"url\":\"https://example.com\"}'} — `invokeParamsJson` is a JSON-stringified object, not a nested object.",
    required: {
      url: { type: 'string', description: 'URL to open' },
    },
    optional: {
      window_id: { type: 'integer', description: 'Window to open in. Default: current window' },
      active: { type: 'boolean', description: 'Whether to focus the tab. Default: true' },
    },
  },
  'tabs.close': {
    description: 'Close a tab by ID.',
    required: {
      tab_id: { type: 'integer', description: 'Tab ID to close' },
    },
    optional: {},
  },
  'tabs.focus': {
    description: 'Bring a tab to focus (activate it and bring its window to front).',
    required: {
      tab_id: { type: 'integer', description: 'Tab ID to focus' },
    },
    optional: {},
  },
  'tabs.reload': {
    description: 'Reload a tab.',
    required: {},
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID to reload. Default: active tab' },
      hard: { type: 'boolean', description: 'Bypass cache. Default: false' },
    },
  },
  'tabs.navigate': {
    description: 'Navigate an existing tab to a new URL. Invoke via the `devices` tool as: {action:\'invoke\', device:<id>, invokeCommand:\'tabs.navigate\', invokeParamsJson:\'{"url":"https://example.com"}\'} — `invokeParamsJson` is a JSON-stringified object, not a nested object.',
    required: {
      url: { type: 'string', description: 'URL to navigate to' },
    },
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
    },
  },
  'page.snapshot': {
    description: 'DEFAULT command for element discovery. Returns `{text, ref_count}` where `text` is a plain-text accessibility tree beginning with `# refs=N` and lines like `  - button "Sign in" @e3`. Use the `@eN` tokens as the `selector` on page.click / page.type / page.select / page.scroll / page.submit / page.get — refs are resolved through DOM.resolveNode in a dedicated isolated world, so they keep working on pages that override prototypes or mutate the DOM aggressively. The ref map survives MV3 service-worker teardown (stored in chrome.storage.session) and is invalidated on cross-document navigation — run page.snapshot again after a navigate. Plain-text output (instead of a JSON `tree` + `elements` list) eliminates JSON escape overhead and cuts LLM tokens by ~35%. Use this instead of page.describe or page.elements in almost every case. No required params — OMIT `invokeParamsJson` when invoking with defaults (do not pass `invokeParamsJson: {}`).',
    required: {},
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
      interactive: { type: 'boolean', description: 'If true (default), restrict to interactive + content elements (buttons, links, inputs, headings, landmarks). Set false for a broader tree.' },
      full: { type: 'boolean', description: 'Force the complete tree instead of a delta against the previous snapshot of the same URL. Default: false. Use when you need every @eN ref listed again — for example after losing track of earlier output.' },
    },
  },
  'page.describe': {
    description: 'LEGACY. DOM-walk element enumeration with CSS selectors, form structure (forms, fieldsets, labels, needs_attention). Prefer `page.snapshot` for element discovery — it returns a smaller accessibility tree with @eN refs that resolve through DOM.resolveNode in an isolated world, which is more robust than CSS selectors on dynamic pages. Only reach for page.describe when you specifically need form grouping, explicit labels, or required/invalid flags the AX tree does not expose. No required params — OMIT `invokeParamsJson` when invoking with defaults.',
    required: {},
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
      selector: { type: 'string', description: 'CSS selector to scope the description to a subtree' },
      max_elements: { type: 'integer', description: 'Max elements to return. Default: 200' },
    },
  },
  'page.elements': {
    description: 'LEGACY. Flat list of interactive elements (links, buttons, inputs, selects, textareas) with tag, text, type, name, href, role, and CSS selector — indexed by `index`. Prefer page.snapshot for ref-based targeting; prefer page.describe for full form structure. No required params — OMIT `invokeParamsJson`.',
    required: {},
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
    },
  },
  'page.get': {
    description: 'Read a single property (text, value, attr, or count) from an element. Selector accepts a CSS selector or an @eN ref from page.snapshot. For `attr`, supply `attr_name` (default "href"). `count` requires a CSS selector.',
    required: {
      what: { type: 'string', description: "Property to read: 'text', 'value', 'attr', or 'count'." },
      selector: { type: 'string', description: 'CSS selector or @eN ref of the target element (for count, CSS selector only).' },
    },
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
      attr_name: { type: 'string', description: 'Attribute name when what="attr". Default: "href".' },
    },
  },
  'page.get_text': {
    description: "Get the page's visible text (document.body.innerText) plus its title and URL. Useful for reading article content; for structured interaction use page.snapshot or page.describe. No required params — OMIT `invokeParamsJson`.",
    required: {},
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
    },
  },
  'page.get_html': {
    description: "Get the page's full outer HTML plus its title and URL. Avoid for large pages; prefer page.get_text or page.content with a selector. No required params — OMIT `invokeParamsJson`.",
    required: {},
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
    },
  },
  'page.submit': {
    description: 'Submit the form containing an element (or the currently-focused element when selector is omitted). Selector accepts a CSS selector or an @eN ref from page.snapshot.',
    required: {},
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
      selector: { type: 'string', description: 'CSS selector or @eN ref of an element inside the form. Omit to submit the form containing the focused element.' },
    },
  },
  'page.content': {
    description: 'Get the page content as text, HTML, or markdown. Useful for reading articles, extracting data, or understanding page state.',
    required: {},
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
      format: { type: 'string', description: "Output format: 'text', 'html', or 'markdown'. Default: 'text'" },
      selector: { type: 'string', description: 'CSS selector to extract content from. Default: document.body' },
      max_chars: { type: 'integer', description: 'Max characters to return. Default: 50000' },
    },
  },
  'page.click': {
    description: 'Click an element on the page. `selector` accepts a CSS selector or an @eN ref from page.snapshot; when omitted, `text` performs a fuzzy visible-text match. Prefer @eN refs when available — they resolve through DOM.resolveNode in an isolated world and survive prototype-poisoning pages. Invoke via the `devices` tool as: {action:\'invoke\', device:<id>, invokeCommand:\'page.click\', invokeParamsJson:\'{"selector":"@e3"}\'} — `invokeParamsJson` is a JSON-stringified object, not a nested object.',
    required: {},
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
      selector: { type: 'string', description: 'CSS selector or @eN ref of element to click' },
      text: { type: 'string', description: 'Visible text content of element to click (fuzzy match). Used only when selector is omitted.' },
      iframe: { type: 'string', description: 'Iframe selector or URL fragment to target. Omit for main frame.' },
      right_click: { type: 'boolean', description: 'Right-click instead of left-click. Default: false' },
      double_click: { type: 'boolean', description: 'Double-click. Default: false' },
    },
  },
  'page.type': {
    description: 'Type text into an input field. Clears existing content first by default. Selector accepts a CSS selector or an @eN ref from page.snapshot; when omitted, the currently-focused element is used. Invoke via the `devices` tool as: {action:\'invoke\', device:<id>, invokeCommand:\'page.type\', invokeParamsJson:\'{"selector":"@e2","value":"hello","submit":true}\'} — `invokeParamsJson` is a JSON-stringified object, not a nested object.',
    required: {
      value: { type: 'string', description: 'Text to type' },
    },
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
      selector: { type: 'string', description: 'CSS selector or @eN ref of input. Default: currently focused element' },
      clear: { type: 'boolean', description: 'Clear existing value before typing. Default: true' },
      submit: { type: 'boolean', description: 'Press Enter (or submit the containing form) after typing. Default: false' },
      iframe: { type: 'string', description: 'Iframe selector or URL fragment' },
    },
  },
  'page.select': {
    description: 'Select an option from a <select> dropdown. Selector accepts a CSS selector or an @eN ref from page.snapshot.',
    required: {
      selector: { type: 'string', description: 'CSS selector or @eN ref of the select element' },
      value: { type: 'string', description: 'Option value or visible text to select' },
    },
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
    },
  },
  'page.screenshot': {
    description: 'Capture a screenshot of the visible area or full page. Returns base64 PNG.',
    required: {},
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
      full_page: { type: 'boolean', description: 'Capture full scrollable page. Default: false (visible area only)' },
      selector: { type: 'string', description: 'CSS selector of element to capture. Crops to that element.' },
    },
  },
  'page.wait': {
    description: 'Wait for a CSS selector to appear in the DOM. Useful after navigation or dynamic content loading.',
    required: {
      selector: { type: 'string', description: 'CSS selector to wait for' },
    },
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
      timeout_ms: { type: 'integer', description: 'Max wait time in milliseconds. Default: 10000' },
      visible: { type: 'boolean', description: 'Wait until element is visible (not just in DOM). Default: true' },
    },
  },
  'page.scroll': {
    description: 'Scroll the page or a specific element. When `selector` is an @eN ref and no `direction` is given, scrolls that element into center view.',
    required: {},
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
      direction: { type: 'string', description: "'up', 'down', 'top', 'bottom'. Default: 'down'" },
      pixels: { type: 'integer', description: 'Pixels to scroll. Default: 500' },
      selector: { type: 'string', description: 'CSS selector or @eN ref to scroll into view (or the scroll container when `direction` is set)' },
    },
  },
  'page.fill_form': {
    description: 'Fill multiple form fields at once. More efficient than multiple page.type calls. Pass fields as a JSON string: [{"selector":"#email","value":"test@example.com"},...]',
    required: {
      fields: { type: 'string', description: 'JSON array of {selector, value} objects. Each field is filled in order.' },
    },
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID. Default: active tab' },
      submit: { type: 'boolean', description: 'Submit the form after filling. Default: false' },
    },
  },
  'downloads.list': {
    description: 'List recent downloads with filename, URL, state, and local path.',
    required: {},
    optional: {
      limit: { type: 'integer', description: 'Max results. Default: 20' },
      query: { type: 'string', description: 'Filter by filename' },
    },
  },
  'history.search': {
    description: 'Search browser history.',
    required: {
      query: { type: 'string', description: 'Search query' },
    },
    optional: {
      max_results: { type: 'integer', description: 'Max results. Default: 20' },
      start_time: { type: 'string', description: 'ISO date string. Only results after this time.' },
    },
  },
  'bookmarks.search': {
    description: 'Search bookmarks by title or URL.',
    required: {
      query: { type: 'string', description: 'Search query' },
    },
    optional: {},
  },
  'notifications.show': {
    description: 'Show a browser notification to the user.',
    required: {
      title: { type: 'string', description: 'Notification title' },
    },
    optional: {
      message: { type: 'string', description: 'Notification body' },
      icon_url: { type: 'string', description: 'Icon URL' },
    },
  },
  'page.batch': {
    description: 'Execute a sequence of browser actions in order. Each step runs after the previous one completes. Stops on first error by default. Returns results from all steps. Much faster than individual commands — eliminates network round trips between steps. Supported step actions: navigate, wait, click, type, key, select, scroll, screenshot, sleep, describe. Naming note: this matches the `browser batch` subcommand in the jarvis hatch-browser CLI; the older name `page.macro` is gone.',
    required: {
      steps: { type: 'string', description: 'JSON array of step objects. Each step has an "action" field and action-specific params. Examples: {"action":"navigate","url":"https://..."}, {"action":"wait","selector":"#el","timeout_ms":5000}, {"action":"click","selector":"button"}, {"action":"click","text":"Submit"}, {"action":"type","selector":"input","value":"hello","clear":true}, {"action":"key","key":"Enter"}, {"action":"select","selector":"select","value":"opt"}, {"action":"scroll","direction":"down","pixels":500}, {"action":"screenshot"}, {"action":"evaluate","expression":"document.title"}, {"action":"sleep","ms":500}, {"action":"describe","max_elements":50}' },
    },
    optional: {
      tab_id: { type: 'integer', description: 'Tab ID for all steps. Default: active tab' },
      stop_on_error: { type: 'boolean', description: 'Stop on first error. Default: true' },
    },
  },
};

// Normalize every command's agent-facing description so it states the
// `invokeParamsJson` calling convention consistently. jarvis declares the
// `devices` tool's `invokeParamsJson` as `Option<String>`, so the agent MUST
// send a JSON-encoded string (never a nested object) or the call fails with a
// serde "invalid type: map, expected a string" error. The node-level
// description below documents this globally; this loop guarantees each
// individual command says it too (the model usually reads the specific
// command's description). Idempotent: commands whose description already
// mentions `invokeParamsJson` are left untouched, and new commands added to
// `COMMAND_SCHEMA` get the right note automatically.
const INVOKE_PARAMS_NOTE_REQUIRED =
  ' `invokeParamsJson` must be a JSON-encoded STRING, e.g. invokeParamsJson:"{\\"k\\":\\"v\\"}" — never a nested object.';
const INVOKE_PARAMS_NOTE_OPTIONAL =
  ' Params are optional: OMIT `invokeParamsJson` to use defaults; if you pass it, it must be a JSON-encoded STRING (e.g. invokeParamsJson:"{\\"tab_id\\":5}"), never a nested object.';
const INVOKE_PARAMS_NOTE_NONE =
  ' No params — OMIT `invokeParamsJson` entirely (do not pass `invokeParamsJson: {}` or "{}").';

for (const spec of Object.values(COMMAND_SCHEMA)) {
  if (typeof spec.description !== 'string' || spec.description.includes('invokeParamsJson')) {
    continue;
  }
  const hasRequired = Object.keys(spec.required || {}).length > 0;
  const hasOptional = Object.keys(spec.optional || {}).length > 0;
  if (hasRequired) {
    spec.description += INVOKE_PARAMS_NOTE_REQUIRED;
  } else if (hasOptional) {
    spec.description += INVOKE_PARAMS_NOTE_OPTIONAL;
  } else {
    spec.description += INVOKE_PARAMS_NOTE_NONE;
  }
}

function makeRegisterMessage(nodeId, displayName = 'Chrome') {
  return {
    type: 'req',
    id: crypto.randomUUID(),
    method: 'node.register',
    params: {
      node_id: nodeId,
      display_name: displayName,
      description: 'Browser control node. Commands are targeted to specific tab IDs and work in the background.\n\n=== CALLING CONVENTION (read before first invoke) ===\nThis node is invoked through the jarvis `devices` tool. Its `invokeParamsJson` argument is declared on the Rust side as `Option<String>`, NOT an object. You MUST follow these rules:\n  1. For commands with required params, `invokeParamsJson` is a JSON-ENCODED STRING. Correct: `invokeParamsJson: "{\\"url\\":\\"https://example.com\\"}"`. Wrong: `invokeParamsJson: {"url":"https://example.com"}` — this fails with Rust serde error `invalid type: map, expected a string at line 1 column ~114`. If you see that error, you passed params as an object instead of a JSON string; retry with the whole params object stringified once.\n  2. For commands with NO required params (tabs.list, tabs.reload, page.snapshot, page.describe, page.elements, page.get_text, page.get_html, page.info, bookmarks.search with no args, etc.), OMIT `invokeParamsJson` entirely. Do NOT pass `invokeParamsJson: "{}"`, do NOT pass `invokeParamsJson: {}`, do NOT pass `invokeParamsJson: ""`. Just leave the field out.\n  3. Never include a second `params` or `args` field in the `devices` call — only `invokeCommand` + optionally `invokeParamsJson`.\n\nExamples of correct `devices` invocations for this node:\n  • tabs.list (no params): `{"action":"invoke","device":"<id>","invokeCommand":"tabs.list"}`\n  • tabs.open: `{"action":"invoke","device":"<id>","invokeCommand":"tabs.open","invokeParamsJson":"{\\"url\\":\\"https://example.com\\"}"}`\n  • page.click by @ref: `{"action":"invoke","device":"<id>","invokeCommand":"page.click","invokeParamsJson":"{\\"selector\\":\\"@e3\\"}"}`\n  • page.type: `{"action":"invoke","device":"<id>","invokeCommand":"page.type","invokeParamsJson":"{\\"selector\\":\\"@e2\\",\\"value\\":\\"hello\\",\\"submit\\":true}"}`\n\n=== COMMAND GUIDANCE ===\nFor element discovery, use page.snapshot by default — the accessibility tree with @eN ref tokens is smaller, more semantic, and the refs are resolved through DOM.resolveNode in an isolated world so they stay stable across DOM churn. page.describe and page.elements are legacy (CSS-selector-based) and should only be used when you specifically need form grouping, labels, or required/invalid flags. For any task requiring more than 2 browser actions, use page.batch instead of individual commands — it executes all steps locally in one round trip and is 10-20x faster. Only use individual commands for single actions or when you need to read results before deciding the next step. Never use desktop keyboard/mouse automation to interact with browser content.',
      platform: 'browser',
      version: chrome.runtime.getManifest().version,
      commands: COMMAND_SCHEMA,
      commands_v2: COMMAND_SCHEMA,
      device_family: 'chrome',
      model_id: navigator.userAgent,
    },
  };
}

function makeHeartbeatMessage(nodeId) {
  return {
    type: 'req',
    id: crypto.randomUUID(),
    method: 'node.heartbeat',
    params: { node_id: nodeId },
  };
}

function makeInvokeResultMessage(requestId, nodeId, result) {
  return {
    type: 'req',
    id: crypto.randomUUID(),
    method: 'node.invoke.result',
    params: {
      request_id: requestId,
      node_id: nodeId,
      result,
    },
  };
}

function makeOk(payloadObj) {
  return { ok: true, payload_json: JSON.stringify(payloadObj) };
}

function makeError(code, message) {
  return { ok: false, error: { code, message } };
}
