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
exports.parseAuditReport = exports.updateAuditContext = void 0;
const path_1 = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const bundler_1 = require("../bundler");
const util_1 = require("./util");
const external_refs_1 = require("../external-refs");
function updateAuditContext(context, uri, audit) {
    context.auditsByMainDocument[uri] = audit;
    const auditsBySubDocument = {
        [audit.summary.documentUri]: audit,
    };
    for (const uri of audit.summary.subdocumentUris) {
        auditsBySubDocument[uri] = audit;
    }
    context.auditsByDocument = Object.assign(Object.assign({}, context.auditsByDocument), auditsBySubDocument);
}
exports.updateAuditContext = updateAuditContext;
function parseAuditReport(cache, document, report, mapping) {
    return __awaiter(this, void 0, void 0, function* () {
        const documentUri = document.uri.toString();
        const [grades, issues, documents, badIssues] = yield splitReportByDocument(document, report, cache, mapping);
        if (badIssues.length > 0) {
            const messages = badIssues.map((issue) => `Unable to locate issue "${issue.id}" at "${issue.pointer}".`);
            messages.unshift("Some issues have not been displayed, please contact support at https://support.42crunch.com with the following information:");
            vscode.window.showErrorMessage(messages.join(" "));
        }
        const filename = (0, path_1.basename)(document.fileName);
        const files = {};
        const mainPath = document.uri.fsPath;
        const mainDir = path_1.default.dirname(mainPath);
        for (const uri of Object.keys(documents)) {
            const publicUri = (0, external_refs_1.fromInternalUri)(vscode.Uri.parse(uri));
            if (publicUri.scheme === "http" || publicUri.scheme === "https") {
                files[uri] = { relative: publicUri.toString() };
            }
            else {
                files[uri] = { relative: path_1.default.relative(mainDir, publicUri.fsPath) };
            }
        }
        const result = {
            valid: report.valid,
            minimalReport: report.minimalReport,
            summary: Object.assign(Object.assign({}, grades), { documentUri, subdocumentUris: Object.keys(documents).filter((uri) => uri != documentUri) }),
            issues,
            filename,
            files,
        };
        return result;
    });
}
exports.parseAuditReport = parseAuditReport;
function splitReportByDocument(mainDocument, report, cache, mappings) {
    return __awaiter(this, void 0, void 0, function* () {
        const grades = readSummary(report);
        const reportedIssues = readAssessment(report);
        const [mainRoot, documentUris, issuesPerDocument, badIssues] = yield processIssues(mainDocument, cache, mappings, reportedIssues);
        const files = {
            [mainDocument.uri.toString()]: [mainDocument, mainRoot],
        };
        // load and parse all documents
        for (const uri of documentUris) {
            if (!files[uri]) {
                const document = yield vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
                const root = cache.getLastGoodParsedDocument(document);
                files[uri] = [document, root];
            }
        }
        const issues = {};
        for (const [uri, reportedIssues] of Object.entries(issuesPerDocument)) {
            const [document, root] = files[uri];
            issues[uri] = reportedIssues.map((issue) => {
                const [lineNo, range] = (0, util_1.getLocationByPointer)(document, root, issue.pointer);
                return Object.assign(Object.assign({}, issue), { documentUri: uri, lineNo,
                    range });
            });
        }
        const documents = {};
        for (const [uri, [document, root]] of Object.entries(files)) {
            documents[uri] = document;
        }
        return [grades, issues, documents, badIssues];
    });
}
function processIssues(document, cache, mappings, issues) {
    const mainUri = document.uri;
    const documentUris = { [mainUri.toString()]: true };
    const issuesPerDocument = {};
    const badIssues = [];
    const root = cache.getLastGoodParsedDocument(document);
    if (root === undefined) {
        throw new Error("Failed to parse current document");
    }
    for (const issue of issues) {
        const location = findIssueLocation(mainUri, root, mappings, issue.pointer);
        if (location) {
            const [uri, pointer] = location;
            if (!issuesPerDocument[uri]) {
                issuesPerDocument[uri] = [];
            }
            if (!documentUris[uri]) {
                documentUris[uri] = true;
            }
            issuesPerDocument[uri].push(Object.assign(Object.assign({}, issue), { pointer: pointer }));
        }
        else {
            // can't find issue, add to the list ot bad issues
            badIssues.push(issue);
        }
    }
    return [root, Object.keys(documentUris), issuesPerDocument, badIssues];
}
function readAssessment(assessment) {
    let issues = [];
    const jsonPointerIndex = assessment.index;
    function transformScore(score) {
        const rounded = Math.abs(Math.round(score));
        if (score === 0) {
            return "0";
        }
        else if (rounded >= 1) {
            return rounded.toString();
        }
        return "less than 1";
    }
    function transformIssues(issues, defaultCriticality = 5) {
        const result = [];
        for (const id of Object.keys(issues)) {
            const issue = issues[id];
            for (const subIssue of issue.issues) {
                result.push({
                    id,
                    description: subIssue.specificDescription
                        ? subIssue.specificDescription
                        : issue.description,
                    pointer: jsonPointerIndex[subIssue.pointer],
                    score: subIssue.score ? Math.abs(subIssue.score) : 0,
                    displayScore: transformScore(subIssue.score ? subIssue.score : 0),
                    criticality: issue.criticality ? issue.criticality : defaultCriticality,
                });
            }
        }
        return result;
    }
    if (assessment.data) {
        issues = issues.concat(transformIssues(assessment.data.issues));
    }
    if (assessment.security) {
        issues = issues.concat(transformIssues(assessment.security.issues));
    }
    if (assessment.warnings) {
        issues = issues.concat(transformIssues(assessment.warnings.issues, 1));
    }
    if (assessment.semanticErrors) {
        issues = issues.concat(transformIssues(assessment.semanticErrors.issues));
    }
    if (assessment.validationErrors) {
        issues = issues.concat(transformIssues(assessment.validationErrors.issues));
    }
    issues.sort((a, b) => b.score - a.score);
    return issues;
}
function readSummary(assessment) {
    const grades = {
        datavalidation: {
            value: Math.round(assessment.data ? assessment.data.score : 0),
            max: 70,
        },
        security: {
            value: Math.round(assessment.security ? assessment.security.score : 0),
            max: 30,
        },
        oasconformance: {
            value: 0,
            max: 0,
        },
        all: 0,
        errors: false,
        invalid: false,
    };
    if (assessment.semanticErrors || assessment.validationErrors) {
        grades.errors = true;
    }
    if (assessment.openapiState === "fileInvalid") {
        grades.invalid = true;
    }
    grades.all = grades.datavalidation.value + grades.security.value + grades.oasconformance.value;
    return grades;
}
function findIssueLocation(mainUri, root, mappings, pointer) {
    const node = (0, preserving_json_yaml_parser_1.find)(root, pointer);
    if (node !== undefined) {
        return [mainUri.toString(), pointer];
    }
    else {
        const mapping = (0, bundler_1.findMapping)(mappings, pointer);
        if (mapping && mapping.hash) {
            return [mapping.uri, mapping.hash];
        }
    }
}
//# sourceMappingURL=audit.js.map