"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const checkpoint_client_1 = require("checkpoint-client");
const vscode_1 = require("vscode");
const hashes_1 = require("./hashes");
class TelemetryReporter {
    constructor(extensionId, extensionVersion) {
        this.extensionId = extensionId;
        this.extensionVersion = extensionVersion;
        this.userOptIn = false;
        this.updateUserOptIn();
        this.configListener = vscode_1.workspace.onDidChangeConfiguration(() => this.updateUserOptIn());
    }
    sendTelemetryEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.userOptIn) {
                yield (0, checkpoint_client_1.check)({
                    product: this.extensionId,
                    version: this.extensionVersion,
                    project_hash: yield (0, hashes_1.getProjectHash)(),
                });
            }
        });
    }
    updateUserOptIn() {
        const telemetrySettings = vscode_1.workspace.getConfiguration(TelemetryReporter.TELEMETRY_SECTION_ID);
        const isTelemetryEnabled = telemetrySettings.get(TelemetryReporter.TELEMETRY_OLD_SETTING_ID);
        // Only available since https://code.visualstudio.com/updates/v1_61#_telemetry-settings
        const telemetryLevel = telemetrySettings.get(TelemetryReporter.TELEMETRY_SETTING_ID);
        // `enableTelemetry` is either true or false (default = true). Deprecated since https://code.visualstudio.com/updates/v1_61#_telemetry-settings
        // It is replaced by `telemetryLevel`, only available since v1.61 (default = 'all')
        // https://code.visualstudio.com/docs/getstarted/telemetry
        // To enable Telemetry:
        // We check that
        // `enableTelemetry` is true and `telemetryLevel` falsy -> enabled
        // `enableTelemetry` is true and `telemetryLevel` set to 'all' -> enabled
        // anything else falls back to disabled.
        const isTelemetryEnabledWithOldSetting = isTelemetryEnabled && !telemetryLevel;
        const isTelemetryEnabledWithNewSetting = isTelemetryEnabled && telemetryLevel && telemetryLevel === 'all';
        if (isTelemetryEnabledWithOldSetting || isTelemetryEnabledWithNewSetting) {
            this.userOptIn = true;
            console.info('Telemetry is enabled for Prisma extension');
        }
        else {
            this.userOptIn = false;
            console.info('Telemetry is disabled for Prisma extension');
        }
    }
    dispose() {
        this.configListener.dispose();
    }
}
TelemetryReporter.TELEMETRY_SECTION_ID = 'telemetry';
TelemetryReporter.TELEMETRY_SETTING_ID = 'telemetryLevel';
// Deprecated since https://code.visualstudio.com/updates/v1_61#_telemetry-settings
TelemetryReporter.TELEMETRY_OLD_SETTING_ID = 'enableTelemetry';
exports.default = TelemetryReporter;
//# sourceMappingURL=telemetryReporter.js.map