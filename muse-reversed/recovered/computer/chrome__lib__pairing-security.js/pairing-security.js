// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/lib/pairing-security.js
// kind: full-copy
// name: pairing-security.js
// byteRange: [0, 6198)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

(function initHatchPairingSecurity(root) {
  const HATCH_WEB_PAIR_MESSAGE_TYPE = 'hatch_browser_node_pair';
  const HATCH_WEB_PAIR_READY_MESSAGE_TYPE = 'hatch_browser_node_pair_ready';
  const HATCH_WEB_PAIR_INTERNAL_MESSAGE_TYPE = 'hatch_web_pair';
  const HATCH_WEB_PAIRING_ORIGINS = Object.freeze([
    'https://hatch.meta.ai',
    'https://agent.meta.ai',
  ]);
  const HATCH_WEB_GATEWAY_HOST_SUFFIXES = Object.freeze([
    '.metaaivm.com',
    '.customer.prod.willow606.com',
  ]);
  const HATCH_WEB_GATEWAY_HOSTS = Object.freeze(['node.hatch.one']);

  function normalizeNonEmptyString(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  function originFromUrl(urlString) {
    try {
      return new URL(urlString).origin;
    } catch {
      return null;
    }
  }

  function isAllowedHatchWebOrigin(origin) {
    return HATCH_WEB_PAIRING_ORIGINS.includes(origin);
  }

  function isAllowedHatchWebUrl(urlString) {
    const origin = originFromUrl(urlString);
    return origin ? isAllowedHatchWebOrigin(origin) : false;
  }

  function parseHatchWebPairMessage(data) {
    if (!data || typeof data !== 'object') {
      return { ok: false, reason: 'invalid_message' };
    }
    if (data.type !== HATCH_WEB_PAIR_MESSAGE_TYPE) {
      return { ok: false, reason: 'wrong_type' };
    }
    if (data.version !== 1) {
      return { ok: false, reason: 'wrong_version' };
    }

    const gatewayUrl = normalizeNonEmptyString(data.gatewayUrl);
    if (!gatewayUrl) {
      return { ok: false, reason: 'missing_gateway_url' };
    }

    return { ok: true, gatewayUrl };
  }

  function parseHatchWebPairEvent(event, expectedOrigin) {
    const expectedSource = root.window || root;
    if (!event || event.source !== expectedSource) {
      return { ok: false, reason: 'wrong_source' };
    }
    if (event.isTrusted !== true) {
      return { ok: false, reason: 'untrusted_event' };
    }
    if (event.origin !== expectedOrigin || !isAllowedHatchWebOrigin(event.origin)) {
      return { ok: false, reason: 'wrong_origin' };
    }
    return parseHatchWebPairMessage(event.data);
  }

  function isAllowedHatchWebSender(sender) {
    return !!sender && isAllowedHatchWebUrl(sender.url);
  }

  function isAllowedHatchWebGatewayHost(hostname) {
    if (!hostname) return false;
    const normalized = hostname.toLowerCase();
    if (HATCH_WEB_GATEWAY_HOSTS.includes(normalized)) return true;
    return HATCH_WEB_GATEWAY_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
  }

  function normalizeGatewayPath(pathname) {
    const normalized = pathname.replace(/\/+$/, '');
    const withoutWs = normalized.endsWith('/ws') ? normalized.slice(0, -3) : normalized;
    const trimmed = withoutWs.replace(/\/+$/, '');
    return trimmed === '/' ? '' : trimmed;
  }

  function gatewayIdentityFromUrl(gatewayUrl) {
    const raw = normalizeNonEmptyString(gatewayUrl);
    if (!raw) return null;

    const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) ? raw : `https://${raw}`;
    let url;
    try {
      url = new URL(candidate);
    } catch {
      return null;
    }

    if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) return null;
    if (!isAllowedHatchWebGatewayHost(url.hostname)) return null;

    const hostname = url.hostname.toLowerCase();
    const hostWithPort = url.port ? `${hostname}:${url.port}` : hostname;
    return `${hostWithPort}${normalizeGatewayPath(url.pathname)}`;
  }

  function normalizeWsUrlForCredentialSource(wsUrl, credentialSource) {
    const raw = normalizeNonEmptyString(wsUrl);
    if (!raw) return null;

    let url;
    try {
      url = new URL(raw);
    } catch {
      return null;
    }

    const source = credentialSource || 'manual';
    if (source === 'hatch-web') {
      if (!isAllowedHatchWebGatewayHost(url.hostname)) return null;
      if (url.protocol !== 'wss:') return null;
    } else if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
      return null;
    }

    return url.toString();
  }

  function isAllowedWsUrlForCredentialSource(wsUrl, credentialSource) {
    return normalizeWsUrlForCredentialSource(wsUrl, credentialSource) != null;
  }

  function buildAuthenticatedWsUrl(wsUrl, authToken) {
    const token = normalizeNonEmptyString(authToken);
    if (!token) return null;
    try {
      const url = new URL(wsUrl);
      url.searchParams.set('auth_token', token);
      return url.toString();
    } catch {
      return null;
    }
  }

  function normalizeNullableString(value) {
    if (value == null) return null;
    return typeof value === 'string' ? value : null;
  }

  function parseExtensionPairingResponse(data) {
    if (!data || typeof data !== 'object') {
      return { ok: false, reason: 'invalid_response' };
    }

    const token = normalizeNonEmptyString(data.token);
    const wsUrl = normalizeWsUrlForCredentialSource(data.wsUrl, 'hatch-web');
    const gatewayIdentity = normalizeNonEmptyString(data.gatewayIdentity);
    const expiresAt = typeof data.expiresAt === 'number' ? data.expiresAt : null;
    if (!token || !wsUrl || !gatewayIdentity || expiresAt == null) {
      return { ok: false, reason: 'invalid_pairing_credentials' };
    }

    return {
      ok: true,
      pairing: {
        token,
        wsUrl,
        gatewayIdentity,
        expiresAt,
        hatchName: normalizeNullableString(data.hatchName),
        avatarPath: normalizeNullableString(data.avatarPath),
      },
    };
  }

  root.hatchPairingSecurity = Object.freeze({
    HATCH_WEB_PAIR_MESSAGE_TYPE,
    HATCH_WEB_PAIR_READY_MESSAGE_TYPE,
    HATCH_WEB_PAIR_INTERNAL_MESSAGE_TYPE,
    HATCH_WEB_PAIRING_ORIGINS,
    buildAuthenticatedWsUrl,
    gatewayIdentityFromUrl,
    isAllowedHatchWebOrigin,
    isAllowedHatchWebSender,
    isAllowedHatchWebUrl,
    isAllowedWsUrlForCredentialSource,
    normalizeNonEmptyString,
    normalizeWsUrlForCredentialSource,
    originFromUrl,
    parseExtensionPairingResponse,
    parseHatchWebPairEvent,
    parseHatchWebPairMessage,
  });
})(globalThis);
