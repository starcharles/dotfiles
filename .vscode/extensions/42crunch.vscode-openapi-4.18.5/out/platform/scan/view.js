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
exports.ScanWebView = void 0;
const vscode = __importStar(require("vscode"));
const env_1 = require("@xliic/common/env");
const web_view_1 = require("../../web-view");
const http_handler_1 = require("../../tryit/http-handler");
const util_1 = require("../../audit/util");
const managerApi = __importStar(require("../api-scand-manager"));
const config_1 = require("../../util/config");
const audit_1 = require("../../audit/audit");
const service_1 = require("../../audit/service");
class ScanWebView extends web_view_1.WebView {
    constructor(extensionPath, cache, configuration, secrets, store, envStore, prefs, auditView, auditContext) {
        super(extensionPath, "scan", "Scan", vscode.ViewColumn.Two);
        this.cache = cache;
        this.configuration = configuration;
        this.secrets = secrets;
        this.store = store;
        this.envStore = envStore;
        this.prefs = prefs;
        this.auditView = auditView;
        this.auditContext = auditContext;
        this.isNewApi = false;
        this.hostHandlers = {
            runScan: (scanConfig) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e;
                try {
                    const config = yield (0, config_1.loadConfig)(this.configuration, this.secrets);
                    return yield runScan(this.store, this.envStore, scanConfig, config, makeLogger(this), this.isNewApi);
                }
                catch (ex) {
                    const message = ((_a = ex === null || ex === void 0 ? void 0 : ex.response) === null || _a === void 0 ? void 0 : _a.statusCode) === 409 &&
                        ((_c = (_b = ex === null || ex === void 0 ? void 0 : ex.response) === null || _b === void 0 ? void 0 : _b.body) === null || _c === void 0 ? void 0 : _c.code) === 109 &&
                        ((_e = (_d = ex === null || ex === void 0 ? void 0 : ex.response) === null || _d === void 0 ? void 0 : _d.body) === null || _e === void 0 ? void 0 : _e.message) === "limit reached"
                        ? "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
                        : "Failed to run scan: " + ex.message;
                    return {
                        command: "showGeneralError",
                        payload: {
                            message,
                        },
                    };
                }
            }),
            sendHttpRequest: (request) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield (0, http_handler_1.executeHttpRequestRaw)(request);
                    return {
                        command: "showHttpResponse",
                        payload: response,
                    };
                }
                catch (e) {
                    return {
                        command: "showHttpError",
                        payload: e,
                    };
                }
            }),
            sendCurlRequest: (curl) => __awaiter(this, void 0, void 0, function* () {
                return copyCurl(curl);
            }),
            savePrefs: (prefs) => __awaiter(this, void 0, void 0, function* () {
                if (this.document) {
                    const uri = this.document.uri.toString();
                    this.prefs[uri] = Object.assign(Object.assign({}, this.prefs[uri]), prefs);
                }
            }),
            showEnvWindow: () => __awaiter(this, void 0, void 0, function* () {
                vscode.commands.executeCommand("openapi.showEnvironment");
            }),
            showJsonPointer: (payload) => __awaiter(this, void 0, void 0, function* () {
                if (this.document) {
                    let editor = undefined;
                    // check if document is already open
                    for (const visibleEditor of vscode.window.visibleTextEditors) {
                        if (visibleEditor.document.uri.toString() === this.document.uri.toString()) {
                            editor = visibleEditor;
                        }
                    }
                    if (!editor) {
                        editor = yield vscode.window.showTextDocument(this.document, vscode.ViewColumn.One);
                    }
                    const root = this.cache.getParsedDocument(editor.document);
                    const lineNo = (0, util_1.getLocationByPointer)(editor.document, root, payload)[0];
                    const textLine = editor.document.lineAt(lineNo);
                    editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
                    editor.revealRange(textLine.range, vscode.TextEditorRevealType.AtTop);
                }
            }),
            showAuditReport: () => __awaiter(this, void 0, void 0, function* () {
                const uri = this.document.uri.toString();
                const audit = yield (0, audit_1.parseAuditReport)(this.cache, this.document, this.auditReport.report, this.auditReport.mapping);
                (0, service_1.setAudit)(this.auditContext, uri, audit);
                yield this.auditView.showReport(audit);
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
    onDispose() {
        this.document = undefined;
        super.onDispose();
    }
    sendStartScan(document) {
        return __awaiter(this, void 0, void 0, function* () {
            this.document = document;
            this.auditReport = undefined;
            return this.sendRequest({ command: "startScan", payload: undefined });
        });
    }
    sendScanOperation(document, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            this.document = document;
            this.auditReport = undefined;
            (0, service_1.clearAudit)(this.auditContext, this.document.uri.toString());
            this.sendRequest({ command: "loadEnv", payload: yield this.envStore.all() });
            this.sendLoadConfig();
            const prefs = this.prefs[this.document.uri.toString()];
            if (prefs) {
                this.sendRequest({ command: "loadPrefs", payload: prefs });
            }
            return this.sendRequest({ command: "scanOperation", payload });
        });
    }
    sendAuditError(document, report, mapping) {
        return __awaiter(this, void 0, void 0, function* () {
            this.document = document;
            this.auditReport = {
                report,
                mapping,
            };
            return this.sendRequest({
                command: "showGeneralError",
                payload: {
                    message: "OpenAPI has failed Security Audit. Please run API Security Audit, fix the issues and try running the Scan again.",
                    code: "audit-error",
                },
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
    sendLogMessage(message, level) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sendRequest({
                command: "showLogMessage",
                payload: { message, level, timestamp: new Date().toISOString() },
            });
        });
    }
    setNewApi(isNewApi) {
        this.isNewApi = isNewApi;
    }
}
exports.ScanWebView = ScanWebView;
function makeLogger(view) {
    return {
        debug: (message) => view.sendLogMessage(message, "debug"),
        info: (message) => view.sendLogMessage(message, "info"),
        warning: (message) => view.sendLogMessage(message, "warning"),
        error: (message) => view.sendLogMessage(message, "error"),
        fatal: (message) => view.sendLogMessage(message, "fatal"),
    };
}
function runScan(store, envStore, scanConfig, config, logger, isNewApi) {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info(`Starting API Conformance Scan`);
        const tmpApi = yield store.createTempApi(scanConfig.rawOas);
        logger.info(`Created temp API "${tmpApi.apiId}", waiting for Security Audit`);
        const audit = yield store.getAuditReport(tmpApi.apiId);
        if ((audit === null || audit === void 0 ? void 0 : audit.data.openapiState) !== "valid") {
            yield store.clearTempApi(tmpApi);
            return {
                command: "showGeneralError",
                payload: {
                    message: "OpenAPI has failed Security Audit. Please run API Security Audit, fix the issues and try running the Scan again.",
                },
            };
        }
        logger.info(`Security Audit check is successful`);
        if (isNewApi) {
            yield store.createScanConfigNew(tmpApi.apiId, "updated", scanConfig.config);
        }
        else {
            yield store.createScanConfig(tmpApi.apiId, "updated", scanConfig.config);
        }
        const configs = yield store.getScanConfigs(tmpApi.apiId);
        const c = isNewApi
            ? yield store.readScanConfig(configs[0].configuration.id)
            : yield store.readScanConfig(configs[0].scanConfigurationId);
        const token = isNewApi ? c.token : c.scanConfigurationToken;
        const failure = config.scanRuntime === "docker"
            ? yield runScanWithDocker(envStore, scanConfig, config, token)
            : yield runScanWithScandManager(envStore, scanConfig, config, logger, token);
        if (failure !== undefined) {
            // cleanup
            try {
                yield store.clearTempApi(tmpApi);
            }
            catch (ex) {
                console.log(`Failed to cleanup temp api ${tmpApi.apiId}: ${ex}`);
            }
            return {
                command: "showGeneralError",
                payload: failure,
            };
        }
        const reportId = yield waitForReport(store, tmpApi.apiId, 10000, isNewApi);
        if (reportId === undefined) {
            return {
                command: "showGeneralError",
                payload: { message: "Failed to load scan report from the platform" },
            };
        }
        const report = isNewApi
            ? yield store.readScanReportNew(reportId)
            : yield store.readScanReport(reportId);
        const parsed = JSON.parse(Buffer.from(report, "base64").toString("utf-8"));
        yield store.clearTempApi(tmpApi);
        logger.info(`Finished API Conformance Scan`);
        return {
            command: "showScanReport",
            // FIXME path and method are ignored by the UI, fix message to make 'em optionals
            payload: {
                path: "/",
                method: "get",
                report: parsed,
                security: undefined,
            },
        };
    });
}
function runScanWithDocker(envStore, scanConfig, config, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const terminal = findOrCreateTerminal();
        const env = {};
        for (const [name, value] of Object.entries(scanConfig.env)) {
            env[name] = (0, env_1.replaceEnv)(value, yield envStore.all());
        }
        const services = config.platformServices.source === "auto"
            ? config.platformServices.auto
            : config.platformServices.manual;
        env["SCAN_TOKEN"] = token;
        env["PLATFORM_SERVICE"] = services;
        const envString = Object.entries(env)
            .map(([key, value]) => `-e ${key}='${value}'`)
            .join(" ");
        const hostNetwork = config.docker.useHostNetwork && (config.platform == "linux" || config.platform == "freebsd")
            ? "--network host"
            : "";
        terminal.sendText(`docker run ${hostNetwork} --rm ${envString} ${config.scanImage}`);
        terminal.show();
    });
}
function runScanWithScandManager(envStore, scanConfig, config, logger, token) {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info(`Using scand-manager`);
        const env = {};
        for (const [name, value] of Object.entries(scanConfig.env)) {
            env[name] = (0, env_1.replaceEnv)(value, yield envStore.all());
        }
        let job = undefined;
        const services = config.platformServices.source === "auto"
            ? config.platformServices.auto
            : config.platformServices.manual;
        try {
            job = yield managerApi.createJob(token, services, config.scanImage, env, config.scandManager, logger);
        }
        catch (ex) {
            return {
                message: `Failed to create scand-manager job: ${ex}`,
            };
        }
        logger.info(`Created scand-manager job: "${job.name}"`);
        if (job.status === "failed") {
            // TODO introduce settings whether delete failed jobs or not
            return {
                message: `Failed to create scand-manager job "${job.name}", received unexpected status: ${job.status}`,
            };
        }
        const error = yield waitForScandJob(job.name, config.scandManager, logger, 30000);
        if (error) {
            return error;
        }
        // job has completed, remove it
        yield managerApi.deleteJobStatus(job.name, config.scandManager, logger);
        return undefined;
    });
}
function waitForReport(store, apiId, maxDelay, isNewApi) {
    return __awaiter(this, void 0, void 0, function* () {
        let currentDelay = 0;
        while (currentDelay < maxDelay) {
            const reports = yield store.listScanReports(apiId);
            if (reports.length > 0) {
                return isNewApi ? reports[0].report.taskId : reports[0].taskId;
            }
            console.log("Waiting for report to become available");
            yield delay(1000);
            currentDelay = currentDelay + 1000;
        }
        console.log("Failed to read report");
        return undefined;
    });
}
function waitForScandJob(name, manager, logger, maxDelay) {
    return __awaiter(this, void 0, void 0, function* () {
        let currentDelay = 0;
        while (currentDelay < maxDelay) {
            const status = yield managerApi.readJobStatus(name, manager, logger);
            // Status unknown may mean the job is not finished, keep waiting
            if (status.status === "succeeded") {
                return undefined;
            }
            else if (status.status === "failed") {
                const log = yield managerApi.readJobLog(name, manager, logger);
                return { message: `Scand-manager job "${name}" has failed`, details: log };
            }
            logger.info(`Waiting for job: "${name}", status: "${status.status}"`);
            yield delay(1000);
            currentDelay = currentDelay + 1000;
        }
        return { message: `Timed out waiting for scand-manager job "${name}" to finish` };
    });
}
function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
function findOrCreateTerminal() {
    const name = "scan";
    for (const terminal of vscode.window.terminals) {
        if (terminal.name === name && terminal.exitStatus === undefined) {
            return terminal;
        }
    }
    return vscode.window.createTerminal({ name });
}
function runCurl(curl) {
    return __awaiter(this, void 0, void 0, function* () {
        const terminal = findOrCreateTerminal();
        terminal.sendText(curl);
        terminal.show();
    });
}
function copyCurl(curl) {
    return __awaiter(this, void 0, void 0, function* () {
        vscode.env.clipboard.writeText(curl);
        const disposable = vscode.window.setStatusBarMessage(`Curl command copied to the clipboard`);
        setTimeout(() => disposable.dispose(), 1000);
    });
}
//# sourceMappingURL=view.js.map