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
exports.executeCreateSchemaRequest = void 0;
const vscode = __importStar(require("vscode"));
const yaml = __importStar(require("js-yaml"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const insert_1 = require("../edits/insert");
const schema_1 = require("../audit/schema");
const parsers_1 = require("../parsers");
const types_1 = require("../types");
function executeCreateSchemaRequest(document, cache, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsed = cache.getParsedDocument(document);
        const version = (0, parsers_1.getOpenApiVersion)(parsed);
        if (version === types_1.OpenApiVersion.Unknown) {
            return;
        }
        const path = version === types_1.OpenApiVersion.V3 ? ["components", "schemas"] : ["definitions"];
        let emptyInsertionLocation = Object.keys(parsed).length === 0;
        let traversed = 0;
        let current = parsed;
        for (const name of path) {
            if (current[name] !== undefined) {
                current = current[name];
                emptyInsertionLocation = Object.keys(current).length === 0;
                traversed++;
            }
        }
        const schemaNames = new Set(traversed == path.length ? Object.keys(current) : []);
        // focus the document
        yield vscode.workspace.openTextDocument(document.uri);
        const schemaName = yield vscode.window.showInputBox({
            value: getUniqueSchemaName(schemaNames),
            prompt: "Enter new schema name.",
            validateInput: (value) => (!schemaNames.has(value) ? null : "Please enter unique schema name"),
        });
        if (!schemaName) {
            return;
        }
        let schema = { [schemaName]: (0, schema_1.generateSchema)(payload) };
        const schemaInsertLocation = path.slice(0, traversed);
        const wrap = path.slice(traversed, path.length).reverse();
        for (const name of wrap) {
            schema = { [name]: schema };
        }
        let text = "";
        if (document.languageId === "yaml") {
            text = yaml.dump(schema, { indent: 1 }).trimEnd();
        }
        else {
            text = JSON.stringify(schema, null, 1);
            text = text.substring(2, text.length - 2);
            text = text.replace(new RegExp("^\\s", "mg"), "");
        }
        const edit = (0, insert_1.insert)(document, parsed, schemaInsertLocation, text, emptyInsertionLocation);
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(document.uri, [edit]);
        yield vscode.workspace.applyEdit(workspaceEdit);
        const parsed2 = cache.getParsedDocument(document);
        if (!parsed2) {
            return;
        }
        const location2 = (0, preserving_json_yaml_parser_1.findLocationForPath)(parsed2, [...path, schemaName]);
        const start = document.positionAt(location2.key.start);
        const end = document.positionAt(location2.value.end);
        const editor = yield focusEditor(document);
        editor.selection = new vscode.Selection(start, end);
        editor.revealRange(editor.selection, vscode.TextEditorRevealType.AtTop);
    });
}
exports.executeCreateSchemaRequest = executeCreateSchemaRequest;
function focusEditor(document) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.toString() === document.uri.toString()) {
                return editor;
            }
        }
        return vscode.window.showTextDocument(document);
    });
}
function getUniqueSchemaName(schemaNames) {
    const result = "GeneratedSchemaName";
    for (let index = 1; index < 1000; index++) {
        const newName = result + index;
        if (!schemaNames.has(newName)) {
            return newName;
        }
    }
    return "";
}
//# sourceMappingURL=create-schema-handler.js.map