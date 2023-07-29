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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const api_1 = require("../explorer/nodes/api");
const got_1 = __importDefault(require("got"));
const util_1 = require("../util");
const types_1 = require("../types");
exports.default = (store, importedUrls, provider, tree, cache) => ({
    createApi: (collection) => createApi(store, provider, tree, cache, collection),
    createApiFromUrl: (collection) => createApiFromUrl(store, importedUrls, provider, tree, cache, collection),
    editorReloadApiFromUrl: (editor, edit) => reloadApiFromUrl(store, importedUrls, editor, edit),
});
function createApi(store, provider, tree, cache, collection) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const uri = yield vscode.window.showOpenDialog({
            title: "Import API",
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            // TODO use language filter from extension.ts
            filters: {
                OpenAPI: ["json", "yaml", "yml"],
            },
        });
        if (uri) {
            const document = yield vscode.workspace.openTextDocument(uri[0]);
            // TODO handle bundling errors
            const bundle = yield cache.getDocumentBundle(document);
            if (!bundle || "errors" in bundle) {
                throw new Error("Unable to import API, please check the file you're trying to import for errors");
            }
            const convention = yield store.getApiNamingConvention();
            const name = yield vscode.window.showInputBox(Object.assign({ title: "Import API into a collection", value: mangle((_c = (_b = (_a = bundle === null || bundle === void 0 ? void 0 : bundle.value) === null || _a === void 0 ? void 0 : _a.info) === null || _b === void 0 ? void 0 : _b.title) !== null && _c !== void 0 ? _c : "OpenAPI") }, (0, util_1.createApiNamingConventionInputBoxOptions)(convention)));
            if (name) {
                const json = (0, preserving_json_yaml_parser_1.stringify)(bundle.value);
                const api = yield store.createApi(collection.getCollectionId(), name, json);
                const apiNode = new api_1.ApiNode(collection, store, api);
                provider.refresh();
                tree.reveal(apiNode, { focus: true });
            }
        }
    });
}
function createApiFromUrl(store, importedUrls, provider, tree, cache, collection) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const uri = yield vscode.window.showInputBox({
            prompt: "Import API from URL",
        });
        if (uri) {
            const { body, headers } = yield (0, got_1.default)(uri);
            const [parsed, errors] = (0, preserving_json_yaml_parser_1.parse)(body, "json", {});
            if (errors.length > 0) {
                throw new Error("Unable to import API, please check the file you're trying to import for errors");
            }
            const convention = yield store.getApiNamingConvention();
            const name = yield vscode.window.showInputBox(Object.assign({ title: "Import API into a collection", value: mangle((_b = (_a = parsed === null || parsed === void 0 ? void 0 : parsed.info) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : "OpenAPI") }, (0, util_1.createApiNamingConventionInputBoxOptions)(convention)));
            if (name) {
                const api = yield store.createApi(collection.getCollectionId(), name, body);
                importedUrls.setUrl(api.desc.id, uri);
                const apiNode = new api_1.ApiNode(collection, store, api);
                provider.refresh();
                tree.reveal(apiNode, { focus: true });
            }
        }
    });
}
function reloadApiFromUrl(store, importedUrls, editor, edit) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO check for dirty status of the document, and confirm contents to be overwritten
        const apiId = (0, util_1.getApiId)(editor.document.uri);
        const old = importedUrls.getUrl(apiId);
        const uri = yield vscode.window.showInputBox({
            prompt: "Reload API from URL",
            value: old,
        });
        if (uri) {
            const { body, headers } = yield (0, got_1.default)(uri);
            const [parsed, errors] = (0, preserving_json_yaml_parser_1.parse)(body, "json", {});
            if (errors.length > 0) {
                throw new Error("Unable to import API, please check the file you're trying to import for errors");
            }
            const text = (0, preserving_json_yaml_parser_1.stringify)(parsed, 2);
            const range = editor.document.validateRange(new vscode.Range(0, 0, Number.MAX_SAFE_INTEGER, 0));
            editor.edit((edit) => {
                edit.replace(range, text);
            });
        }
    });
}
function mangle(name) {
    return name.replace(/[^A-Za-z0-9_\\-\\.\\ ]/g, "-").substring(0, types_1.MAX_NAME_LEN);
}
//# sourceMappingURL=create-api.js.map