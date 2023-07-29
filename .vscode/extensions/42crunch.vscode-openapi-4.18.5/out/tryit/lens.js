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
exports.TryItCodelensProvider = void 0;
const vscode = __importStar(require("vscode"));
const oas30_1 = require("@xliic/common/oas30");
const swagger_1 = require("@xliic/common/swagger");
const openapi_1 = require("@xliic/common/openapi");
const ref_1 = require("@xliic/common/ref");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const parsers_1 = require("../parsers");
const types_1 = require("../types");
class TryItCodelensProvider {
    constructor(cache) {
        this.cache = cache;
    }
    provideCodeLenses(document, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = [];
            const parsed = this.cache.getParsedDocument(document);
            const version = (0, parsers_1.getOpenApiVersion)(parsed);
            if (parsed && version !== types_1.OpenApiVersion.Unknown) {
                const oas = parsed;
                const operations = (0, openapi_1.isOpenapi)(oas) ? (0, oas30_1.getOperations)(oas) : (0, swagger_1.getOperations)(oas);
                for (const [path, method, operation] of operations) {
                    const tryOperationLens = operationLens(document, oas, path, method);
                    if (tryOperationLens) {
                        result.push(tryOperationLens);
                    }
                    // TODO examples in swagger
                    if ((0, openapi_1.isOpenapi)(oas)) {
                        result.push(...operationExamplesLens(document, oas, path, method, operation));
                    }
                }
            }
            return result;
        });
    }
}
exports.TryItCodelensProvider = TryItCodelensProvider;
function operationLens(document, oas, path, method) {
    const location = (0, preserving_json_yaml_parser_1.getLocation)(oas.paths[path], method);
    if (!location) {
        return undefined;
    }
    const position = document.positionAt(location.key.start);
    const line = document.lineAt(position.line + 1);
    const range = new vscode.Range(new vscode.Position(position.line + 1, line.firstNonWhitespaceCharacterIndex), new vscode.Position(position.line + 1, line.range.end.character));
    return new vscode.CodeLens(range, {
        title: `Try it`,
        tooltip: "Try this operation by sending a request",
        command: "openapi.tryOperation",
        arguments: [document, path, method],
    });
}
function operationExamplesLens(document, oas, path, method, operation) {
    var _a;
    const result = [];
    const content = (_a = (0, ref_1.deref)(oas, operation.requestBody)) === null || _a === void 0 ? void 0 : _a.content;
    for (const [mediaType, mediaTypeContent] of Object.entries(content || {})) {
        const examples = mediaTypeContent.examples;
        if (examples) {
            for (const [name, exampleOrRef] of Object.entries(examples)) {
                const location = (0, preserving_json_yaml_parser_1.getLocation)(examples, name);
                const example = (0, ref_1.deref)(oas, exampleOrRef);
                if (location && (example === null || example === void 0 ? void 0 : example.value) !== undefined) {
                    const position = document.positionAt(location.key.start);
                    const line = document.lineAt(position.line + 1);
                    const range = new vscode.Range(new vscode.Position(position.line + 1, line.firstNonWhitespaceCharacterIndex), new vscode.Position(position.line + 1, line.range.end.character));
                    result.push(new vscode.CodeLens(range, {
                        title: `Try it`,
                        tooltip: "Try this operation by sending a request, use this example for the request body",
                        command: "openapi.tryOperationWithExample",
                        arguments: [document, path, method, mediaType, example.value],
                    }));
                }
            }
        }
    }
    return result;
}
//# sourceMappingURL=lens.js.map