// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/ipc/registry.js
// kind: full-copy
// name: registry.js
// byteRange: [0, 6425)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allScopedEvents = exports.allEvents = exports.allHandlers = void 0;
exports.emitScopedEvent = emitScopedEvent;
exports.getExposedMeta = getExposedMeta;
exports.registerIpc = registerIpc;
const electron_1 = require("electron");
const loggerHelper_1 = require("../utils/loggerHelper");
const trustedUrls_1 = require("../utils/trustedUrls");
const constants_1 = require("./constants");
const auth_1 = require("./events/auth");
const menu_1 = require("./events/menu");
const myComputer_1 = require("./events/myComputer");
const navigation_1 = require("./events/navigation");
const skillRecording_1 = require("./events/skillRecording");
const system_1 = require("./events/system");
const theme_1 = require("./events/theme");
const updater_1 = require("./events/updater");
const window_1 = require("./events/window");
const auth_2 = require("./handlers/auth");
const computerUse_1 = require("./handlers/computerUse");
const desktopOperator_1 = require("./handlers/desktopOperator");
const env_1 = require("./handlers/env");
const localMcp_1 = require("./handlers/localMcp");
const presenter_1 = require("./handlers/presenter");
const skillRecording_2 = require("./handlers/skillRecording");
const system_2 = require("./handlers/system");
const theme_2 = require("./handlers/theme");
const updater_2 = require("./handlers/updater");
const window_2 = require("./handlers/window");
exports.allHandlers = {
    updater: updater_2.updaterHandlers,
    window: window_2.windowHandlers,
    system: system_2.systemHandlers,
    auth: auth_2.authHandlers,
    theme: theme_2.themeHandlers,
    presenter: presenter_1.presenterHandlers,
    env: env_1.envHandlers,
    localMcp: localMcp_1.localMcpHandlers,
    desktopOperator: desktopOperator_1.desktopOperatorHandlers,
    skillRecording: skillRecording_2.skillRecordingHandlers,
    computerUse: computerUse_1.computerUseHandlers,
};
exports.allEvents = {
    updater: updater_1.updaterEvents,
    auth: auth_1.authEvents,
    myComputer: myComputer_1.myComputerEvents,
    skillRecording: skillRecording_1.skillRecordingEvents,
};
exports.allScopedEvents = {
    window: window_1.windowScopedEvents,
    auth: auth_1.authScopedEvents,
    navigation: navigation_1.navigationScopedEvents,
    theme: theme_1.themeScopedEvents,
    menu: menu_1.menuScopedEvents,
    system: system_1.systemScopedEvents,
};
function emitScopedEvent(target, namespace, event, ...args) {
    if (target.isDestroyed())
        return;
    if (!(0, trustedUrls_1.isTrustedAppUrl)(target.getURL()))
        return;
    target.send(constants_1.IPC_EVENT_CHANNEL, `${namespace}:${event}`, ...args);
}
function getExposedMeta() {
    const eventNames = new Map();
    for (const registry of [exports.allEvents, exports.allScopedEvents]) {
        for (const [namespace, events] of Object.entries(registry)) {
            eventNames.set(namespace, [
                ...(eventNames.get(namespace) ?? []),
                ...Object.keys(events),
            ]);
        }
    }
    return {
        handlers: Object.entries(exports.allHandlers).map(([namespace, handlers]) => [
            namespace,
            Object.keys(handlers),
        ]),
        events: [...eventNames.entries()],
    };
}
function registerIpc() {
    electron_1.ipcMain.handle(constants_1.IPC_API_CHANNEL, async (event, method, ...args) => {
        if (typeof method !== 'string') {
            loggerHelper_1.loggerHelper.error('[ipc] invalid method', method);
            return;
        }
        const senderUrl = event.senderFrame?.url ?? '';
        if (!(0, trustedUrls_1.isTrustedAppUrl)(senderUrl)) {
            loggerHelper_1.loggerHelper.error('[ipc] blocked call from untrusted sender:', {
                senderUrl,
                method,
            });
            return;
        }
        const [namespace, key] = method.split(':');
        if (!namespace || !key) {
            loggerHelper_1.loggerHelper.error('[ipc] invalid method', method);
            return;
        }
        const handlers = Object.prototype.hasOwnProperty.call(exports.allHandlers, namespace)
            ? exports.allHandlers[namespace]
            : undefined;
        const handler = handlers && Object.prototype.hasOwnProperty.call(handlers, key)
            ? handlers[key]
            : undefined;
        if (typeof handler !== 'function') {
            loggerHelper_1.loggerHelper.error('[ipc] handler not found:', method);
            return;
        }
        try {
            return await handler(event, ...args);
        }
        catch (error) {
            loggerHelper_1.loggerHelper.error(`[ipc] error calling ${method}:`, error);
            throw error;
        }
    });
    electron_1.ipcMain.on(constants_1.IPC_META_CHANNEL, (event) => {
        const senderUrl = event.senderFrame?.url ?? '';
        event.returnValue = (0, trustedUrls_1.isTrustedAppUrl)(senderUrl) ? getExposedMeta() : null;
    });
    const sendWhenLoaded = (webContents, channel, ...args) => {
        const deliver = () => {
            if (webContents.isDestroyed())
                return;
            if (!(0, trustedUrls_1.isTrustedAppUrl)(webContents.getURL()))
                return;
            webContents.send(constants_1.IPC_EVENT_CHANNEL, channel, ...args);
        };
        if (webContents.isDestroyed())
            return;
        if (webContents.isLoading()) {
            const onFinish = () => {
                webContents.removeListener('did-fail-load', onFail);
                deliver();
            };
            const onFail = () => {
                webContents.removeListener('did-finish-load', onFinish);
            };
            webContents.once('did-finish-load', onFinish);
            webContents.once('did-fail-load', onFail);
            return;
        }
        deliver();
    };
    for (const [namespace, events] of Object.entries(exports.allEvents)) {
        for (const [name, register] of Object.entries(events)) {
            register((...args) => {
                const channel = `${namespace}:${name}`;
                for (const win of electron_1.BrowserWindow.getAllWindows()) {
                    if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
                        sendWhenLoaded(win.webContents, channel, ...args);
                    }
                }
            });
        }
    }
}
