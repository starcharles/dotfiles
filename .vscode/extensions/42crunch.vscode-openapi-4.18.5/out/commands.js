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
exports.snippetCommand = exports.registerCommands = exports.registeredSnippetQuickFixes = void 0;
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
// @ts-nocheck
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const snippets = __importStar(require("./generated/snippets.json"));
const types_1 = require("./types");
const json_utils_1 = require("./json-utils");
const quickfix_1 = require("./audit/quickfix");
const pointer_1 = require("./pointer");
const util_1 = require("./util");
const outline_1 = require("./outline");
const commands = {
    goToLine,
    copyJsonReference,
    createNewTwo,
    createNewThree,
    createNewTwoYaml,
    createNewThreeYaml,
    addPath,
    addOperation,
    addSecurity,
    addHost,
    addBasePath,
    addInfo,
    addSecurityDefinitionBasic,
    addSecurityDefinitionApiKey,
    addSecurityDefinitionOauth2Access,
    addDefinitionObject,
    addParameterBody,
    addParameterPath,
    addParameterOther,
    addResponse,
    v3addInfo,
    v3addComponentsResponse,
    v3addComponentsParameter,
    v3addComponentsSchema,
    v3addServer,
    v3addSecuritySchemeBasic,
    v3addSecuritySchemeApiKey,
    v3addSecuritySchemeJWT,
    v3addSecuritySchemeOauth2Access,
    copySelectedTwoPathOutlineJsonReference,
    copySelectedTwoParametersOutlineJsonReference,
    copySelectedTwoResponsesOutlineJsonReference,
    copySelectedTwoDefinitionOutlineJsonReference,
    copySelectedTwoSecurityOutlineJsonReference,
    copySelectedTwoSecurityDefinitionOutlineJsonReference,
    copySelectedThreePathOutlineJsonReference,
    copySelectedThreeServersOutlineJsonReference,
    copySelectedThreeComponentsOutlineJsonReference,
    copySelectedThreeSecurityOutlineJsonReference,
};
exports.registeredSnippetQuickFixes = {};
function registerCommands(cache) {
    for (const fix of snippets.fixes) {
        exports.registeredSnippetQuickFixes[fix.problem[0]] = fix;
    }
    return Object.keys(commands).map((name) => registerCommand(name, cache, commands[name]));
}
exports.registerCommands = registerCommands;
function registerCommand(name, cache, handler) {
    const wrapped = function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield handler(cache, ...args);
            }
            catch (e) {
                vscode.window.showErrorMessage(`Failed to execute command: ${e.message}`);
            }
        });
    };
    return vscode.commands.registerCommand(`openapi.${name}`, wrapped);
}
function goToLine(cache, uri, range) {
    const [editor] = uri === null
        ? [vscode.window.activeTextEditor]
        : vscode.window.visibleTextEditors.filter((editor) => editor.document.uri.toString() === uri);
    if (editor) {
        editor.selection = new vscode.Selection(range.start, range.start);
        editor.revealRange(editor.selection, vscode.TextEditorRevealType.AtTop);
    }
}
function copyJsonReference(cache, range) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const root = cache.getParsedDocument(editor.document);
            if (root) {
                const [node, path] = (0, preserving_json_yaml_parser_1.findNodeAtOffset)(root, editor.document.offsetAt(editor.selection.active));
                const jsonPointer = (0, preserving_json_yaml_parser_1.joinJsonPointer)(path);
                vscode.env.clipboard.writeText(`#${jsonPointer}`);
                const disposable = vscode.window.setStatusBarMessage(`Copied Reference: #${jsonPointer}`);
                setTimeout(() => disposable.dispose(), 1000);
            }
        }
    });
}
function copySelectedTwoPathOutlineJsonReference(cache) {
    copySelectedJsonReference("openapiTwoPathOutline");
}
function copySelectedTwoParametersOutlineJsonReference(cache) {
    copySelectedJsonReference("openapiTwoParametersOutline");
}
function copySelectedTwoResponsesOutlineJsonReference(cache) {
    copySelectedJsonReference("openapiTwoResponsesOutline");
}
function copySelectedTwoDefinitionOutlineJsonReference(cache) {
    copySelectedJsonReference("openapiTwoDefinitionOutline");
}
function copySelectedTwoSecurityOutlineJsonReference(cache) {
    copySelectedJsonReference("openapiTwoSecurityOutline");
}
function copySelectedTwoSecurityDefinitionOutlineJsonReference(cache) {
    copySelectedJsonReference("openapiTwoSecurityDefinitionOutline");
}
function copySelectedThreePathOutlineJsonReference(cache) {
    copySelectedJsonReference("openapiThreePathOutline");
}
function copySelectedThreeServersOutlineJsonReference(cache) {
    copySelectedJsonReference("openapiThreeServersOutline");
}
function copySelectedThreeComponentsOutlineJsonReference(cache) {
    copySelectedJsonReference("openapiThreeComponentsOutline");
}
function copySelectedThreeSecurityOutlineJsonReference(cache) {
    copySelectedJsonReference("openapiThreeSecurityOutline");
}
function copySelectedJsonReference(viewId) {
    copyNodeJsonReference(outline_1.outlines[viewId].selection[0]);
}
function copyNodeJsonReference(node) {
    if (node) {
        const path = [];
        for (let current = node; current.key !== undefined; current = current.parent) {
            path.unshift(current.key);
        }
        const pointer = (0, preserving_json_yaml_parser_1.joinJsonPointer)(path);
        // JSON Pointer is allowed to have special chars, but JSON Reference
        // requires these to be encoded
        const encoded = pointer
            .split("/")
            .map((segment) => encodeURIComponent(segment))
            .join("/");
        vscode.env.clipboard.writeText(`#${encoded}`);
        const disposable = vscode.window.setStatusBarMessage(`Copied Reference: #${encoded}`);
        setTimeout(() => disposable.dispose(), 1000);
    }
}
function createNew(snippet, language) {
    return __awaiter(this, void 0, void 0, function* () {
        const document = yield vscode.workspace.openTextDocument({
            language,
        });
        yield vscode.window.showTextDocument(document);
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            yield editor.insertSnippet(new vscode.SnippetString(snippet), editor.document.positionAt(0));
        }
    });
}
function createNewTwo(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield createNew(`{
    "swagger":"2.0",
    "info": {
      "title":"\${1:API Title\}",
      "version":"\${2:1.0}"
    },
    "host": "\${3:api.server.test}",
    "basePath": "/",
    "schemes": ["https"],
    "paths": {
    }
  }`, "json");
    });
}
function createNewThree(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield createNew(`{
    "openapi":"3.0.2",
    "info": {
      "title":"\${1:API Title}",
      "version":"\${2:1.0}"
    },
    "servers": [
      {"url":"\${3:https://api.server.test/v1}"}
    ],
    "paths": {
    }
  }`, "json");
    });
}
function createNewTwoYaml(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield createNew(`swagger: '2.0'
info:
  title: \${1:API Title}
  version: \${2:'1.0'}
host: \${3:api.server.test}
basePath: /
schemes:
  - https
paths:
  /test:
    get:
      responses:
        '200':
          description: OK`, "yaml");
    });
}
function createNewThreeYaml(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield createNew(`openapi: '3.0.2'
info:
  title: \${1:API Title}
  version: \${2:'1.0'}
servers:
  - url: \${3:https://api.server.test/v1}
paths:
  /test:
    get:
      responses:
        '200':
          description: OK
`, "yaml");
    });
}
function addBasePath(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["basePath"], cache);
    });
}
function addHost(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["host"], cache);
    });
}
function addInfo(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["info"], cache);
    });
}
function v3addInfo(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["info"], cache);
    });
}
function addPath(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["path"], cache);
    });
}
function addSecurityDefinitionBasic(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["securityBasic"], cache);
    });
}
function addSecurityDefinitionOauth2Access(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["securityOauth2Access"], cache);
    });
}
function addSecurityDefinitionApiKey(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["securityApiKey"], cache);
    });
}
function addSecurity(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["security"], cache);
    });
}
function addDefinitionObject(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["definitionObject"], cache);
    });
}
function addParameterPath(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["parameterPath"], cache);
    });
}
function addParameterBody(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["parameterBody"], cache);
    });
}
function addParameterOther(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["parameterOther"], cache);
    });
}
function addResponse(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["response"], cache);
    });
}
function v3addComponentsResponse(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["componentsResponse"], cache);
    });
}
function v3addComponentsParameter(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["componentsParameter"], cache);
    });
}
function v3addComponentsSchema(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["componentsSchema"], cache);
    });
}
function v3addSecuritySchemeBasic(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["componentsSecurityBasic"], cache);
    });
}
function v3addSecuritySchemeApiKey(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["componentsSecurityApiKey"], cache);
    });
}
function v3addSecuritySchemeJWT(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["componentsSecurityJwt"], cache);
    });
}
function v3addSecuritySchemeOauth2Access(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["componentsSecurityOauth2Access"], cache);
    });
}
function v3addServer(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield snippetCommand(exports.registeredSnippetQuickFixes["server"], cache);
    });
}
function addOperation(cache, node) {
    return __awaiter(this, void 0, void 0, function* () {
        const fix = exports.registeredSnippetQuickFixes["operation"];
        fix.pointer = (0, preserving_json_yaml_parser_1.joinJsonPointer)(["paths", node.key]);
        yield snippetCommand(fix, cache);
    });
}
function noActiveOpenApiEditorGuard(cache) {
    var _a;
    const document = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document;
    if (!document || cache.getDocumentVersion(document) === types_1.OpenApiVersion.Unknown) {
        vscode.window.showErrorMessage(`Can't run the command, no active editor with OpenAPI file`);
        return true;
    }
    return false;
}
function snippetCommand(fix, cache, useEdit) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (noActiveOpenApiEditorGuard(cache) || !editor) {
            return;
        }
        const document = editor.document;
        const root = cache.getLastGoodParsedDocument(document);
        if (!root) {
            // FIXME display error message?
            return;
        }
        const bundle = yield cache.getDocumentBundle(document);
        const version = cache.getDocumentVersion(document);
        const target = (0, json_utils_1.findJsonNodeValue)(root, fix.pointer);
        const context = {
            editor: editor,
            edit: null,
            issues: [],
            fix: (0, preserving_json_yaml_parser_1.simpleClone)(fix),
            bulk: false,
            auditContext: null,
            version: version,
            bundle: bundle,
            root: root,
            target: target,
            document: document,
        };
        if (useEdit === true) {
            context.bulk = true;
            context.skipConfirmation = true;
        }
        let finalFix = context.fix["fix"];
        let pointer = context.fix.pointer;
        let pointerPrefix = "";
        while ((0, preserving_json_yaml_parser_1.find)(root, pointer) === undefined) {
            const key = (0, pointer_1.getPointerLastSegment)(pointer);
            pointer = (0, pointer_1.getPointerParent)(pointer);
            const tmpFix = {};
            if (isArray(key)) {
                tmpFix[key] = [finalFix];
                pointerPrefix = "/" + key + "/0" + pointerPrefix;
            }
            else {
                tmpFix[key] = finalFix;
                pointerPrefix = "/" + key + pointerPrefix;
            }
            finalFix = tmpFix;
        }
        context.fix["fix"] = finalFix;
        context.target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
        if (pointerPrefix.length > 0) {
            for (const parameter of context.fix.parameters) {
                parameter.path = pointerPrefix + parameter.path;
            }
        }
        switch (fix.type) {
            case types_1.FixType.Insert:
                (0, quickfix_1.fixInsert)(context);
        }
        if (useEdit) {
            yield vscode.workspace.applyEdit(context.edit);
        }
        else {
            const snippetParameters = context.snippetParameters;
            if (snippetParameters) {
                yield (0, util_1.processSnippetParameters)(editor, snippetParameters, context.dropBrackets);
                yield editor.insertSnippet(snippetParameters.snippet, snippetParameters.location);
            }
        }
    });
}
exports.snippetCommand = snippetCommand;
function isArray(key) {
    return key === "security" || key === "servers";
}
//# sourceMappingURL=commands.js.map