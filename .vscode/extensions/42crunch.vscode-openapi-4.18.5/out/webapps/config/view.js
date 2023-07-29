"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.ConfigWebView = void 0;
const vscode = __importStar(require("vscode"));
const http2 = __importStar(require("http2"));
const web_view_1 = require("../../web-view");
const scandManagerApi = __importStar(require("../../platform/api-scand-manager"));
const config_1 = require("../../util/config");
class ConfigWebView extends web_view_1.WebView {
    constructor(extensionPath, configuration, secrets, platform, logger) {
        super(extensionPath, "config", "Settings", vscode.ViewColumn.One);
        this.configuration = configuration;
        this.secrets = secrets;
        this.platform = platform;
        this.logger = logger;
        this.hostHandlers = {
            saveConfig: (config) => __awaiter(this, void 0, void 0, function* () {
                this.config = config;
                yield (0, config_1.saveConfig)(config, this.configuration, this.secrets);
            }),
            testOverlordConnection: () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                const services = ((_a = this.config) === null || _a === void 0 ? void 0 : _a.platformServices.source) === "auto"
                    ? (_b = this.config) === null || _b === void 0 ? void 0 : _b.platformServices.auto
                    : (_c = this.config) === null || _c === void 0 ? void 0 : _c.platformServices.manual;
                if (services === undefined || services === "") {
                    return {
                        command: "showOverlordConnectionTest",
                        payload: { success: false, message: "Services host is not configured" },
                    };
                }
                const result = yield http2Ping(`https://${services}`);
                return {
                    command: "showOverlordConnectionTest",
                    payload: result,
                };
            }),
            testPlatformConnection: () => __awaiter(this, void 0, void 0, function* () {
                if (this.config === undefined) {
                    return {
                        command: "showPlatformConnectionTest",
                        payload: { success: false, message: "no credentials" },
                    };
                }
                const credentials = {
                    platformUrl: this.config.platformUrl,
                    apiToken: this.config.platformApiToken,
                    services: "",
                };
                const result = yield this.platform.testConnection(credentials);
                return { command: "showPlatformConnectionTest", payload: result };
            }),
            testScandManagerConnection: () => __awaiter(this, void 0, void 0, function* () {
                var _d;
                const scandManager = (_d = this.config) === null || _d === void 0 ? void 0 : _d.scandManager;
                if (scandManager === undefined || scandManager.url === "") {
                    return {
                        command: "showScandManagerConnectionTest",
                        payload: { success: false, message: "no scand manager confguration" },
                    };
                }
                const result = yield scandManagerApi.testConnection(scandManager, this.logger);
                return {
                    command: "showScandManagerConnectionTest",
                    payload: result,
                };
            }),
        };
        vscode.window.onDidChangeActiveColorTheme((e) => {
            if (this.isActive()) {
                this.sendColorTheme(e);
            }
        });
    }
    sendLoadConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield (0, config_1.loadConfig)(this.configuration, this.secrets);
            this.sendRequest({
                command: "loadConfig",
                payload: config,
            });
        });
    }
}
exports.ConfigWebView = ConfigWebView;
function http2Ping(url) {
    const timeout = 5000;
    return new Promise((resolve, reject) => {
        try {
            const client = http2.connect(url);
            client.setTimeout(timeout);
            client.on("error", (err) => {
                client.close();
                resolve({
                    success: false,
                    message: err.message,
                });
            });
            client.on("timeout", (err) => {
                client.close();
                resolve({
                    success: false,
                    message: `Timed out wating to connect after ${timeout}ms`,
                });
            });
            client.on("connect", () => {
                client.close();
                resolve({
                    success: true,
                });
            });
        }
        catch (ex) {
            resolve({
                success: false,
                message: `Failed to create connection: ${ex}`,
            });
        }
    });
}
//# sourceMappingURL=view.js.map