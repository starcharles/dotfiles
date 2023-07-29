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
const path = __importStar(require("path"));
function activate(context, cache, configuration) {
    const previews = {};
    let previewUpdateDelay;
    configuration.track("previewUpdateDelay", (delay) => {
        previewUpdateDelay = delay;
    });
    function debounce(func) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(null, args);
            }, previewUpdateDelay);
        };
    }
    const debouncedPreview = debounce(showPreview);
    cache.onDidChange((document) => __awaiter(this, void 0, void 0, function* () {
        const names = ["swaggerui", "redoc"];
        for (const name of names) {
            const preview = previews[name];
            const uri = document.uri.toString();
            if (preview && preview.documentUri.toString() === uri) {
                const bundle = yield cache.getDocumentBundle(document);
                if (bundle && !("errors" in bundle)) {
                    debouncedPreview(context, previews, name, document.uri, bundle);
                }
            }
        }
    }));
    vscode.commands.registerTextEditorCommand("openapi.previewRedoc", (textEditor, edit) => __awaiter(this, void 0, void 0, function* () { return startPreview(context, cache, previews, "redoc", textEditor.document); }));
    vscode.commands.registerTextEditorCommand("openapi.previewSwaggerUI", (textEditor, edit) => __awaiter(this, void 0, void 0, function* () { return startPreview(context, cache, previews, "swaggerui", textEditor.document); }));
    vscode.commands.registerTextEditorCommand("openapi.preview", (textEditor, edit) => __awaiter(this, void 0, void 0, function* () {
        return startPreview(context, cache, previews, configuration.get("defaultPreviewRenderer"), textEditor.document);
    }));
}
exports.activate = activate;
function startPreview(context, cache, previews, renderer, document) {
    return __awaiter(this, void 0, void 0, function* () {
        const bundle = yield cache.getDocumentBundle(document);
        if (!bundle || "errors" in bundle) {
            vscode.commands.executeCommand("workbench.action.problems.focus");
            vscode.window.showErrorMessage("Failed to generate preview, check OpenAPI file for errors.");
        }
        else {
            showPreview(context, previews, renderer, document.uri, bundle);
        }
    });
}
function showPreview(context, previews, name, documentUri, bundle) {
    return __awaiter(this, void 0, void 0, function* () {
        const preview = previews[name];
        if (preview) {
            const panel = preview.panel;
            panel.webview.postMessage({ command: "preview", text: JSON.stringify(bundle.value) });
            previews[name] = { panel, documentUri };
            return;
        }
        const title = name === "redoc" ? "OpenAPI ReDoc preview" : "OpenAPI SwaggerUI preview";
        const panel = yield buildWebviewPanel(context, name, title);
        panel.onDidDispose(() => {
            previews[name] = undefined;
        }, undefined, context.subscriptions);
        panel.webview.postMessage({ command: "preview", text: JSON.stringify(bundle.value) });
        previews[name] = { panel, documentUri };
    });
}
function buildWebviewPanel(context, name, title) {
    const panel = vscode.window.createWebviewPanel(`openapiPreview-${name}`, title, vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true,
    });
    return new Promise((resolve, reject) => {
        panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case "init":
                    resolve(panel);
            }
        }, undefined, context.subscriptions);
        const index = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, "webview", "generated", "preview", name, "main.js")));
        panel.webview.html = getWebviewContent(panel.webview, index);
    });
}
// Directive connect-src must be set to allow XHR
function getWebviewContent(webview, index) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src ${webview.cspSource}; style-src 'unsafe-inline'; connect-src http: https:;">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <style>
	    body {
		  background-color: #FEFEFE;
	    }
	  </style>
  </head>
  <body>
	<div id="root"></div>
	<script src="${index}"></script>
  </body>
  </html>`;
}
//# sourceMappingURL=preview.js.map