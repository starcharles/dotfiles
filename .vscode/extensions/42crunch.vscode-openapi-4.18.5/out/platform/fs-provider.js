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
exports.PlatformFS = void 0;
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const vscode = __importStar(require("vscode"));
const util_1 = require("./util");
class ApiFile {
    constructor() {
        this.type = vscode.FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
    }
}
class PlatformFS {
    constructor(store) {
        this.store = store;
        this._emitter = new vscode.EventEmitter();
        this.onDidChangeFile = this._emitter.event;
    }
    watch(uri, options) {
        return new vscode.Disposable(() => null);
    }
    stat(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            return new ApiFile();
        });
    }
    readFile(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiId = (0, util_1.getApiId)(uri);
            const api = yield this.store.getApi(apiId);
            // parse and format json
            const buffer = Buffer.from(api.desc.specfile, "base64");
            const [parsed, errors] = (0, preserving_json_yaml_parser_1.parse)(buffer.toString("utf-8"), "json", {});
            if (errors.length > 0) {
                // failed to parse JSON, show it as is without formatting
                return buffer;
            }
            const text = (0, preserving_json_yaml_parser_1.stringify)(parsed, 2);
            return Buffer.from(text, "utf-8");
        });
    }
    writeFile(uri, content, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const proceed = yield vscode.commands.executeCommand("openapi.platform.dataDictionaryPreAuditBulkUpdateProperties", uri);
            if (proceed === false) {
                return;
            }
            if (!(yield (0, util_1.confirmed)("Are you sure you want to update remote API?"))) {
                throw new Error("API Update has been cancelled.");
            }
            const apiId = (0, util_1.getApiId)(uri);
            yield vscode.window.withProgress({
                title: `Updating API ${apiId}`,
                cancellable: false,
                location: vscode.ProgressLocation.Notification,
            }, () => __awaiter(this, void 0, void 0, function* () {
                const found = vscode.workspace.textDocuments.filter((document) => document.uri.toString() === uri.toString());
                if (found.length !== 1) {
                    throw new Error("Can't find TextDocument to save.");
                }
                const [parsed, errors] = (0, preserving_json_yaml_parser_1.parse)(found[0].getText(), "json", {});
                if (errors.length > 0) {
                    throw new Error("Document contains JSON parsing erorrs, please fix it before saving");
                }
                const text = (0, preserving_json_yaml_parser_1.stringify)(parsed);
                yield this.store.updateApi(apiId, Buffer.from(text));
            }));
        });
    }
    delete(uri, options) {
        throw new Error("Method not implemented.");
    }
    rename(oldUri, newUri, options) {
        throw new Error("Method not implemented.");
    }
    readDirectory(uri) {
        throw new Error("Method not implemented.");
    }
    createDirectory(uri) {
        throw new Error("Method not implemented.");
    }
}
exports.PlatformFS = PlatformFS;
//# sourceMappingURL=fs-provider.js.map