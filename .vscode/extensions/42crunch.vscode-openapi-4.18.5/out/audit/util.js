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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocationByPointer = void 0;
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
function getLocationByPointer(document, root, pointer) {
    // FIXME markerNode can only be returned for the main document
    // perhaps we need to pass Audit here and make this function
    // to return documentUri of current/main document
    // depending on pointer == ""?
    let location;
    if (pointer == "") {
        // if pointer == "" return location for well known node
        // which is depending on OAS version is either "/swagger" or "/openapi
        if (root["openapi"]) {
            location = (0, preserving_json_yaml_parser_1.findLocationForJsonPointer)(root, "/openapi");
        }
        else {
            location = (0, preserving_json_yaml_parser_1.findLocationForJsonPointer)(root, "/swagger");
        }
    }
    else {
        location = findLocationForJsonPointerResolvingRefs(root, pointer)[0];
    }
    if (location) {
        const start = location.key ? location.key.start : location.value.start;
        const position = document.positionAt(start);
        const line = document.lineAt(position.line);
        const range = new vscode.Range(new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex), new vscode.Position(position.line, line.range.end.character));
        return [position.line, range];
    }
    else {
        throw new Error(`Unable to locate node: ${pointer}`);
    }
}
exports.getLocationByPointer = getLocationByPointer;
function findLocationForJsonPointerResolvingRefs(root, jsonPointer) {
    const path = (0, preserving_json_yaml_parser_1.parseJsonPointer)(jsonPointer);
    if (path.length === 0) {
        // special case "" pointing to the root
        const range = (0, preserving_json_yaml_parser_1.getRootRange)(root);
        return [{ value: range }, root];
    }
    let current = root;
    let i = 0;
    while (i < path.length - 1 && current) {
        if (current[path[i]] !== undefined) {
            current = current[path[i]];
            i++;
        }
        else if (current.hasOwnProperty("$ref")) {
            current = findLocationForJsonPointerResolvingRefs(root, current["$ref"])[1];
        }
    }
    if (current != undefined && current[path[i]] === undefined && current.hasOwnProperty("$ref")) {
        current = findLocationForJsonPointerResolvingRefs(root, current["$ref"])[1];
    }
    if (current !== undefined) {
        return [(0, preserving_json_yaml_parser_1.getLocation)(current, path[i]), current[path[i]]];
    }
    return [undefined, undefined];
}
//# sourceMappingURL=util.js.map