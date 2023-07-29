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
exports.getOpenApiVersion = exports.parseDocument = void 0;
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const types_1 = require("./types");
function parseDocument(document, parserOptions) {
    if (!(document.languageId === "json" ||
        document.languageId === "jsonc" ||
        document.languageId == "yaml")) {
        return [types_1.OpenApiVersion.Unknown, null, []];
    }
    const [node, errors] = (0, preserving_json_yaml_parser_1.parse)(document.getText(), document.languageId, parserOptions);
    const version = getOpenApiVersion(node);
    const messages = errors.map((error) => {
        const start = document.positionAt(error.offset);
        const end = error.length ? document.positionAt(error.offset + error.length) : undefined;
        const range = end ? new vscode.Range(start, end) : document.lineAt(start).range;
        return {
            source: "vscode-openapi",
            code: "",
            severity: vscode.DiagnosticSeverity.Error,
            message: error.message,
            range,
        };
    });
    return [version, node, messages.length > 0 ? messages : []];
}
exports.parseDocument = parseDocument;
function getOpenApiVersion(root) {
    var _a;
    if ((root === null || root === void 0 ? void 0 : root.swagger) === "2.0") {
        return types_1.OpenApiVersion.V2;
    }
    else if ((root === null || root === void 0 ? void 0 : root.openapi) &&
        typeof (root === null || root === void 0 ? void 0 : root.openapi) === "string" &&
        ((_a = root === null || root === void 0 ? void 0 : root.openapi) === null || _a === void 0 ? void 0 : _a.match(/^3\.0\.\d(-.+)?$/))) {
        return types_1.OpenApiVersion.V3;
    }
    else {
        return types_1.OpenApiVersion.Unknown;
    }
}
exports.getOpenApiVersion = getOpenApiVersion;
//# sourceMappingURL=parsers.js.map