// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/ipc/handlers/skillRecording.js
// kind: full-copy
// name: skillRecording.js
// byteRange: [0, 1869)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.skillRecordingHandlers = void 0;
const skillRecordingClient_1 = require("../../computerUse/skillRecordingClient");
const electron_log_1 = __importDefault(require("electron-log"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const fileMime_1 = require("../../utils/fileMime");
exports.skillRecordingHandlers = {
    watch: async () => skillRecordingClient_1.skillRecordingClient.startWatching(),
    status: async () => (await skillRecordingClient_1.skillRecordingClient.call('recording/status')),
    readArtifact: async () => {
        const status = (await skillRecordingClient_1.skillRecordingClient.call('recording/status'));
        if (status.state !== 'completed' || !status.artifactPath) {
            throw new Error('Skill recording artifact is unavailable');
        }
        const stats = node_fs_1.default.statSync(status.artifactPath);
        if (!stats.isFile()) {
            throw new Error('Skill recording artifact is not a file');
        }
        const buffer = node_fs_1.default.readFileSync(status.artifactPath);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        const name = node_path_1.default.basename(status.artifactPath);
        const type = (0, fileMime_1.getMimeType)(status.artifactPath);
        electron_log_1.default.info(`[skillRecording] artifact read: ${name} (${stats.size} bytes)`);
        return { buffer: arrayBuffer, name, size: stats.size, type };
    },
    cleanup: async () => (await skillRecordingClient_1.skillRecordingClient.call('recording/cleanup')),
};
