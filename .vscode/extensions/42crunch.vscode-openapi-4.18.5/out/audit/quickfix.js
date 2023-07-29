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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTitle = exports.AuditCodeActions = exports.registerQuickfixes = exports.updateReport = exports.fixInsert = exports.componentsTags = exports.topTags = void 0;
// @ts-nocheck
const vscode = __importStar(require("vscode"));
const quickfixes = __importStar(require("../generated/quickfixes.json"));
const types_1 = require("../types");
const diagnostic_1 = require("./diagnostic");
const decoration_1 = require("./decoration");
const util_1 = require("../util");
const quickfix_sources_1 = __importDefault(require("./quickfix-sources"));
const util_2 = require("./util");
const quickfix_schema_1 = require("./quickfix-schema");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const json_utils_1 = require("../json-utils");
const registeredQuickFixes = {};
// preferred order of the tags, mixed v2 and v3 tags
exports.topTags = [
    "swagger",
    "openapi",
    "info",
    "externalDocs",
    "host",
    "basePath",
    "schemes",
    "consumes",
    "produces",
    "tags",
    "servers",
    "components",
    "paths",
    "parameters",
    "responses",
    "security",
    "securityDefinitions",
    "definitions",
];
// preferred order of tags in v3 components
exports.componentsTags = [
    "schemas",
    "responses",
    "parameters",
    "examples",
    "requestBodies",
    "headers",
    "securitySchemes",
    "links",
    "callbacks",
];
function fixRegexReplace(context) {
    const document = context.document;
    const fix = context.fix;
    const target = context.target;
    const currentValue = target.value;
    if (typeof currentValue !== "string") {
        return;
    }
    context.snippet = false;
    const newValue = currentValue.replace(new RegExp(fix.match, "g"), fix.replace);
    let value, range;
    if (document.languageId === "yaml") {
        [value, range] = (0, util_1.replaceYamlNode)(context, newValue);
    }
    else {
        [value, range] = (0, util_1.replaceJsonNode)(context, '"' + newValue + '"');
    }
    const edit = getWorkspaceEdit(context);
    edit.replace(document.uri, range, value);
}
function fixInsert(context) {
    const document = context.document;
    let value, position;
    context.snippet = !context.bulk;
    context.snippetParameters = {};
    if (document.languageId === "yaml") {
        [value, position] = (0, util_1.insertYamlNode)(context, (0, util_1.getFixAsYamlString)(context));
    }
    else {
        [value, position] = (0, util_1.insertJsonNode)(context, (0, util_1.getFixAsJsonString)(context));
    }
    if (context.snippet) {
        context.snippetParameters.snippet = new vscode.SnippetString(value);
        context.snippetParameters.location = position;
    }
    else {
        const edit = getWorkspaceEdit(context);
        context.snippetParameters = undefined;
        if (context.dropBrackets) {
            (0, util_1.dropBracketsOnEdit)(context.editor, context.dropBrackets, edit);
        }
        if (context.skipConfirmation) {
            edit.insert(document.uri, position, value);
        }
        else {
            edit.insert(document.uri, position, value, {
                needsConfirmation: true,
                label: context.fix.title,
            });
        }
    }
}
exports.fixInsert = fixInsert;
function fixReplace(context) {
    const document = context.document;
    let value, range;
    context.snippet = false;
    if (document.languageId === "yaml") {
        [value, range] = (0, util_1.replaceYamlNode)(context, (0, util_1.getFixAsYamlString)(context));
    }
    else {
        [value, range] = (0, util_1.replaceJsonNode)(context, (0, util_1.getFixAsJsonString)(context));
    }
    const edit = getWorkspaceEdit(context);
    edit.replace(document.uri, range, value);
}
function fixRenameKey(context) {
    const document = context.document;
    let value;
    context.snippet = false;
    if (document.languageId === "yaml") {
        value = (0, util_1.getFixAsYamlString)(context);
    }
    else {
        value = (0, util_1.getFixAsJsonString)(context);
    }
    const range = (0, util_1.renameKeyNode)(context);
    const edit = getWorkspaceEdit(context);
    edit.replace(document.uri, range, value);
}
function fixDelete(context) {
    const document = context.document;
    let range;
    context.snippet = false;
    if (document.languageId === "yaml") {
        range = (0, util_1.deleteYamlNode)(context);
    }
    else {
        range = (0, util_1.deleteJsonNode)(context);
    }
    const edit = getWorkspaceEdit(context);
    edit.delete(document.uri, range);
}
function transformInsertToReplaceIfExists(context) {
    const target = context.target;
    const fix = context.fix;
    const keys = Object.keys(fix.fix);
    if (target.isObject() && keys.length === 1) {
        const insertingKey = keys[0];
        for (const child of target.getChildren()) {
            if (child.getKey() === insertingKey) {
                context.target = (0, json_utils_1.findJsonNodeValue)(context.root, `${context.target.pointer}/${insertingKey}`);
                context.fix = {
                    problem: fix.problem,
                    title: fix.title,
                    type: types_1.FixType.Replace,
                    fix: fix.fix[insertingKey],
                };
                return true;
            }
        }
    }
    return false;
}
function quickFixCommand(editor, issues, fix, auditContext, cache) {
    return __awaiter(this, void 0, void 0, function* () {
        let edit = null;
        let snippetParameters = null;
        let dropBrackets = null;
        const document = editor.document;
        const uri = document.uri.toString();
        const audit = auditContext.auditsByDocument[uri];
        if (!audit) {
            return;
        }
        const auditDocument = yield vscode.workspace.openTextDocument(vscode.Uri.parse(audit.summary.documentUri));
        const bundle = yield cache.getDocumentBundle(auditDocument);
        const version = cache.getDocumentVersion(auditDocument);
        const issuesByPointer = getIssuesByPointers(issues);
        // Single fix has one issue in the array
        // Assembled fix means all issues share same pointer, but have different ids
        // Bulk means all issues share same id, but have different pointers
        const bulk = Object.keys(issuesByPointer).length > 1;
        for (const issuePointer of Object.keys(issuesByPointer)) {
            // if fix.pointer exists, append it to diagnostic.pointer
            const pointer = fix.pointer ? `${issuePointer}${fix.pointer}` : issuePointer;
            const root = cache.getLastGoodParsedDocument(document);
            const target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
            const context = {
                editor: editor,
                edit: edit,
                issues: bulk ? issuesByPointer[issuePointer] : issues,
                fix: (0, preserving_json_yaml_parser_1.simpleClone)(fix),
                bulk: bulk,
                auditContext: auditContext,
                version: version,
                bundle: bundle,
                root: root,
                target: target,
                document: document,
            };
            switch (fix.type) {
                case types_1.FixType.Insert:
                    if (transformInsertToReplaceIfExists(context)) {
                        fixReplace(context);
                    }
                    else {
                        fixInsert(context);
                    }
                    break;
                case types_1.FixType.Replace:
                    fixReplace(context);
                    break;
                case types_1.FixType.RegexReplace:
                    fixRegexReplace(context);
                    break;
                case types_1.FixType.RenameKey:
                    fixRenameKey(context);
                    break;
                case types_1.FixType.Delete:
                    fixDelete(context);
            }
            // A fix handler above initialized workspace edit lazily with updates
            // Remember it here to pass to other fix handlers in case of bulk fix feature
            // They will always udate the same edit instance
            if (context.edit) {
                edit = context.edit;
            }
            if (context.snippetParameters) {
                dropBrackets = context["dropBrackets"];
                snippetParameters = context.snippetParameters;
            }
        }
        // Apply only if has anything to apply
        if (edit) {
            yield vscode.workspace.applyEdit(edit);
        }
        else if (snippetParameters) {
            yield (0, util_1.processSnippetParameters)(editor, snippetParameters, dropBrackets);
            yield editor.insertSnippet(snippetParameters.snippet, snippetParameters.location);
        }
        // update diagnostics
        updateReport(editor, issues, auditContext, cache, reportWebView);
    });
}
function updateReport(editor, issues, auditContext, cache, reportWebView) {
    const document = editor.document;
    const uri = document.uri.toString();
    const audit = auditContext.auditsByDocument[uri];
    if (!audit) {
        return;
    }
    // create temp hash set to have constant time complexity while searching for fixed issues
    const fixedIssueIds = new Set();
    const fixedIssueIdAndPointers = new Set();
    issues.forEach((issue) => {
        fixedIssueIds.add(issue.id);
        fixedIssueIdAndPointers.add(issue.id + issue.pointer);
    });
    // update range for all issues (since the fix has potentially changed line numbering in the file)
    const root = cache.getLastGoodParsedDocument(document);
    const updatedIssues = [];
    for (const issue of audit.issues[uri]) {
        if (fixedIssueIdAndPointers.has(getIssueUniqueId(issue))) {
            continue;
        }
        const [lineNo, range] = (0, util_2.getLocationByPointer)(document, root, issue.pointer);
        issue.lineNo = lineNo;
        issue.range = range;
        updatedIssues.push(issue);
    }
    audit.issues[uri] = updatedIssues;
    // rebuild diagnostics and decorations and refresh report
    (0, diagnostic_1.updateDiagnostics)(auditContext.diagnostics, audit.filename, audit.issues);
    (0, decoration_1.updateDecorations)(auditContext.decorations, audit.summary.documentUri, audit.issues);
    (0, decoration_1.setDecorations)(editor, auditContext);
    reportWebView.showIfVisible(audit);
}
exports.updateReport = updateReport;
function registerQuickfixes(context, cache, auditContext, reportWebView) {
    vscode.commands.registerTextEditorCommand("openapi.simpleQuickFix", (editor, edit, issues, fix) => __awaiter(this, void 0, void 0, function* () { return quickFixCommand(editor, issues, fix, auditContext, cache); }));
    vscode.commands.registerTextEditorCommand("openapi.generateSchemaQuickFix", (editor, edit, issue, fix, examples, inline) => __awaiter(this, void 0, void 0, function* () {
        return (0, quickfix_schema_1.generateSchemaFixCommand)(editor, issue, fix, examples, inline, auditContext, cache, reportWebView);
    }));
    vscode.languages.registerCodeActionsProvider("yaml", new AuditCodeActions(auditContext, cache), {
        providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
    });
    vscode.languages.registerCodeActionsProvider("json", new AuditCodeActions(auditContext, cache), {
        providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
    });
    vscode.languages.registerCodeActionsProvider("jsonc", new AuditCodeActions(auditContext, cache), {
        providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
    });
    for (const fix of quickfixes.fixes) {
        for (const problemId of fix.problem) {
            registeredQuickFixes[problemId] = fix;
        }
    }
}
exports.registerQuickfixes = registerQuickfixes;
function createSingleAction(diagnostic, issues, fix) {
    const action = new vscode.CodeAction(fix.title, vscode.CodeActionKind.QuickFix);
    action.command = {
        arguments: [issues, fix],
        command: "openapi.simpleQuickFix",
        title: fix.title,
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    return [action];
}
function createCombinedAction(issues, titles, problem, parameters, fixfix) {
    if (issues.length > 1) {
        const combinedFix = {
            problem,
            title: titles.join(", "),
            type: types_1.FixType.Insert,
            fix: fixfix,
            parameters: parameters,
        };
        const action = new vscode.CodeAction(combinedFix.title, vscode.CodeActionKind.QuickFix);
        action.command = {
            arguments: [issues, combinedFix],
            command: "openapi.simpleQuickFix",
            title: combinedFix.title,
        };
        action.diagnostics = [];
        action.isPreferred = true;
        return [action];
    }
    return [];
}
function createBulkAction(document, version, bundle, diagnostic, issue, issues, fix) {
    // FIXME for offering the bulk action, make sure that current issue also has
    // parameter values from source
    // continue only if the current issue has non-default params
    if (!hasNonDefaultParams(issue, fix, version, bundle, document)) {
        return [];
    }
    // all issues with same id and non-default params
    const similarIssues = issues
        .filter((issue) => issue.id === diagnostic.id)
        .filter((issue) => hasNonDefaultParams(issue, fix, version, bundle, document));
    if (similarIssues.length > 1) {
        const bulkTitle = `Group fix: ${fix.title} in ${similarIssues.length} locations`;
        const bulkAction = new vscode.CodeAction(bulkTitle, vscode.CodeActionKind.QuickFix);
        bulkAction.command = {
            arguments: [similarIssues, fix],
            command: "openapi.simpleQuickFix",
            title: bulkTitle,
        };
        bulkAction.diagnostics = [diagnostic];
        bulkAction.isPreferred = false;
        return [bulkAction];
    }
    return [];
}
function hasNonDefaultParams(issue, fix, version, bundle, document) {
    if (!fix.parameters) {
        return true;
    }
    const nonDefaultParameterValues = fix.parameters
        .map((parameter) => getSourceValue(issue, fix, parameter, version, bundle, document))
        .filter((values) => values.length > 0);
    return fix.parameters.length === nonDefaultParameterValues.length;
}
class AuditCodeActions {
    constructor(auditContext, cache) {
        this.auditContext = auditContext;
        this.cache = cache;
    }
    provideCodeActions(document, range, context, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const actions = [];
            const uri = document.uri.toString();
            const audit = this.auditContext.auditsByDocument[uri];
            const issues = audit === null || audit === void 0 ? void 0 : audit.issues[uri];
            if (!issues || issues.length === 0) {
                return [];
            }
            const auditDocument = yield vscode.workspace.openTextDocument(vscode.Uri.parse(audit.summary.documentUri));
            const bundle = yield this.cache.getDocumentBundle(auditDocument);
            const version = this.cache.getDocumentVersion(auditDocument);
            const root = this.cache.getParsedDocument(document);
            if (!root || !bundle) {
                return [];
            }
            const titles = [];
            const problems = [];
            const parameters = [];
            const combinedIssues = [];
            let fixObject = {};
            const issuesByPointer = getIssuesByPointers(issues);
            // Only AuditDiagnostic with fixes in registeredQuickFixes
            const diagnostics = context.diagnostics.filter((diagnostic) => {
                return (diagnostic.id && diagnostic.pointer !== undefined && registeredQuickFixes[diagnostic.id]);
            });
            for (const diagnostic of diagnostics) {
                const fix = registeredQuickFixes[diagnostic.id];
                const issue = issuesByPointer[diagnostic.pointer].filter((issue) => issue.id === diagnostic.id);
                actions.push(...createSingleAction(diagnostic, issue, fix));
                actions.push(...createBulkAction(document, version, bundle, diagnostic, issue[0], issues, fix));
                actions.push(...(0, quickfix_schema_1.createGenerateSchemaAction)(document, version, root, diagnostic, issue[0], fix));
                // Combined Fix
                if (fix.type == types_1.FixType.Insert && !fix.pointer && !Array.isArray(fix.fix)) {
                    problems.push(...fix.problem);
                    updateTitle(titles, fix.title);
                    if (fix.parameters) {
                        for (const parameter of fix.parameters) {
                            const par = (0, preserving_json_yaml_parser_1.simpleClone)(parameter);
                            par.fixIndex = combinedIssues.length;
                            parameters.push(par);
                        }
                    }
                    fixObject = Object.assign(Object.assign({}, fixObject), fix.fix);
                    combinedIssues.push(issue[0]);
                }
            }
            actions.push(...createCombinedAction(combinedIssues, titles, problems, parameters, fixObject));
            return actions;
        });
    }
}
AuditCodeActions.providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
exports.AuditCodeActions = AuditCodeActions;
function getSourceValue(issue, fix, parameter, version, bundle, document) {
    if (parameter.source && quickfix_sources_1.default[parameter.source]) {
        const source = quickfix_sources_1.default[parameter.source];
        const value = source(issue, fix, parameter, version, bundle, document);
        return value;
    }
    return [];
}
function updateTitle(titles, title) {
    if (titles.length === 0) {
        titles.push(title);
        return;
    }
    let parts = title.split(" ");
    let prevParts = titles[titles.length - 1].split(" ");
    if (parts[0].toLocaleLowerCase() !== prevParts[0].toLocaleLowerCase()) {
        parts[0] = parts[0].toLocaleLowerCase();
        titles.push(parts.join(" "));
        return;
    }
    const plurals = {
        property: "properties",
        response: "responses",
    };
    if (!compareAsWord(parts[parts.length - 1], prevParts[prevParts.length - 1], plurals)) {
        parts.shift();
        titles[titles.length - 1] += ", " + parts.join(" ");
        return;
    }
    parts.shift();
    parts.pop();
    let lastPrevPart = prevParts.pop();
    prevParts[prevParts.length - 1] += ",";
    prevParts.push(...parts);
    if (lastPrevPart in plurals) {
        lastPrevPart = plurals[lastPrevPart];
    }
    prevParts.push(lastPrevPart);
    titles[titles.length - 1] = prevParts.join(" ");
}
exports.updateTitle = updateTitle;
function compareAsWord(a, b, plural) {
    a = a.toLocaleLowerCase();
    b = b.toLocaleLowerCase();
    return a === b || plural[a] === b || plural[b] === a;
}
function getWorkspaceEdit(context) {
    if (context.edit) {
        return context.edit;
    }
    context.edit = new vscode.WorkspaceEdit();
    return context.edit;
}
function getIssuesByPointers(issues) {
    const issuesByPointers = {};
    for (const issue of issues) {
        if (!issuesByPointers[issue.pointer]) {
            issuesByPointers[issue.pointer] = [];
        }
        issuesByPointers[issue.pointer].push(issue);
    }
    return issuesByPointers;
}
function getIssueUniqueId(issue) {
    return issue.id + issue.pointer;
}
//# sourceMappingURL=quickfix.js.map