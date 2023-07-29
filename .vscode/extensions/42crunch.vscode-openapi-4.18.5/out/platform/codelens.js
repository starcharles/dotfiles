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
exports.CodelensProvider = void 0;
const vscode = __importStar(require("vscode"));
const util_1 = require("./util");
class CodelensProvider {
    constructor(store) {
        this.store = store;
    }
    provideCodeLenses(document, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiId = (0, util_1.getApiId)(document.uri);
            const api = yield this.store.getApi(apiId);
            const collection = yield this.store.getCollection(api.desc.cid);
            const collectionLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 100), {
                title: `${collection.desc.name}`,
                tooltip: "Collection name",
                command: "openapi.platform.focusCollection",
                arguments: [collection.desc.id],
            });
            const apiLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 100), {
                title: `${api.desc.name}`,
                tooltip: "API name",
                command: "openapi.platform.focusApi",
                arguments: [collection.desc.id, api.desc.id],
            });
            const uuidLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 100), {
                title: `${api.desc.id}`,
                tooltip: "API UUID",
                command: "openapi.platform.copyToClipboard",
                arguments: [api.desc.id, `Copied UUID ${api.desc.id} to clipboard`],
            });
            return [collectionLens, apiLens, uuidLens];
        });
    }
}
exports.CodelensProvider = CodelensProvider;
//# sourceMappingURL=codelens.js.map