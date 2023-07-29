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
exports.Cache = void 0;
const vscode = __importStar(require("vscode"));
const types_1 = require("./types");
const parsers_1 = require("./parsers");
const configuration_1 = require("./configuration");
const bundler_1 = require("./bundler");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
class Throttle {
    constructor(delay) {
        this.delay = delay;
        this.tasks = new Map();
    }
    throttle(key, callback) {
        const existing = this.tasks.get(key);
        if (existing) {
            clearTimeout(existing);
        }
        const timeout = setTimeout(() => {
            this.tasks.delete(key);
            callback();
        }, this.delay);
        this.tasks.set(key, timeout);
    }
}
class ExpiringCache {
    constructor(interval, maxAge) {
        this.interval = interval;
        this.maxAge = maxAge;
        this.entries = new Map();
        this.expireTimer = setInterval(() => this.expire(), this.interval);
    }
    get(key) {
        const entry = this.entries.get(key);
        if (entry) {
            entry.timestamp = Date.now();
            return entry.value;
        }
    }
    set(key, value) {
        this.entries.set(key, {
            timestamp: Date.now(),
            value,
        });
    }
    delete(key) {
        return this.entries.delete(key);
    }
    values() {
        return Array.from(this.entries.values(), (entry) => entry.value);
    }
    expire() {
        const now = Date.now();
        for (const [key, value] of this.entries) {
            if (now - value.timestamp > this.maxAge) {
                this.entries.delete(key);
            }
        }
    }
    dispose() {
        clearInterval(this.expireTimer);
    }
}
class ParsedDocumentCache {
    constructor(interval, maxAge, parserOptions) {
        this.parserOptions = parserOptions;
        this.diagnostics = vscode.languages.createDiagnosticCollection("openapi-parser");
        this.cache = new ExpiringCache(interval, maxAge);
    }
    get(document) {
        const cached = this.cache.get(document.uri.toString());
        if (cached && cached.documentVersion === document.version) {
            return cached;
        }
        const parsed = this.parse(document, cached);
        this.cache.set(document.uri.toString(), parsed);
        return parsed;
    }
    dispose() {
        this.cache.dispose();
    }
    showErrors(document, version, errors) {
        const expectedMessages = {
            DuplicateKey: "Duplicate object key",
            InvalidCommentToken: "Comment is not permitted",
        };
        const additionalMessages = ["JS-YAML: Using tabs can lead to unpredictable results"];
        // do not show errors for non-openapi documents
        if (errors.length === 0 || version === types_1.OpenApiVersion.Unknown) {
            this.diagnostics.delete(document.uri);
        }
        else {
            // only display selected set of error messages, other parsing
            // errors will be shown by vs-code and we don't want duplicates
            const filtered = errors
                .map((error) => {
                if (error.message in expectedMessages) {
                    return Object.assign(Object.assign({}, error), { message: expectedMessages[error.message] });
                }
                else {
                    for (const message of additionalMessages) {
                        if (error.message.startsWith(message)) {
                            return Object.assign(Object.assign({}, error), { message });
                        }
                    }
                }
            })
                .filter((error) => error !== undefined);
            this.diagnostics.set(document.uri, filtered);
        }
    }
    parse(document, previous) {
        const [openApiVersion, parsed, errors] = (0, parsers_1.parseDocument)(document, this.parserOptions);
        // set lastGoodParsed only if no errors found, in case of errors try to reuse previous value
        const lastGoodParsed = errors.length == 0 ? parsed : previous === null || previous === void 0 ? void 0 : previous.lastGoodParsed;
        this.showErrors(document, openApiVersion, errors);
        return {
            openApiVersion,
            documentVersion: document.version,
            lastGoodParsed,
            errors,
            parsed: errors.length == 0 ? parsed : undefined,
        };
    }
}
class BundledDocumentCache {
    constructor(interval, maxAge, documentParser, externalRefProvider) {
        this.documentParser = documentParser;
        this.externalRefProvider = externalRefProvider;
        this.cache = new ExpiringCache(interval, maxAge);
    }
    get(document, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const cached = this.cache.get(document.uri.toString());
            if (cached && !(options === null || options === void 0 ? void 0 : options.rebundle)) {
                return cached.bundle;
            }
            const bundle = yield this.bundle(document);
            if (bundle) {
                this.cache.set(document.uri.toString(), {
                    document,
                    bundle,
                });
            }
            return bundle;
        });
    }
    values() {
        return this.cache.values();
    }
    // given the 'document' update all known bundles which this
    // document is a part of
    update(document) {
        return __awaiter(this, void 0, void 0, function* () {
            const rebundle = this.getAffectedDocuments(document);
            // check if this document is an OpenAPI document and must be re-bundled itself
            const parsed = this.documentParser(document);
            if (parsed.openApiVersion !== types_1.OpenApiVersion.Unknown) {
                rebundle.add(document);
            }
            const results = [];
            for (const document of rebundle) {
                const bundle = yield this.bundle(document);
                if (bundle) {
                    this.cache.set(document.uri.toString(), { document, bundle });
                }
                else {
                    // failed to bundle, remove old bundle from the cache
                    this.cache.delete(document.uri.toString());
                }
                results.push({ document, bundle });
            }
            return results;
        });
    }
    bundle(document) {
        return __awaiter(this, void 0, void 0, function* () {
            const approvedHosts = configuration_1.configuration.get("approvedHostnames");
            const parsed = this.documentParser(document);
            if (parsed.errors.length === 0 && parsed.parsed) {
                return yield (0, bundler_1.bundle)(document, parsed.openApiVersion, parsed.parsed, (document) => this.documentParser(document).parsed, approvedHosts, this.externalRefProvider);
            }
        });
    }
    getAffectedDocuments(document) {
        const affected = new Set();
        // check all cache entries which have bundles and see if
        // document belongs to a bundle, if so re-bundle the relevant
        // cache entry
        for (const entry of this.cache.values()) {
            if (entry.bundle) {
                if ("errors" in entry.bundle || entry.bundle.documents.has(document)) {
                    // rebundle ones with errors
                    // rebundle where document is a sub-document of a bundle
                    affected.add(entry.document);
                }
            }
        }
        return affected;
    }
    dispose() {
        this.cache.dispose();
    }
}
class Cache {
    constructor(parserOptions, documentSelector, externalRefProvider) {
        this.documentSelector = documentSelector;
        this.externalRefProvider = externalRefProvider;
        this._didChange = new vscode.EventEmitter();
        this._didActiveDocumentChange = new vscode.EventEmitter();
        this.diagnostics = vscode.languages.createDiagnosticCollection("openapi-bundler");
        const MAX_UPDATE_FREQUENCY = 1000, // re-bundle no more often than 1 time per second
        MAX_CACHE_ENTRY_AGE = 30000, // keep data in caches for 30 seconds max
        CACHE_CLEANUP_INTERVAL = 10000; // clean cache every 10 seconds
        this.throttle = new Throttle(MAX_UPDATE_FREQUENCY);
        this.parsedDocuments = new ParsedDocumentCache(CACHE_CLEANUP_INTERVAL, MAX_CACHE_ENTRY_AGE, parserOptions);
        this.bundledDocuments = new BundledDocumentCache(CACHE_CLEANUP_INTERVAL, MAX_CACHE_ENTRY_AGE, (document) => this.parsedDocuments.get(document), externalRefProvider);
        configuration_1.configuration.onDidChange(() => __awaiter(this, void 0, void 0, function* () {
            // when configuration is updated, re-bundle all bundled cache entries
            for (const entry of this.bundledDocuments.values()) {
                this.onChange(entry.document);
            }
        }));
    }
    get onDidChange() {
        return this._didChange.event;
    }
    get onDidActiveDocumentChange() {
        return this._didActiveDocumentChange.event;
    }
    getExternalRefDocumentProvider() {
        return this.externalRefProvider;
    }
    getDocumentVersion(document) {
        return document ? this.parsedDocuments.get(document).openApiVersion : types_1.OpenApiVersion.Unknown;
    }
    getParsedDocument(document) {
        return this.parsedDocuments.get(document).parsed;
    }
    getLastGoodParsedDocument(document) {
        return this.parsedDocuments.get(document).lastGoodParsed;
    }
    getDocumentBundle(document, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bundledDocuments.get(document, options);
        });
    }
    dispose() {
        this.parsedDocuments.dispose();
        this.bundledDocuments.dispose();
    }
    onDocumentChanged(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (isSupportedDocument(this.documentSelector, event.document)) {
                this.onChange(event.document);
            }
            else {
                this._didChange.fire(event.document);
            }
        });
    }
    onActiveEditorChanged(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            this._didActiveDocumentChange.fire(editor === null || editor === void 0 ? void 0 : editor.document);
            if (isSupportedDocument(this.documentSelector, editor === null || editor === void 0 ? void 0 : editor.document)) {
                this.onChange(editor.document);
            }
        });
    }
    onChange(document) {
        return __awaiter(this, void 0, void 0, function* () {
            this.throttle.throttle(document.uri.toString(), () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const updated = yield this.bundledDocuments.update(document);
                const aggregated = this.aggregateErrors(updated);
                this.showErrors(aggregated.successes, aggregated.failures, aggregated.errors);
                if (((_b = (_a = vscode.window) === null || _a === void 0 ? void 0 : _a.activeTextEditor) === null || _b === void 0 ? void 0 : _b.document) === document) {
                    this._didActiveDocumentChange.fire(document);
                }
                for (const { document } of updated) {
                    this._didChange.fire(document);
                }
            }));
        });
    }
    aggregateErrors(results) {
        const bundlingErrors = new Map();
        const bundlingSuccesses = new Set();
        const bundlingFailures = new Set();
        for (const { document, bundle } of results) {
            if (!bundle) {
                // failed to bundle, must be parsing errors in the relevant document
                bundlingFailures.add(document);
            }
            else if ("errors" in bundle) {
                // produced bundling result, but encountered errors when bundling
                for (const [uri, errors] of bundle.errors.entries()) {
                    const documentWithError = getBundleDocumentByUri(bundle, uri);
                    if (documentWithError) {
                        bundlingErrors.set(documentWithError, bundlingErrors.has(documentWithError)
                            ? [...bundlingErrors.get(documentWithError), ...errors]
                            : errors);
                    }
                    else {
                        console.error("Failed to find document containing the bundling error:", uri);
                    }
                }
            }
            else {
                // successfully bundled
                bundlingSuccesses.add(document);
                for (const document of bundle.documents.values()) {
                    bundlingSuccesses.add(document);
                }
            }
        }
        return { failures: bundlingFailures, errors: bundlingErrors, successes: bundlingSuccesses };
    }
    showErrors(bundlingSuccesses, bundlingFailures, bundlingErrors) {
        // clear errors for successfully bundled documents
        for (const document of bundlingSuccesses.values()) {
            this.diagnostics.delete(document.uri);
        }
        // clear errors for documents that failed to bundle
        // to clean previous bundling errors
        for (const document of bundlingFailures.values()) {
            this.diagnostics.delete(document.uri);
        }
        for (const [document, errors] of bundlingErrors.entries()) {
            const messages = new Map();
            for (const error of errors) {
                const entry = this.parsedDocuments.get(document);
                if (!entry.parsed) {
                    continue;
                }
                const node = (0, preserving_json_yaml_parser_1.find)(entry.parsed, error.pointer);
                const location = (0, preserving_json_yaml_parser_1.findLocationForJsonPointer)(entry.parsed, error.pointer);
                if (node !== undefined && location !== undefined) {
                    const position = document.positionAt(location.value.start);
                    const line = document.lineAt(position.line);
                    const range = new vscode.Range(new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex), new vscode.Position(position.line, line.range.end.character));
                    const message = error.message ? error.message : "Failed to resolve $ref";
                    const additionalProperties = {};
                    if (error.rejectedHost) {
                        additionalProperties.rejectedHost = error.rejectedHost;
                        additionalProperties.code = "rejected";
                    }
                    const existing = messages.get(error.pointer);
                    // allow only one message per pointer, allow EMISSINGPOINTER errors to be overriden
                    // by other error types
                    if (!existing || existing["resolverCode"] === "EMISSINGPOINTER") {
                        messages.set(error.pointer, Object.assign({ resolverCode: error.code, message,
                            range, severity: vscode.DiagnosticSeverity.Error }, additionalProperties));
                    }
                }
            }
            this.diagnostics.set(document.uri, [...messages.values()]);
        }
    }
}
exports.Cache = Cache;
function getBundleDocumentByUri(bundle, uri) {
    if (bundle.document.uri.toString() === uri) {
        return bundle.document;
    }
    for (const document of bundle.documents) {
        if (document.uri.toString() === uri) {
            return document;
        }
    }
}
function isSupportedDocument(selector, document) {
    return (document !== undefined &&
        vscode.languages.match(selector, document) > 0 &&
        document.uri.scheme !== "git");
}
//# sourceMappingURL=cache.js.map