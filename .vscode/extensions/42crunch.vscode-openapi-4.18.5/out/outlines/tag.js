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
exports.TagOutlineProvider = void 0;
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const vscode = __importStar(require("vscode"));
const types_1 = require("../types");
const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
class TagOutlineProvider {
    constructor(context, cache) {
        this.context = context;
        this.cache = cache;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.tags = {};
        cache.onDidActiveDocumentChange((document) => __awaiter(this, void 0, void 0, function* () {
            if (document) {
                this.tags = {};
                const version = this.cache.getDocumentVersion(document);
                if (version !== types_1.OpenApiVersion.Unknown) {
                    this.documentUri = document.uri.toString();
                    const root = cache.getLastGoodParsedDocument(document);
                    if (root) {
                        const paths = (0, preserving_json_yaml_parser_1.find)(root, "/paths");
                        if (paths && typeof paths === "object") {
                            for (const [path, pathitem] of Object.entries(paths)) {
                                for (const [method, operation] of Object.entries(pathitem)) {
                                    if (!HTTP_METHODS.includes(method)) {
                                        break;
                                    }
                                    const tags = operation["tags"];
                                    const name = getUniqueName(path, method, operation);
                                    const location = (0, preserving_json_yaml_parser_1.getLocation)(pathitem, method);
                                    const tagOperation = {
                                        type: "operation",
                                        name,
                                        operation,
                                        location,
                                    };
                                    if (Array.isArray(tags)) {
                                        for (const tag of tags) {
                                            if (tag in this.tags) {
                                                this.tags[tag].operations.push(tagOperation);
                                            }
                                            else {
                                                this.tags[tag] = {
                                                    type: "tag",
                                                    name: tag,
                                                    operations: [tagOperation],
                                                };
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                this._onDidChangeTreeData.fire();
            }
        }));
    }
    getTreeItem(node) {
        if (node.type === "tag") {
            return new vscode.TreeItem(node.name, node.operations.length > 0
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None);
        }
        const item = new vscode.TreeItem(uniqueNameToString(node.name), vscode.TreeItemCollapsibleState.None);
        item.tooltip = `${node.name.method.toUpperCase()} ${node.name.path}`;
        item.command = getCommand(this.documentUri, node);
        return item;
    }
    getChildren(node) {
        if (!node) {
            const tags = Object.keys(this.tags);
            tags.sort((a, b) => {
                return a.localeCompare(b);
            });
            return tags.map((tag) => this.tags[tag]);
        }
        if (node.type === "tag") {
            node.operations.sort(sortUniqueNames);
            return node.operations;
        }
        return [];
    }
}
exports.TagOutlineProvider = TagOutlineProvider;
function sortUniqueNames(a, b) {
    // in case if operationId is used just do string compare
    if (a.name.type === "operationId" && b.name.type == "operationId") {
        const aName = uniqueNameToString(a.name);
        const bName = uniqueNameToString(b.name);
        return aName.localeCompare(bName);
    }
    // in case of pathMethod compare using path and then method
    // to group by PATH
    if (a.name.type === "pathMethod" && b.name.type == "pathMethod") {
        const pathCompare = a.name.path.localeCompare(b.name.path);
        const methodCompare = a.name.method.localeCompare(b.name.method);
        if (pathCompare === 0 && methodCompare === 0) {
            return 0;
        }
        if (pathCompare === 0) {
            return methodCompare;
        }
        return pathCompare;
    }
    // operationId names should always come up first
    if (a.name.type === "operationId" && b.name.type == "pathMethod") {
        return -1;
    }
    else {
        return 1;
    }
}
function uniqueNameToString(name) {
    const uniqueName = name.type === "operationId" ? name.operationId : `${name.method.toUpperCase()} ${name.path}`;
    return uniqueName;
}
function getUniqueName(path, method, operation) {
    const operationId = operation["operationId"];
    if (operationId && operationId !== "") {
        return { type: "operationId", operationId, path, method };
    }
    return {
        type: "pathMethod",
        method,
        path,
    };
}
function getCommand(uri, operation) {
    const { start, end } = operation.location.key;
    const [editor] = vscode.window.visibleTextEditors.filter((editor) => editor.document.uri.toString() === uri);
    return {
        command: "openapi.goToLine",
        title: "",
        arguments: [
            uri,
            new vscode.Range(editor.document.positionAt(start), editor.document.positionAt(end)),
        ],
    };
}
//# sourceMappingURL=tag.js.map