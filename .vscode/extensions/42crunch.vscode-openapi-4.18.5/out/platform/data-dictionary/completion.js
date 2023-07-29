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
exports.DataDictionaryCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const types_1 = require("../../types");
class DataDictionaryCompletionProvider {
    constructor(store) {
        this.store = store;
        this.version = types_1.OpenApiVersion.Unknown;
    }
    provideCompletionItems(document, position, token, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const line = document.lineAt(position).text;
            if (!line.includes("format")) {
                return undefined;
            }
            const hasQuote = line.charAt(position.character) === '"';
            const quote = document.languageId === "yaml" ? "" : hasQuote ? "" : '"';
            const formats = yield this.store.getDataDictionaryFormats();
            const completions = formats.map((format) => {
                const item = new vscode.CompletionItem({
                    label: `${quote}${format.name}${quote}`,
                    description: format.description,
                }, vscode.CompletionItemKind.Value);
                item.range = document.getWordRangeAtPosition(position, /[\w-_:]+/);
                return item;
            });
            return completions;
        });
    }
}
exports.DataDictionaryCompletionProvider = DataDictionaryCompletionProvider;
//# sourceMappingURL=completion.js.map