"use strict";
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
const vscode_languageserver_1 = require("vscode-languageserver");
const SwaggerParser = require("swagger-parser");
const YAML = require("js-yaml");
const path = require("path");
const SWAGGER_CODE_COMPLTE_DEFS = [
/** TODO */
];
let connection = vscode_languageserver_1.createConnection(vscode_languageserver_1.ProposedFeatures.all);
let documents = new vscode_languageserver_1.TextDocuments();
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
    let capabilities = params.capabilities;
    hasConfigurationCapability =
        capabilities.workspace && !!capabilities.workspace.configuration;
    hasWorkspaceFolderCapability =
        capabilities.workspace && !!capabilities.workspace.workspaceFolders;
    hasDiagnosticRelatedInformationCapability =
        capabilities.textDocument &&
            capabilities.textDocument.publishDiagnostics &&
            capabilities.textDocument.publishDiagnostics.relatedInformation;
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['"', ':']
            }
        }
    };
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        connection.client.register(vscode_languageserver_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;
let documentSettings = new Map();
connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.languageServerExample || defaultSettings));
    }
    documents.all().forEach(validateTextDocument);
});
function getDocumentSettings(resource) {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'swaggerViewer'
        });
        documentSettings.set(resource, result);
    }
    return result;
}
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});
documents.onDidChangeContent(change => {
    validateTextDocument(change.document);
});
function getParsedContent(document) {
    let fileContent = document.getText();
    let fileObject = null;
    if (fileContent.indexOf('swagger') >= 0 || fileContent.indexOf('openapi') >= 0) {
        if (document.languageId === "json") {
            fileObject = JSON.parse(fileContent);
        }
        else if (document.languageId === "yaml" || document.languageId === "yml") {
            fileObject = YAML.safeLoad(fileContent); // YAML.safeLoad(fileContent);
        }
    }
    if (fileObject && typeof fileObject === 'object' && (fileObject.hasOwnProperty('swagger') || fileObject.hasOwnProperty('openapi'))) {
        return fileObject;
    }
    return null;
}
function sendErrorDiagnostic(error, textDocument, source) {
    let diagnostics = [];
    let diagnostic = {
        severity: vscode_languageserver_1.DiagnosticSeverity.Warning,
        code: 0,
        message: error.message,
        range: {
            start: {
                line: 0,
                character: 1
            },
            end: {
                line: 0,
                character: 1
            }
        },
        source: source
    };
    if (error.mark) {
        diagnostic.range.start = diagnostic.range.end = {
            line: error.mark.line,
            character: error.mark.column
        };
    }
    diagnostics.push(diagnostic);
    connection.sendDiagnostics({
        uri: textDocument.uri,
        diagnostics
    });
}
function validateSwagger(swagger, textDocument) {
    SwaggerParser.validate(swagger)
        .then(() => {
        const diagnostics = [];
        connection.sendDiagnostics({
            uri: textDocument.uri,
            diagnostics
        });
    })
        .catch(error => {
        sendErrorDiagnostic(error, textDocument, "Swagger Viewer");
    });
}
function changeCurrentWorkDir(textDocument) {
    const documentPath = vscode_languageserver_1.Files.uriToFilePath(textDocument.uri);
    const documentDir = path.dirname(documentPath);
    // work dir == document base dir
    process.chdir(documentDir);
}
function validateTextDocument(textDocument) {
    return __awaiter(this, void 0, void 0, function* () {
        let swaggerObject = null;
        try {
            swaggerObject = getParsedContent(textDocument);
        }
        catch (ex) {
            sendErrorDiagnostic(ex, textDocument, "Swagger Viewer Parse");
        }
        if (!swaggerObject)
            return;
        changeCurrentWorkDir(textDocument);
        validateSwagger(swaggerObject, textDocument);
    });
}
connection.onDidChangeWatchedFiles(_change => {
});
connection.onCompletion((_textDocumentPosition) => {
    return SWAGGER_CODE_COMPLTE_DEFS;
});
connection.onCompletionResolve((item) => {
    let def = SWAGGER_CODE_COMPLTE_DEFS.find(def => def.data.id === item.data.id);
    item.detail = def.detail;
    item.documentation = def.documentation;
    return item;
});
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map