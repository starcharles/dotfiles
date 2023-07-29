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
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const commands_1 = require("./commands");
const quickfix_1 = require("./quickfix");
const decoration_1 = require("./decoration");
const lens_1 = require("./lens");
function activate(context, auditContext, cache, configuration, reportWebView, store) {
    let disposables = [];
    const pendingAudits = {};
    function update(editor) {
        if (editor) {
            (0, decoration_1.setDecorations)(editor, auditContext);
            const uri = editor.document.uri.toString();
            if (auditContext.auditsByMainDocument[uri]) {
                reportWebView.showIfVisible(auditContext.auditsByMainDocument[uri]);
            }
            else {
                let subdocument = false;
                for (const audit of Object.values(auditContext.auditsByMainDocument)) {
                    if (audit.summary.subdocumentUris.includes(uri)) {
                        subdocument = true;
                    }
                }
                // display no report only if the current document is not a
                // part of any multi-document run
                if (!subdocument) {
                    reportWebView.showNoReport();
                }
            }
        }
    }
    const selectors = {
        json: { language: "json" },
        jsonc: { language: "jsonc" },
        yaml: { language: "yaml" },
    };
    const auditCodelensProvider = new lens_1.AuditCodelensProvider(cache);
    function activateLens(enabled) {
        disposables.forEach((disposable) => disposable.dispose());
        if (enabled) {
            disposables = Object.values(selectors).map((selector) => vscode.languages.registerCodeLensProvider(selector, auditCodelensProvider));
        }
        else {
            disposables = [];
        }
    }
    configuration.onDidChange((e) => __awaiter(this, void 0, void 0, function* () {
        if (configuration.changed(e, "codeLens")) {
            activateLens(configuration.get("codeLens"));
        }
    }));
    activateLens(configuration.get("codeLens"));
    vscode.window.onDidChangeActiveTextEditor((editor) => update(editor));
    (0, commands_1.registerSecurityAudit)(context, cache, auditContext, pendingAudits, reportWebView, store);
    (0, commands_1.registerSingleOperationAudit)(context, cache, auditContext, pendingAudits, reportWebView, store);
    (0, commands_1.registerFocusSecurityAudit)(context, cache, auditContext, reportWebView);
    (0, commands_1.registerFocusSecurityAuditById)(context, auditContext, reportWebView);
    (0, quickfix_1.registerQuickfixes)(context, cache, auditContext, reportWebView);
    return new vscode.Disposable(() => disposables.forEach((disposable) => disposable.dispose()));
}
exports.activate = activate;
//# sourceMappingURL=activate.js.map