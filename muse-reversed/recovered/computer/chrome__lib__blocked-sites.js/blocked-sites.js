// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/lib/blocked-sites.js
// kind: full-copy
// name: blocked-sites.js
// byteRange: [0, 7545)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

/**
 * Websites the agent must not drive this browser to. The extension is its own
 * gateway node — it never calls into Endo to run a command — so it cannot
 * consult Endo's `BlockedSitesService` and carries its own copy of the rules.
 *
 * `BLOCKED_DOMAINS` is deliberately the only rule source: it is the seam a
 * later diff replaces with a real transport (MetaConfig). Until then it must
 * stay in sync with `builtInDomains` in
 * `Sources/Shared/HatchTools/BlockedSitesService.swift`.
 *
 * Matching mirrors that Swift implementation exactly, because a rule that means
 * two different things on two enforcement paths is a bypass:
 *   • a domain matches the host exactly or as a parent of it, anchored on a `.`
 *     so `example.com` blocks `a.b.example.com` but never `notexample.com`,
 *   • matching is case-insensitive and ignores a fully-qualified trailing dot,
 *   • a malformed http(s) URL fails closed,
 *   • non-web schemes (`about:`, `chrome:`, `data:`) are left alone by the domain
 *     rules, and refused outright by `isNonWebScheme` — mirroring
 *     `BlockedSitesService.isNonWebScheme`.
 */
const WHATSAPP_DOMAINS = Object.freeze(['whatsapp.com', 'whatsapp.net', 'wa.me']);
const MANAGED_BROWSER_DEBUG_PORT = '9222';

const BLOCKED_DOMAINS = Object.freeze([
  'agent.meta.ai',
  'muse.ai',
  'hatch.ecto1.ai',
  'hatch.meta.ai',
  // Bare apex, not `www.` — the suffix rule then covers the apex and every
  // subdomain rather than just `www`.
  'internalfb.com',
  ...WHATSAPP_DOMAINS,
]);

const BLOCKED_URL_SUBSTRINGS = Object.freeze([]);

function normalizeBlockedDomain(entry) {
  if (typeof entry !== 'string') return null;
  let value = entry.trim().toLowerCase();
  if (!value) return null;
  if (value.includes('://')) return hostFromUrl(value);
  if (value.startsWith('*.')) value = value.slice(2);
  while (value.startsWith('.')) value = value.slice(1);
  const slash = value.indexOf('/');
  if (slash >= 0) value = value.slice(0, slash);
  while (value.endsWith('.')) value = value.slice(0, -1);
  return value || null;
}

function browserUrlText(urlString) {
  return String(urlString || '')
    .replace(/[\t\n\r]/g, '')
    .replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '')
    .trim();
}

function hostFromUrl(urlString) {
  const trimmed = browserUrlText(urlString);
  if (!trimmed) return null;
  const candidate = /^https?:/i.test(trimmed) || trimmed.includes('://') ? trimmed : `https://${trimmed}`;
  let host;
  try {
    host = new URL(candidate).hostname.toLowerCase();
  } catch {
    return null;
  }
  while (host.endsWith('.')) host = host.slice(0, -1);
  return host || null;
}

function isWebScheme(lowerRaw) {
  return /^https?:/i.test(browserUrlText(lowerRaw));
}

// Chrome strips tabs, newlines and C0 bytes before parsing, so `fi<tab>le:` would
// otherwise reach the network stack as `file:`. `about:blank` is exempt because
// `tabs.create` uses it for a blank tab, and a trailing `:<digits>` is a port,
// not a scheme, so `localhost:3000` stays reachable.
function isNonWebScheme(urlString) {
  const stripped = String(urlString || '').replace(/[\u0000-\u0020\u007F]/g, '');
  if (stripped.toLowerCase() === 'about:blank') return false;
  const separator = stripped.indexOf(':');
  if (separator < 0) return false;
  const scheme = stripped.slice(0, separator).toLowerCase();
  if (!/^[a-z][a-z0-9+-]*$/.test(scheme)) return false;
  // Allowlist, not a digit heuristic: `chromewebdata:80` also looks like host:port,
  // so anything but a dotless hostname we recognise has to fail closed.
  if (scheme === 'localhost') return false;
  return scheme !== 'http' && scheme !== 'https';
}

