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
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAudit = exports.setAudit = void 0;
const vscode = __importStar(require("vscode"));
const audit_1 = require("./audit");
const decoration_1 = require("./decoration");
const diagnostic_1 = require("./diagnostic");
function setAudit(context, uri, audit) {
    (0, audit_1.updateAuditContext)(context, uri, audit);
    (0, decoration_1.updateDecorations)(context.decorations, audit.summary.documentUri, audit.issues);
    (0, diagnostic_1.updateDiagnostics)(context.diagnostics, audit.filename, audit.issues);
}
exports.setAudit = setAudit;
function clearAudit(context, uri) {
    const audit = context.auditsByMainDocument[uri];
    if (audit) {
        delete context.auditsByMainDocument[uri];
        delete context.auditsByDocument[uri];
        for (const subdocumentUri of audit.summary.subdocumentUris) {
            delete context.auditsByDocument[subdocumentUri];
        }
        delete context.decorations[uri];
        context.diagnostics.delete(vscode.Uri.parse(uri));
    }
}
exports.clearAudit = clearAudit;
//# sourceMappingURL=service.js.map