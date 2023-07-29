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
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const YAML = require("js-yaml");
const path = require("path");
const fs = require("fs");
const server_1 = require("./server");
const SwaggerSchema = require("../schemas/swagger.json");
const OpenAPISchema = require("../schemas/openapi.json");
class InlinePreview {
    constructor(previewUrl, filename) {
        this.previewUrl = previewUrl;
        this.filename = filename;
        this.disposable = null;
        const showOnlyFileName = !!vscode.workspace.getConfiguration("swaggerViewer").showOnlyFileName;
        const previewPanel = vscode.window.createWebviewPanel("swaggerPreview", `Swagger Preview - ${showOnlyFileName ? path.basename(this.filename) : this.filename}`, vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        previewPanel.webview.html = this.provideTextDocumentContent();
    }
    provideTextDocumentContent() {
        return `
			<html>
				<body style="margin:0px;padding:0px;overflow:hidden">
					<div style="position:fixed;height:100%;width:100%;">
					<iframe src="${this.previewUrl}" frameborder="0" style="overflow:hidden;height:100%;width:100%" height="100%" width="100%"></iframe>
					</div>
				</body>
			</html>
		`;
    }
}
class BrowserPreview {
    constructor(previewUrl, filename) {
        this.previewUrl = previewUrl;
        this.filename = filename;
        vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(this.previewUrl));
    }
}
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
        hash = hash & hash;
    }
    return hash.toString();
}
function getParsedContent(content, languageId) {
    const fileContent = content;
    try {
        if (languageId === "json") {
            return JSON.parse(fileContent);
        }
        else if (languageId === "yaml") {
            return YAML.load(fileContent);
        }
        else if (languageId === "plaintext") {
            if (fileContent.match(/^\s*[{[]/)) {
                return JSON.parse(fileContent);
            }
            else {
                return YAML.load(fileContent);
            }
        }
    }
    catch (ex) {
        return null;
    }
}
let previewServer = new server_1.PreviewServer();
let statusBarItem = null;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const redhatExtension = vscode.extensions.getExtension("redhat.vscode-yaml");
        if (!redhatExtension.isActive) {
            yield redhatExtension.activate();
        }
        try {
            redhatExtension.exports.registerContributor("swaggerviewer", (uri) => {
                for (let document of vscode.workspace.textDocuments) {
                    if (document.uri.toString() === uri) {
                        const parsedYAML = YAML.load(document.getText());
                        if (parsedYAML) {
                            if (parsedYAML.swagger === "2.0") {
                                return "swaggerviewer:swagger";
                            }
                            else if (parsedYAML.openapi &&
                                parsedYAML.openapi.match(/^3\.0\.\d(-.+)?$/)) {
                                return "swaggerviewer:openapi";
                            }
                        }
                    }
                }
                return null;
            }, (uri) => {
                if (uri === "swaggerviewer:swagger") {
                    return JSON.stringify(SwaggerSchema);
                }
                else if (uri === "swaggerviewer:openapi") {
                    return JSON.stringify(OpenAPISchema);
                }
                return null;
            });
        }
        catch (ex) { }
        let disposable = vscode.commands.registerCommand("swagger.preview", (uri) => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Starting Swagger Preview",
            }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
                progress.report({ increment: 0 });
                previewServer.initiateServer();
                let fileContent = "", fileName = "", fileHash = null;
                if (uri) {
                    let filePath = uri.fsPath;
                    let languageId = path.extname(filePath) === "json" ? "json" : "yaml";
                    fileName = filePath;
                    fileContent = getParsedContent(fs.readFileSync(filePath).toString(), languageId);
                }
                else {
                    let editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return;
                    let document = editor.document;
                    fileName = document.fileName;
                    fileContent = getParsedContent(document.getText(), document.languageId);
                }
                fileHash = hashString(fileName.toLowerCase());
                previewServer.update(fileName, fileHash, fileContent);
                const previewInBrowser = !!vscode.workspace.getConfiguration("swaggerViewer").previewInBrowser;
                // Make the port available locally and get the full URI
                const previewUrl = yield vscode.env.asExternalUri(vscode.Uri.parse(previewServer.getUrl(fileHash)));
                if (previewInBrowser) {
                    new BrowserPreview(previewUrl.toString(), fileName);
                }
                else {
                    let inlinePreview = new InlinePreview(previewUrl.toString(), fileName);
                    context.subscriptions.push(inlinePreview.disposable);
                }
                return new Promise((resolve) => {
                    const intervalRef = setInterval(() => {
                        if (previewServer.serverRunning) {
                            clearInterval(intervalRef);
                            resolve(null);
                            if (!statusBarItem) {
                                statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10);
                                statusBarItem.command = "swagger.stop";
                                statusBarItem.text = "Swagger Viewer";
                                statusBarItem.tooltip = "Stop Swagger Preview Server";
                                statusBarItem.show();
                                context.subscriptions.push(statusBarItem);
                            }
                        }
                    }, 100);
                });
            }));
        });
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document === vscode.window.activeTextEditor.document) {
                let fileName = e.document.fileName;
                let fileHash = hashString(fileName.toLowerCase());
                previewServer.update(fileName, fileHash, getParsedContent(e.document.getText(), e.document.languageId));
            }
        });
        context.subscriptions.push(disposable);
        context.subscriptions.push(vscode.commands.registerCommand("swagger.stop", () => {
            previewServer.stop();
            if (statusBarItem) {
                statusBarItem.hide();
                statusBarItem.dispose();
                statusBarItem = null;
            }
        }));
    });
}
exports.activate = activate;
function deactivate() {
    if (previewServer)
        previewServer.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=client.js.map