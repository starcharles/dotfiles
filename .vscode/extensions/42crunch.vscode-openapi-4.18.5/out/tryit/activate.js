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
const view_1 = require("./view");
const lens_1 = require("./lens");
const debounce_1 = require("../util/debounce");
const selectors = {
    json: { language: "json" },
    jsonc: { language: "jsonc" },
    yaml: { language: "yaml" },
};
function activate(context, cache, configuration, envStore, prefs) {
    let disposables = [];
    const view = new view_1.TryItWebView(context.extensionPath, cache, envStore, prefs, configuration, context.secrets);
    const debounceDelay = { delay: 1000 };
    configuration.track("previewUpdateDelay", (previewDelay) => {
        debounceDelay.delay = previewDelay;
    });
    const debouncedUpdateTryIt = (0, debounce_1.debounce)(updateTryIt, debounceDelay);
    cache.onDidChange((document) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if ((view === null || view === void 0 ? void 0 : view.isActive()) && ((_a = view.getTarget()) === null || _a === void 0 ? void 0 : _a.document.uri.toString()) === document.uri.toString()) {
            const bundle = yield cache.getDocumentBundle(document);
            if (bundle && !("errors" in bundle)) {
                const versions = getBundleVersions(bundle);
                if (isBundleVersionsDifferent(versions, view.getTarget().versions)) {
                    yield debouncedUpdateTryIt(view, bundle, versions);
                }
            }
        }
    }));
    const tryItCodeLensProvider = new lens_1.TryItCodelensProvider(cache);
    function activateLens(enabled) {
        disposables.forEach((disposable) => disposable.dispose());
        if (enabled) {
            disposables = Object.values(selectors).map((selector) => vscode.languages.registerCodeLensProvider(selector, tryItCodeLensProvider));
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
    vscode.commands.registerCommand("openapi.tryOperation", (document, path, method) => __awaiter(this, void 0, void 0, function* () {
        yield startTryIt(document, cache, view, path, method);
    }));
    vscode.commands.registerCommand("openapi.tryOperationWithExample", (document, path, method, preferredMediaType, preferredBodyValue) => __awaiter(this, void 0, void 0, function* () {
        yield startTryIt(document, cache, view, path, method, preferredMediaType, preferredBodyValue);
    }));
    return new vscode.Disposable(() => disposables.forEach((disposable) => disposable.dispose()));
}
exports.activate = activate;
function startTryIt(document, cache, view, path, method, preferredMediaType, preferredBodyValue) {
    return __awaiter(this, void 0, void 0, function* () {
        const bundle = yield cache.getDocumentBundle(document);
        if (!bundle || "errors" in bundle) {
            vscode.commands.executeCommand("workbench.action.problems.focus");
            vscode.window.showErrorMessage("Failed to try it, check OpenAPI file for errors.");
            return view;
        }
        return view.showTryIt(bundle, {
            document,
            versions: getBundleVersions(bundle),
            path,
            method,
            preferredMediaType,
            preferredBodyValue,
        });
    });
}
function updateTryIt(view, bundle, versions) {
    return __awaiter(this, void 0, void 0, function* () {
        return view.updateTryIt(bundle, versions);
    });
}
function isBundleVersionsDifferent(versions, otherVersions) {
    for (const [uri, version] of Object.entries(versions)) {
        if (otherVersions[uri] !== version) {
            return true;
        }
    }
    if (Object.keys(otherVersions).length !== Object.keys(versions).length) {
        return true;
    }
    return false;
}
function getBundleVersions(bundle) {
    const versions = {
        [bundle.document.uri.toString()]: bundle.document.version,
    };
    bundle.documents.forEach((document) => {
        versions[document.uri.toString()] = document.version;
    });
    return versions;
}
//# sourceMappingURL=activate.js.map