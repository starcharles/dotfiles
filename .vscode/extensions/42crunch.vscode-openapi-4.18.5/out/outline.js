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
exports.registerOutlines = exports.OperationIdOutlineProvider = exports.GeneralThreeOutlineProvider = exports.GeneralTwoOutlineProvider = exports.ResponsesOutlineProvider = exports.ParametersOutlineProvider = exports.ServersOutlineProvider = exports.ComponentsOutlineProvider = exports.SecurityOutlineProvider = exports.SecurityDefinitionOutlineProvider = exports.DefinitionOutlineProvider = exports.PathOutlineProvider = exports.outlines = void 0;
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const vscode = __importStar(require("vscode"));
const configuration_1 = require("./configuration");
const tag_1 = require("./outlines/tag");
const types_1 = require("./types");
function getChildren(node) {
    if (node.value) {
        const keys = Array.isArray(node.value)
            ? Array.from(node.value.keys())
            : Object.keys(node.value);
        return keys.map((key) => ({
            parent: node,
            key,
            depth: node.depth + 1,
            value: node.value[key],
            location: (0, preserving_json_yaml_parser_1.getLocation)(node.value, key),
            path: [...node.path, key],
        }));
    }
    return [];
}
function getChildrenByName(root, names) {
    const result = [];
    if (root) {
        for (const key of names) {
            if (root.value[key]) {
                result.push({
                    parent: root,
                    key,
                    value: root.value[key],
                    depth: root.depth + 1,
                    location: (0, preserving_json_yaml_parser_1.getLocation)(root.value, key),
                    path: [...root.path, key],
                });
            }
        }
    }
    return result;
}
exports.outlines = {};
class OutlineProvider {
    constructor(context, cache) {
        this.context = context;
        this.cache = cache;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.maxDepth = 1;
        cache.onDidActiveDocumentChange((document) => __awaiter(this, void 0, void 0, function* () {
            if (document) {
                const version = this.cache.getDocumentVersion(document);
                if (version !== types_1.OpenApiVersion.Unknown) {
                    this.documentUri = document.uri.toString();
                    const pointer = this.getRootPointer();
                    const root = cache.getLastGoodParsedDocument(document);
                    if (root) {
                        const found = (0, preserving_json_yaml_parser_1.find)(root, pointer);
                        this.root = {
                            parent: undefined,
                            key: undefined,
                            depth: 0,
                            value: found,
                            location: undefined,
                            path: [],
                        };
                    }
                    else {
                        this.root = undefined;
                    }
                }
                this._onDidChangeTreeData.fire();
            }
        }));
        this.sort = configuration_1.configuration.get("sortOutlines");
        configuration_1.configuration.onDidChange(this.onConfigurationChanged, this);
    }
    onConfigurationChanged(e) {
        if (configuration_1.configuration.changed(e, "sortOutlines")) {
            this.sort = configuration_1.configuration.get("sortOutlines");
            this._onDidChangeTreeData.fire();
        }
    }
    getRootPointer() {
        return "";
    }
    getChildren(node) {
        if (!this.root) {
            return Promise.resolve([]);
        }
        if (!node) {
            node = this.root;
        }
        if (node.depth > this.maxDepth) {
            return Promise.resolve([]);
        }
        if (typeof node.value === "object") {
            return Promise.resolve(this.sortChildren(this.filterChildren(node, getChildren(node))));
        }
        else {
            return Promise.resolve([]);
        }
    }
    filterChildren(node, children) {
        return children;
    }
    sortChildren(children) {
        if (this.sort) {
            return children.sort((a, b) => {
                const labelA = this.getLabel(a);
                const labelB = this.getLabel(b);
                return labelA.localeCompare(labelB);
            });
        }
        return children;
    }
    getTreeItem(node) {
        const label = this.getLabel(node);
        const collapsible = this.getCollapsible(node);
        const treeItem = new vscode.TreeItem(label, collapsible);
        treeItem.command = this.getCommand(node);
        treeItem.contextValue = this.getContextValue(node);
        return treeItem;
    }
    getCollapsible(node) {
        const canDisplayChildren = node.depth < this.maxDepth;
        return canDisplayChildren
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;
    }
    getLabel(node) {
        return node ? String(node.key) : "<unknown>";
    }
    getCommand(node) {
        const [editor] = vscode.window.visibleTextEditors.filter((editor) => editor.document.uri.toString() === this.documentUri);
        if (editor && node && node.location) {
            const { start, end } = node.location.key ? node.location.key : node.location.value;
            return {
                command: "openapi.goToLine",
                title: "",
                arguments: [
                    this.documentUri,
                    new vscode.Range(editor.document.positionAt(start), editor.document.positionAt(end)),
                ],
            };
        }
        return undefined;
    }
    getContextValue(node) {
        return undefined;
    }
}
class PathOutlineProvider extends OutlineProvider {
    constructor() {
        super(...arguments);
        this.maxDepth = 5;
    }
    getRootPointer() {
        return "/paths";
    }
    filterChildren(node, children) {
        const depth = node.depth;
        if (depth === 2) {
            return children.filter((child) => {
                return ["responses", "parameters", "requestBody"].includes(String(child.key));
            });
        }
        return children;
    }
    getLabel(node) {
        if ((node.depth === 4 || node.depth === 5) && node.parent && node.parent.key == "parameters") {
            // return label for a parameter
            const label = node.value["$ref"] || node.value["name"];
            if (!label) {
                return "<unknown>";
            }
            return label;
        }
        return String(node.key);
    }
    getContextValue(node) {
        if (node.depth === 1) {
            return "path";
        }
        else if (node.depth === 2) {
            return "operation";
        }
        return undefined;
    }
}
exports.PathOutlineProvider = PathOutlineProvider;
class DefinitionOutlineProvider extends OutlineProvider {
    getRootPointer() {
        return "/definitions";
    }
}
exports.DefinitionOutlineProvider = DefinitionOutlineProvider;
class SecurityDefinitionOutlineProvider extends OutlineProvider {
    getRootPointer() {
        return "/securityDefinitions";
    }
}
exports.SecurityDefinitionOutlineProvider = SecurityDefinitionOutlineProvider;
class SecurityOutlineProvider extends OutlineProvider {
    getRootPointer() {
        return "/security";
    }
    getLabel(node) {
        const keys = Object.keys(node.value);
        if (keys[0]) {
            return keys[0];
        }
        return "<unknown>";
    }
}
exports.SecurityOutlineProvider = SecurityOutlineProvider;
class ComponentsOutlineProvider extends OutlineProvider {
    constructor() {
        super(...arguments);
        this.maxDepth = 3;
    }
    getRootPointer() {
        return "/components";
    }
}
exports.ComponentsOutlineProvider = ComponentsOutlineProvider;
class ServersOutlineProvider extends OutlineProvider {
    getRootPointer() {
        return "/servers";
    }
    getLabel(node) {
        return node.value && node.value.url ? node.value.url : "<unknown>";
    }
}
exports.ServersOutlineProvider = ServersOutlineProvider;
class ParametersOutlineProvider extends OutlineProvider {
    getRootPointer() {
        return "/parameters";
    }
}
exports.ParametersOutlineProvider = ParametersOutlineProvider;
class ResponsesOutlineProvider extends OutlineProvider {
    getRootPointer() {
        return "/responses";
    }
}
exports.ResponsesOutlineProvider = ResponsesOutlineProvider;
class GeneralTwoOutlineProvider extends OutlineProvider {
    getChildren(node) {
        const targets = [
            "swagger",
            "host",
            "basePath",
            "info",
            "schemes",
            "consumes",
            "produces",
            "tags",
            "externalDocs",
        ];
        return Promise.resolve(getChildrenByName(this.root, targets));
    }
}
exports.GeneralTwoOutlineProvider = GeneralTwoOutlineProvider;
class GeneralThreeOutlineProvider extends OutlineProvider {
    getChildren(node) {
        const targets = ["openapi", "info", "tags", "externalDocs"];
        return Promise.resolve(getChildrenByName(this.root, targets));
    }
}
exports.GeneralThreeOutlineProvider = GeneralThreeOutlineProvider;
class OperationIdOutlineProvider extends OutlineProvider {
    getRootPointer() {
        return "/paths";
    }
    getChildren(node) {
        if (!this.root) {
            return Promise.resolve([]);
        }
        const operations = [];
        const paths = getChildren(this.root);
        for (const path of paths) {
            for (const operation of getChildren(path)) {
                const operationId = operation.value["operationId"];
                if (operationId) {
                    operations.push(operation);
                }
            }
        }
        return Promise.resolve(this.sortChildren(operations));
    }
    getLabel(node) {
        return node.value["operationId"];
    }
}
exports.OperationIdOutlineProvider = OperationIdOutlineProvider;
function registerOutlineTreeView(id, provider) {
    exports.outlines[id] = vscode.window.createTreeView(id, {
        treeDataProvider: provider,
    });
    // Length is 0 if deselected
    exports.outlines[id].onDidChangeSelection((event) => {
        vscode.commands.executeCommand("setContext", id + "Selected", event.selection.length > 0);
    });
}
function registerOutlines(context, cache) {
    // OpenAPI v2 outlines
    registerOutlineTreeView("openapiTwoSpecOutline", new GeneralTwoOutlineProvider(context, cache));
    registerOutlineTreeView("openapiTwoPathOutline", new PathOutlineProvider(context, cache));
    registerOutlineTreeView("openapiTwoTagsOutline", new tag_1.TagOutlineProvider(context, cache));
    registerOutlineTreeView("openapiTwoOperationIdOutline", new OperationIdOutlineProvider(context, cache));
    registerOutlineTreeView("openapiTwoDefinitionOutline", new DefinitionOutlineProvider(context, cache));
    registerOutlineTreeView("openapiTwoSecurityOutline", new SecurityOutlineProvider(context, cache));
    registerOutlineTreeView("openapiTwoSecurityDefinitionOutline", new SecurityDefinitionOutlineProvider(context, cache));
    registerOutlineTreeView("openapiTwoParametersOutline", new ParametersOutlineProvider(context, cache));
    registerOutlineTreeView("openapiTwoResponsesOutline", new ResponsesOutlineProvider(context, cache));
    // OpenAPI v3 outlines
    registerOutlineTreeView("openapiThreePathOutline", new PathOutlineProvider(context, cache));
    registerOutlineTreeView("openapiThreeTagsOutline", new tag_1.TagOutlineProvider(context, cache));
    registerOutlineTreeView("openapiThreeOperationIdOutline", new OperationIdOutlineProvider(context, cache));
    registerOutlineTreeView("openapiThreeSpecOutline", new GeneralThreeOutlineProvider(context, cache));
    registerOutlineTreeView("openapiThreeComponentsOutline", new ComponentsOutlineProvider(context, cache));
    registerOutlineTreeView("openapiThreeSecurityOutline", new SecurityOutlineProvider(context, cache));
    registerOutlineTreeView("openapiThreeServersOutline", new ServersOutlineProvider(context, cache));
    return Object.values(exports.outlines);
}
exports.registerOutlines = registerOutlines;
//# sourceMappingURL=outline.js.map