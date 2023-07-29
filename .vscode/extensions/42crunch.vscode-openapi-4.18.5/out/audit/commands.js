"use strict";
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
exports.registerSingleOperationAudit = exports.registerFocusSecurityAuditById = exports.registerFocusSecurityAudit = exports.registerSecurityAudit = void 0;
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
const vscode = __importStar(require("vscode"));
const client_1 = require("./client");
const decoration_1 = require("./decoration");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const audit_1 = require("./audit");
const credentials_1 = require("../credentials");
const configuration_1 = require("../configuration");
const service_1 = require("./service");
const extract_1 = require("../util/extract");
function registerSecurityAudit(context, cache, auditContext, pendingAudits, reportWebView, store) {
    return vscode.commands.registerTextEditorCommand("openapi.securityAudit", (textEditor, edit) => __awaiter(this, void 0, void 0, function* () {
        const credentials = yield (0, credentials_1.hasCredentials)(configuration_1.configuration, context.secrets);
        if (credentials === undefined) {
            // try asking for credentials if not found
            const configured = yield (0, credentials_1.configureCredentials)(configuration_1.configuration, context.secrets);
            if (configured === undefined) {
                // or don't do audit if no credentials been supplied
                return;
            }
            else {
                yield delay(3000);
            }
        }
        const uri = textEditor.document.uri.toString();
        if (pendingAudits[uri]) {
            vscode.window.showErrorMessage(`Audit for "${uri}" is already in progress`);
            return;
        }
        delete auditContext.auditsByMainDocument[uri];
        pendingAudits[uri] = true;
        try {
            yield reportWebView.show();
            yield reportWebView.sendColorTheme(vscode.window.activeColorTheme);
            reportWebView.prefetchKdb();
            yield reportWebView.sendStartAudit();
            const audit = yield securityAudit(cache, configuration_1.configuration, context.secrets, store, textEditor);
            if (audit) {
                (0, service_1.setAudit)(auditContext, uri, audit);
                (0, decoration_1.setDecorations)(textEditor, auditContext);
                yield reportWebView.showReport(audit);
            }
            delete pendingAudits[uri];
        }
        catch (e) {
            delete pendingAudits[uri];
            vscode.window.showErrorMessage(`Failed to audit: ${e}`);
        }
    }));
}
exports.registerSecurityAudit = registerSecurityAudit;
function registerFocusSecurityAudit(context, cache, auditContext, reportWebView) {
    return vscode.commands.registerCommand("openapi.focusSecurityAudit", (documentUri) => __awaiter(this, void 0, void 0, function* () {
        try {
            const audit = auditContext.auditsByMainDocument[documentUri];
            if (audit) {
                reportWebView.showReport(audit);
            }
        }
        catch (e) {
            vscode.window.showErrorMessage(`Unexpected error: ${e}`);
        }
    }));
}
exports.registerFocusSecurityAudit = registerFocusSecurityAudit;
function registerFocusSecurityAuditById(context, auditContext, reportWebView) {
    return vscode.commands.registerTextEditorCommand("openapi.focusSecurityAuditById", (textEditor, edit, params) => __awaiter(this, void 0, void 0, function* () {
        try {
            const documentUri = textEditor.document.uri.toString();
            const uri = Buffer.from(params.uri, "base64").toString("utf8");
            const audit = auditContext.auditsByMainDocument[uri];
            if (audit && audit.issues[documentUri]) {
                reportWebView.showIds(audit, documentUri, params.ids);
            }
        }
        catch (e) {
            vscode.window.showErrorMessage(`Unexpected error: ${e}`);
        }
    }));
}
exports.registerFocusSecurityAuditById = registerFocusSecurityAuditById;
function securityAudit(cache, configuration, secrets, store, textEditor) {
    return __awaiter(this, void 0, void 0, function* () {
        const proceed = yield vscode.commands.executeCommand("openapi.platform.dataDictionaryPreAuditBulkUpdateProperties", textEditor.document.uri);
        if (!proceed) {
            return;
        }
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Running API Contract Security Audit...",
            cancellable: false,
        }, (progress, cancellationToken) => __awaiter(this, void 0, void 0, function* () {
            const bundle = yield cache.getDocumentBundle(textEditor.document, { rebundle: true });
            if (!bundle || "errors" in bundle) {
                vscode.commands.executeCommand("workbench.action.problems.focus");
                throw new Error("Failed to bundle for audit, check OpenAPI file for errors.");
            }
            const credentials = yield (0, credentials_1.hasCredentials)(configuration, secrets);
            const oas = (0, preserving_json_yaml_parser_1.stringify)(bundle.value);
            // prefer anond credentials for now
            if (credentials === "anond") {
                return runAnondAudit(textEditor.document, oas, bundle.mapping, cache, configuration, progress);
            }
            else if (credentials === "platform") {
                return runPlatformAudit(textEditor.document, oas, bundle.mapping, cache, store);
            }
        }));
    });
}
function runAnondAudit(document, oas, mapping, cache, configuration, progress) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const apiToken = configuration.get("securityAuditToken");
        try {
            const report = yield (0, client_1.audit)(oas, apiToken.trim(), progress);
            return (0, audit_1.parseAuditReport)(cache, document, report, mapping);
        }
        catch (e) {
            if (((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.statusCode) === 429) {
                vscode.window.showErrorMessage("Too many requests. You can run up to 3 security audits per minute, please try again later.");
            }
            else if (((_b = e === null || e === void 0 ? void 0 : e.response) === null || _b === void 0 ? void 0 : _b.statusCode) === 403) {
                if ((_d = (_c = e === null || e === void 0 ? void 0 : e.response) === null || _c === void 0 ? void 0 : _c.body) === null || _d === void 0 ? void 0 : _d.includes("request validation")) {
                    vscode.window.showErrorMessage("Failed to submit OpenAPI for security audit. Please check if your file is less than 2Mb in size");
                }
                else {
                    vscode.window.showErrorMessage("Authentication failed. Please paste the token that you received in email to Preferences > Settings > Extensions > OpenAPI > Security Audit Token. If you want to receive a new token instead, clear that setting altogether and initiate a new security audit for one of your OpenAPI files.");
                }
            }
            else {
                vscode.window.showErrorMessage("Unexpected error when trying to audit API: " + e);
            }
        }
    });
}
function runPlatformAudit(document, oas, mapping, cache, store) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tmpApi = yield store.createTempApi(oas);
            const report = yield store.getAuditReport(tmpApi.apiId);
            const compliance = yield store.readAuditCompliance(report.tid);
            const todoReport = yield store.readAuditReportSqgTodo(report.tid);
            yield store.clearTempApi(tmpApi);
            const audit = yield (0, audit_1.parseAuditReport)(cache, document, report.data, mapping);
            const { issues: todo } = yield (0, audit_1.parseAuditReport)(cache, document, todoReport.data, mapping);
            audit.compliance = compliance;
            audit.todo = todo;
            return audit;
        }
        catch (ex) {
            if (((_a = ex === null || ex === void 0 ? void 0 : ex.response) === null || _a === void 0 ? void 0 : _a.statusCode) === 409 &&
                ((_c = (_b = ex === null || ex === void 0 ? void 0 : ex.response) === null || _b === void 0 ? void 0 : _b.body) === null || _c === void 0 ? void 0 : _c.code) === 109 &&
                ((_e = (_d = ex === null || ex === void 0 ? void 0 : ex.response) === null || _d === void 0 ? void 0 : _d.body) === null || _e === void 0 ? void 0 : _e.message) === "limit reached") {
                vscode.window.showErrorMessage("You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account.");
            }
            else {
                vscode.window.showErrorMessage(`Unexpected error when trying to audit API using the platform: ${ex} ${((_f = ex === null || ex === void 0 ? void 0 : ex.response) === null || _f === void 0 ? void 0 : _f.body) ? JSON.stringify(ex.response.body) : ""}`);
            }
        }
    });
}
function singleOperationSecurityAudit(path, method, cache, configuration, secrets, store, editor) {
    return __awaiter(this, void 0, void 0, function* () {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Running API Contract Security Audit...",
            cancellable: false,
        }, (progress, cancellationToken) => __awaiter(this, void 0, void 0, function* () {
            const bundle = yield cache.getDocumentBundle(editor.document);
            if (!bundle || "errors" in bundle) {
                vscode.commands.executeCommand("workbench.action.problems.focus");
                throw new Error("Failed to bundle for audit, check OpenAPI file for errors.");
            }
            const credentials = yield (0, credentials_1.hasCredentials)(configuration, secrets);
            const oas = (0, preserving_json_yaml_parser_1.stringify)((0, extract_1.extractSingleOperation)(method, path, bundle.value));
            // prefer anond credentials for now
            if (credentials === "anond") {
                return runAnondAudit(editor.document, oas, bundle.mapping, cache, configuration, progress);
            }
            else if (credentials === "platform") {
                return runPlatformAudit(editor.document, oas, bundle.mapping, cache, store);
            }
        }));
    });
}
function registerSingleOperationAudit(context, cache, auditContext, pendingAudits, view, store) {
    return __awaiter(this, void 0, void 0, function* () {
        vscode.commands.registerTextEditorCommand("openapi.editorSingleOperationAudit", (editor, edit, path, method) => __awaiter(this, void 0, void 0, function* () {
            const credentials = yield (0, credentials_1.hasCredentials)(configuration_1.configuration, context.secrets);
            if (credentials === undefined) {
                // try asking for credentials if not found
                const configured = yield (0, credentials_1.configureCredentials)(configuration_1.configuration, context.secrets);
                if (configured === undefined) {
                    // or don't do audit if no credentials been supplied
                    return;
                }
                else {
                    yield delay(3000);
                }
            }
            const uri = editor.document.uri.toString();
            yield view.show();
            yield view.sendColorTheme(vscode.window.activeColorTheme);
            view.prefetchKdb();
            yield view.sendStartAudit();
            try {
                const audit = yield singleOperationSecurityAudit(path, method, cache, configuration_1.configuration, context.secrets, store, editor);
                if (audit) {
                    (0, service_1.setAudit)(auditContext, uri, audit);
                    (0, decoration_1.setDecorations)(editor, auditContext);
                    yield view.showReport(audit);
                }
            }
            catch (ex) {
                console.log("error", ex);
            }
        }));
    });
}
exports.registerSingleOperationAudit = registerSingleOperationAudit;
function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
//# sourceMappingURL=commands.js.map