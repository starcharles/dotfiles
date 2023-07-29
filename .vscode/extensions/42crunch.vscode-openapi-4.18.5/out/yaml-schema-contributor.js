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
exports.provideYamlSchemas = exports.activate = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const types_1 = require("./types");
function activate(context, cache) {
    const yamlExtension = vscode.extensions.getExtension("redhat.vscode-yaml");
    if (yamlExtension) {
        provideYamlSchemas(context, cache, yamlExtension);
    }
    else {
        // TODO log
    }
}
exports.activate = activate;
function provideYamlSchemas(context, cache, yamlExtension) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!yamlExtension.isActive) {
            yield yamlExtension.activate();
        }
        function requestSchema(uri) {
            for (const document of vscode.workspace.textDocuments) {
                if (document.uri.toString() === uri) {
                    const version = cache.getDocumentVersion(document);
                    if (version === types_1.OpenApiVersion.V2) {
                        return "openapi:v2";
                    }
                    else if (version === types_1.OpenApiVersion.V3) {
                        return "openapi:v3";
                    }
                    break;
                }
            }
            return null;
        }
        function requestSchemaContent(uri) {
            if (uri === "openapi:v2") {
                const filename = path.join(context.extensionPath, "schema/generated", "openapi-2.0.json");
                return fs.readFileSync(filename, { encoding: "utf8" });
            }
            else if (uri === "openapi:v3") {
                const filename = path.join(context.extensionPath, "schema/generated", "openapi-3.0-2019-04-02.json");
                return fs.readFileSync(filename, { encoding: "utf8" });
            }
            return null;
        }
        const schemaContributor = yamlExtension.exports;
        schemaContributor.registerContributor("openapi", requestSchema, requestSchemaContent);
    });
}
exports.provideYamlSchemas = provideYamlSchemas;
//# sourceMappingURL=yaml-schema-contributor.js.map