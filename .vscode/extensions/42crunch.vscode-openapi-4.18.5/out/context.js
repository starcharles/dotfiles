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
exports.updateContext = void 0;
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const vscode = __importStar(require("vscode"));
const types_1 = require("./types");
function updateContext(cache, document) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!document) {
            // don't disable outlines when no editor is selected (which happens if audit or preview
            // webviews are selected) to prevent flicker
            return;
        }
        const version = cache.getDocumentVersion(document);
        if (version !== types_1.OpenApiVersion.Unknown) {
            if (version === types_1.OpenApiVersion.V2) {
                vscode.commands.executeCommand("setContext", "openapiTwoEnabled", true);
                vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
            }
            else if (version === types_1.OpenApiVersion.V3) {
                vscode.commands.executeCommand("setContext", "openapiThreeEnabled", true);
                vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
            }
            const root = cache.getLastGoodParsedDocument(document);
            if (root) {
                checkTree(root);
            }
        }
        else {
            vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
            vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
        }
    });
}
exports.updateContext = updateContext;
function checkTree(tree) {
    setContext("openapiMissingHost", isMissing(tree, "/host"));
    setContext("openapiMissingBasePath", isMissing(tree, "/basePath"));
    setContext("openapiMissingInfo", isMissing(tree, "/info"));
}
function isMissing(tree, pointer) {
    return (0, preserving_json_yaml_parser_1.find)(tree, pointer) === undefined;
}
function setContext(name, value) {
    vscode.commands.executeCommand("setContext", name, value);
}
//# sourceMappingURL=context.js.map