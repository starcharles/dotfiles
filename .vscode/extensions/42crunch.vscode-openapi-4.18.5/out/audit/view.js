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
exports.AuditWebView = void 0;
const vscode = __importStar(require("vscode"));
const web_view_1 = require("../web-view");
const util_1 = require("./util");
const client_1 = require("./client");
class AuditWebView extends web_view_1.WebView {
    constructor(extensionPath, cache) {
        super(extensionPath, "audit", "Security Audit Report", vscode.ViewColumn.Two);
        this.cache = cache;
        this.hostHandlers = {
            copyIssueId: (issueId) => __awaiter(this, void 0, void 0, function* () {
                vscode.env.clipboard.writeText(issueId);
                const disposable = vscode.window.setStatusBarMessage(`Copied ID: ${issueId}`);
                setTimeout(() => disposable.dispose(), 1000);
            }),
            goToLine: ({ uri, line, pointer }) => __awaiter(this, void 0, void 0, function* () {
                this.focusLine(uri, pointer, line);
            }),
            openLink: (url) => __awaiter(this, void 0, void 0, function* () {
                vscode.env.openExternal(vscode.Uri.parse(url));
            }),
        };
        vscode.window.onDidChangeActiveColorTheme((e) => {
            if (this.isActive()) {
                this.sendColorTheme(e);
            }
        });
    }
    prefetchKdb() {
        this.kdb = (0, client_1.getArticles)();
    }
    getKdb() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.kdb !== undefined) {
                return this.kdb;
            }
            this.prefetchKdb();
            return this.kdb;
        });
    }
    sendStartAudit() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendRequest({ command: "startAudit", payload: undefined });
        });
    }
    showReport(report) {
        return __awaiter(this, void 0, void 0, function* () {
            const kdb = yield this.getKdb();
            yield this.show();
            yield this.sendRequest({ command: "loadKdb", payload: kdb });
            yield this.sendColorTheme(vscode.window.activeColorTheme);
            return this.sendRequest({ command: "showFullReport", payload: report });
        });
    }
    showIds(report, uri, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const kdb = yield this.getKdb();
            yield this.show();
            yield this.sendRequest({ command: "loadKdb", payload: kdb });
            yield this.sendColorTheme(vscode.window.activeColorTheme);
            this.sendRequest({
                command: "showPartialReport",
                payload: { report: report, uri, ids },
            });
        });
    }
    showIfVisible(report) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isActive()) {
                this.sendRequest({ command: "loadKdb", payload: yield this.getKdb() });
                return this.sendRequest({ command: "showFullReport", payload: report });
            }
        });
    }
    showNoReport() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isActive()) {
                return this.sendRequest({ command: "showNoReport", payload: undefined });
            }
        });
    }
    focusLine(uri, pointer, line) {
        return __awaiter(this, void 0, void 0, function* () {
            let editor = undefined;
            // check if document is already open
            for (const visibleEditor of vscode.window.visibleTextEditors) {
                if (visibleEditor.document.uri.toString() == uri) {
                    editor = visibleEditor;
                }
            }
            if (!editor) {
                // if not already open, load and show it
                const document = yield vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
                editor = yield vscode.window.showTextDocument(document, vscode.ViewColumn.One);
            }
            let lineNo;
            const root = this.cache.getParsedDocument(editor.document);
            if (root) {
                // use pointer by default
                lineNo = (0, util_1.getLocationByPointer)(editor.document, root, pointer)[0];
            }
            else {
                // fallback to line no
                lineNo = line;
            }
            const textLine = editor.document.lineAt(lineNo);
            editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
            editor.revealRange(textLine.range, vscode.TextEditorRevealType.AtTop);
        });
    }
}
exports.AuditWebView = AuditWebView;
//# sourceMappingURL=view.js.map