const _domains = Object.freeze(
  BLOCKED_DOMAINS.map(normalizeBlockedDomain).filter(Boolean)
);
const _substrings = Object.freeze(
  BLOCKED_URL_SUBSTRINGS.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
);

function isBlockedUrl(urlString) {
  if (typeof urlString !== 'string' || !urlString) return false;
  if (isPrivateBrowserControlUrl(urlString)) return true;
  if (isNonWebScheme(urlString)) return true;
  if (!_domains.length && !_substrings.length) return false;

  const lowerRaw = urlString.toLowerCase();
  for (const substring of _substrings) {
    if (lowerRaw.includes(substring)) return true;
  }

  if (!_domains.length) return false;

  const host = hostFromUrl(urlString);
  if (!host) return isWebScheme(lowerRaw);

  return _domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function isPrivateBrowserControlUrl(raw) {
  if (typeof raw !== 'string') return false;
  const value = raw.replace(/[\u0000-\u0020\u007F]/g, '');
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.port === MANAGED_BROWSER_DEBUG_PORT;
  } catch {
    return false;
  }
}

function isSupportedTargetUrl(urlString) {
  if (typeof urlString !== 'string') return false;
  const value = urlString.replace(/[\u0000-\u0020\u007F]/g, '');
  if (value.toLowerCase() === 'about:blank') return true;
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isBlockedTargetUrl(urlString) {
  return !isSupportedTargetUrl(urlString) || isBlockedUrl(urlString);
}

function isBlockedMetadataUrl(urlString) {
  if (typeof urlString !== 'string' || !urlString) return false;
  const lower = urlString.trim().toLowerCase();
  if (lower === 'chrome://newtab' || lower === 'chrome://newtab/') return false;
  return isBlockedTargetUrl(urlString);
}

function isBlockedSite(urlString) {
  if (typeof urlString !== 'string' || !urlString) return false;
  if (isNonWebScheme(urlString)) return false;
  return isBlockedUrl(urlString);
}

// There is deliberately no cookie-domain predicate here any more. It existed only
// for `cookies.get`, which is gone (T285950890) along with the `cookies` manifest
// permission — the extension cannot read the cookie jar at all, so a blocklist
// over it would describe a capability that no longer exists. Re-derive it
// deliberately if a cookie feature is ever reintroduced; the subtlety it encoded
// is that a query for a PARENT domain (`meta.ai`) also returns the cookies scoped
// to a blocked child (`agent.meta.ai`).

/** Message body for a refusal, so both enforcement paths phrase it identically. */
const NON_WEB_MESSAGE = 'The browser tool only opens http and https URLs or about:blank. Local files and other browser pages cannot be accessed.';

function blockedUrlMessage(urlString) {
  if (isPrivateBrowserControlUrl(urlString)) {
    return 'Private browser control endpoints cannot be accessed by browser tools.';
  }
  if (isNonWebScheme(urlString)) {
    return NON_WEB_MESSAGE;
  }
  const host = hostFromUrl(urlString);
  if (host && WHATSAPP_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
    return 'WhatsApp browser access is disabled. Use the WhatsApp desktop connector instead.';
  }
  if (!isSupportedTargetUrl(urlString)) return NON_WEB_MESSAGE;
  return `Blocked by the website blocklist: ${urlString}`;
}

globalThis.hatchBlockedSites = Object.freeze({
  BLOCKED_DOMAINS,
  BLOCKED_URL_SUBSTRINGS,
  blockedUrlMessage,
  hostFromUrl,
  isBlockedSite,
  isBlockedTargetUrl,
  isBlockedMetadataUrl,
  isBlockedUrl,
  isNonWebScheme,
  normalizeBlockedDomain,
});
