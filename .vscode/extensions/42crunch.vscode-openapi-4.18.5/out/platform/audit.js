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
exports.refreshAuditReport = void 0;
const vscode = __importStar(require("vscode"));
const audit_1 = require("../audit/audit");
const decoration_1 = require("../audit/decoration");
const util_1 = require("./util");
const service_1 = require("../audit/service");
function refreshAuditReport(store, cache, auditContext, document) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, util_1.isPlatformUri)(document.uri)) {
            const uri = document.uri.toString();
            const apiId = (0, util_1.getApiId)(document.uri);
            const report = yield store.getAuditReport(apiId);
            const compliance = yield store.readAuditCompliance(report.tid);
            const todoReport = yield store.readAuditReportSqgTodo(report.tid);
            const mapping = {
                value: { uri, hash: "" },
                children: {},
            };
            const audit = yield (0, audit_1.parseAuditReport)(cache, document, report.data, mapping);
            const { issues: todo } = yield (0, audit_1.parseAuditReport)(cache, document, todoReport.data, mapping);
            audit.compliance = compliance;
            audit.todo = todo;
            if (audit) {
                // TODO better handling of failing autids
                // since we don't prevent incorrect JSON from being submitted
                // audits might fail
                // also need to trigger setDecorations() on document update
                if (Object.keys(audit.issues).length === 0) {
                    auditContext.diagnostics.set(document.uri, undefined);
                    auditContext.decorations[uri] = [];
                }
                else {
                    (0, service_1.setAudit)(auditContext, uri, audit);
                }
                if (((_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document) === document) {
                    (0, decoration_1.setDecorations)(vscode.window.activeTextEditor, auditContext);
                }
                return audit;
            }
        }
    });
}
exports.refreshAuditReport = refreshAuditReport;
//# sourceMappingURL=audit.js.map