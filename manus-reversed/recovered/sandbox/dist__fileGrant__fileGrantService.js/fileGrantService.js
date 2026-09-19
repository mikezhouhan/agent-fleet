// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/fileGrant/fileGrantService.js
// kind: full-copy
// name: fileGrantService.js
// byteRange: [0, 4782)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileGrantService = void 0;
const node_crypto_1 = require("node:crypto");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const loggerHelper_1 = require("../utils/loggerHelper");
const fileMime_1 = require("../utils/fileMime");
const GRANT_TTL_MS = 60_000;
const MAX_FILES = 20;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
const MAX_GRANTS = 32;
class FileGrantService {
    grants = new Map();
    issue(paths, webContents) {
        this.pruneExpired();
        if (this.grants.size >= MAX_GRANTS) {
            const oldestKey = this.grants.keys().next().value;
            if (oldestKey) {
                this.grants.delete(oldestKey);
            }
        }
        const token = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const webContentsId = webContents.id;
        this.grants.set(token, {
            paths: paths.slice(0, MAX_FILES),
            webContents,
            webContentsId,
            expiresAt: Date.now() + GRANT_TTL_MS,
        });
        webContents.once('destroyed', () => {
            this.revokeForWebContents(webContentsId);
        });
        return token;
    }
    async consume(token, sender) {
        const paths = this.claim(token, sender);
        if (!paths) {
            throw new Error('Invalid, expired, or unauthorized file grant');
        }
        return readGrantedFiles(paths);
    }
    claim(token, sender) {
        if (typeof token !== 'string' || token.length === 0) {
            return null;
        }
        const grant = this.grants.get(token);
        if (!grant) {
            return null;
        }
        this.grants.delete(token);
        if (Date.now() > grant.expiresAt) {
            return null;
        }
        if (grant.webContents !== sender || grant.webContentsId !== sender.id) {
            loggerHelper_1.loggerHelper.warning('[fileGrant] rejected grant from wrong window', {
                expected: grant.webContentsId,
                actual: sender.id,
            });
            return null;
        }
        return grant.paths;
    }
    revokeForWebContents(webContentsId) {
        for (const [token, grant] of this.grants) {
            if (grant.webContentsId === webContentsId) {
                this.grants.delete(token);
            }
        }
    }
    pruneExpired() {
        const now = Date.now();
        for (const [token, grant] of this.grants) {
            if (now > grant.expiresAt) {
                this.grants.delete(token);
            }
        }
    }
    _resetForTest() {
        this.grants.clear();
    }
}
async function readGrantedFiles(paths) {
    const result = [];
    let totalBytes = 0;
    for (const filePath of paths) {
        if (typeof filePath !== 'string' || filePath.length === 0) {
            continue;
        }
        const data = await readOneFile(filePath);
        if (!data) {
            continue;
        }
        if (totalBytes + data.size > MAX_TOTAL_SIZE) {
            loggerHelper_1.loggerHelper.warning('[fileGrant] total size limit reached, dropping remaining files');
            break;
        }
        totalBytes += data.size;
        result.push(data);
    }
    return result;
}
async function readOneFile(filePath) {
    let handle;
    try {
        handle = await promises_1.default.open(filePath, 'r');
        const stats = await handle.stat();
        if (!stats.isFile()) {
            return null;
        }
        if (stats.size > MAX_FILE_SIZE) {
            loggerHelper_1.loggerHelper.warning('[fileGrant] file exceeds size limit, skipping', {
                name: node_path_1.default.basename(filePath),
                size: stats.size,
            });
            return null;
        }
        const buffer = Buffer.alloc(stats.size);
        await handle.read(buffer, 0, stats.size, 0);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        const name = node_path_1.default.basename(filePath);
        const type = (0, fileMime_1.getMimeType)(filePath);
        return { buffer: arrayBuffer, name, size: buffer.byteLength, type };
    }
    catch (error) {
        loggerHelper_1.loggerHelper.warning('[fileGrant] failed to read granted file', {
            name: node_path_1.default.basename(filePath),
            error,
        });
        return null;
    }
    finally {
        await handle?.close().catch(() => { });
    }
}
exports.fileGrantService = new FileGrantService();
