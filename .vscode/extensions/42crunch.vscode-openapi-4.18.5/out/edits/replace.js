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
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceObject = exports.replaceLiteral = void 0;
const vscode = __importStar(require("vscode"));
const indent_1 = require("./indent");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
function replaceLiteral(document, root, path, replacement) {
    var _a;
    const location = (_a = (0, preserving_json_yaml_parser_1.findLocationForPath)(root, path)) === null || _a === void 0 ? void 0 : _a.value;
    if (location === undefined) {
        throw new Error(`Unable to perform replace, node at JSON Pointer ${path} is not found`);
    }
    const range = new vscode.Range(document.positionAt(location.start), document.positionAt(location.end));
    return vscode.TextEdit.replace(range, replacement);
}
exports.replaceLiteral = replaceLiteral;
function replaceObject(document, root, path, replacement) {
    var _a;
    const location = (_a = (0, preserving_json_yaml_parser_1.findLocationForPath)(root, path)) === null || _a === void 0 ? void 0 : _a.value;
    if (location === undefined) {
        throw new Error(`Unable to replace, node at JSON Pointer ${path} is not found`);
    }
    const range = new vscode.Range(document.positionAt(location.start), document.positionAt(location.end));
    // reindent replacement to the target indentation level
    // remove spaces at the first line, as the insertion starts
    // at the start of the value, which is already properly indented
    const reindented = (0, indent_1.indent)(document, range.start, replacement).replace(/^\s+/g, "");
    return vscode.TextEdit.replace(range, reindented);
}
exports.replaceObject = replaceObject;
//# sourceMappingURL=replace.js.map