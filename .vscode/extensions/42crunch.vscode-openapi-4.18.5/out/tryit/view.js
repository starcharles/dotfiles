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
exports.TryItWebView = void 0;
const vscode = __importStar(require("vscode"));
const web_view_1 = require("../web-view");
const http_handler_1 = require("./http-handler");
const create_schema_handler_1 = require("./create-schema-handler");
const extract_1 = require("../util/extract");
const config_1 = require("../util/config");
class TryItWebView extends web_view_1.WebView {
    constructor(extensionPath, cache, envStore, prefs, configuration, secrets) {
        super(extensionPath, "tryit", "Try It", vscode.ViewColumn.Two);
        this.cache = cache;
        this.envStore = envStore;
        this.prefs = prefs;
        this.configuration = configuration;
        this.secrets = secrets;
        this.hostHandlers = {
            sendHttpRequest: http_handler_1.executeHttpRequest,
            createSchema: (response) => __awaiter(this, void 0, void 0, function* () {
                if (this.target) {
                    (0, create_schema_handler_1.executeCreateSchemaRequest)(this.target.document, this.cache, response);
                }
            }),
            savePrefs: (prefs) => __awaiter(this, void 0, void 0, function* () {
                if (this.target) {
                    const uri = this.target.document.uri.toString();
                    this.prefs[uri] = Object.assign(Object.assign({}, this.prefs[uri]), prefs);
                }
            }),
            showEnvWindow: () => __awaiter(this, void 0, void 0, function* () {
                vscode.commands.executeCommand("openapi.showEnvironment");
            }),
            saveConfig: (config) => __awaiter(this, void 0, void 0, function* () {
                yield (0, config_1.saveConfig)(config, this.configuration, this.secrets);
            }),
        };
        envStore.onEnvironmentDidChange((env) => {
            if (this.isActive()) {
                this.sendRequest({
                    command: "loadEnv",
                    payload: { default: undefined, secrets: undefined, [env.name]: env.environment },
                });
            }
        });
        vscode.window.onDidChangeActiveColorTheme((e) => {
            if (this.isActive()) {
                this.sendColorTheme(e);
            }
        });
    }
    getTarget() {
        return this.target;
    }
    onDispose() {
        this.target = undefined;
        super.onDispose();
    }
    showTryIt(bundle, target) {
        return __awaiter(this, void 0, void 0, function* () {
            this.target = target;
            yield this.show();
            yield this.sendColorTheme(vscode.window.activeColorTheme);
            yield this.sendRequest({ command: "loadEnv", payload: yield this.envStore.all() });
            const prefs = this.prefs[this.target.document.uri.toString()];
            if (prefs) {
                yield this.sendRequest({ command: "loadPrefs", payload: prefs });
            }
            yield this.sendLoadConfig();
            const oas = (0, extract_1.extractSingleOperation)(target.method, target.path, bundle.value);
            return this.sendRequest({
                command: "tryOperation",
                payload: Object.assign({ oas }, target),
            });
        });
    }
    updateTryIt(bundle, versions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.target) {
                return;
            }
            this.target = Object.assign(Object.assign({}, this.target), { versions });
            const oas = (0, extract_1.extractSingleOperation)(this.target.method, this.target.path, bundle.value);
            return this.sendRequest({
                command: "tryOperation",
                payload: Object.assign({ oas }, this.target),
            });
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
exports.TryItWebView = TryItWebView;
//# sourceMappingURL=view.js.map