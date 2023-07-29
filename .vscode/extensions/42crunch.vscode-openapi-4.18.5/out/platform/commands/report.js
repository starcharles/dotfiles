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
const vscode = __importStar(require("vscode"));
const audit_1 = require("../audit");
const util_1 = require("../util");
const audit_2 = require("../../audit/audit");
const decoration_1 = require("../../audit/decoration");
const service_1 = require("../../audit/service");
exports.default = (store, context, auditContext, cache, reportWebView) => ({
    openAuditReport: (apiId) => __awaiter(void 0, void 0, void 0, function* () {
        yield vscode.window.withProgress({
            title: `Loading Audit Report for API ${apiId}`,
            cancellable: false,
            location: vscode.ProgressLocation.Notification,
        }, () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const uri = (0, util_1.makePlatformUri)(apiId);
                const document = yield vscode.workspace.openTextDocument(uri);
                const audit = yield (0, audit_1.refreshAuditReport)(store, cache, auditContext, document);
                if (audit) {
                    yield reportWebView.showReport(audit);
                }
            }
            catch (e) {
                vscode.window.showErrorMessage(`Unexpected error: ${e}`);
            }
        }));
    }),
    editorLoadAuditReportFromFile: (editor, edit) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const selection = yield vscode.window.showOpenDialog({
            title: "Load Security Audit report",
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            // TODO use language filter from extension.ts
            filters: {
                OpenAPI: ["json", "yaml", "yml"],
            },
        });
        if (selection) {
            const text = yield vscode.workspace.fs.readFile(selection[0]);
            const report = JSON.parse(Buffer.from(text).toString("utf-8"));
            if ((report === null || report === void 0 ? void 0 : report.aid) && (report === null || report === void 0 ? void 0 : report.tid) && ((_a = report.data) === null || _a === void 0 ? void 0 : _a.assessmentVersion)) {
                const uri = editor.document.uri.toString();
                const audit = yield (0, audit_2.parseAuditReport)(cache, editor.document, report.data, {
                    value: { uri, hash: "" },
                    children: {},
                });
                (0, service_1.setAudit)(auditContext, uri, audit);
                (0, decoration_1.setDecorations)(editor, auditContext);
                yield reportWebView.showReport(audit);
            }
            else {
                vscode.window.showErrorMessage("Can't find 42Crunch Security Audit report in the selected file");
            }
        }
    }),
});
//# sourceMappingURL=report.js.map