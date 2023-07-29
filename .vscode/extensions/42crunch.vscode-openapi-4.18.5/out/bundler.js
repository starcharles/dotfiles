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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMapping = exports.bundle = exports.cacheParser = void 0;
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
const vscode = __importStar(require("vscode"));
const json_schema_ref_parser_1 = __importDefault(require("@xliic/json-schema-ref-parser"));
// @ts-ignore
const pointer_1 = __importDefault(require("@xliic/json-schema-ref-parser/lib/pointer"));
// @ts-ignore
const ref_1 = __importDefault(require("@xliic/json-schema-ref-parser/lib/ref"));
// @ts-ignore
const errors_1 = require("@xliic/json-schema-ref-parser/lib/util/errors");
const pointer_2 = require("./pointer");
const types_1 = require("./types");
const external_refs_1 = require("./external-refs");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const destinationMap = {
    [types_1.OpenApiVersion.V2]: {
        parameters: ["parameters"],
        schema: ["definitions"],
        responses: ["responses"],
    },
    [types_1.OpenApiVersion.V3]: {
        parameters: ["components", "parameters"],
        schema: ["components", "schemas"],
        responses: ["components", "responses"],
        examples: ["components", "examples"],
        requestBody: ["components", "requestBodies"],
        callbacks: ["components", "callbacks"],
        headers: ["components", "headers"],
        links: ["components", "links"],
    },
};
function refToUri(ref) {
    try {
        const uri = vscode.Uri.parse(ref, true);
        return (0, external_refs_1.toInternalUri)(uri);
    }
    catch (err) {
        throw new errors_1.ResolverError({
            message: `Failed to decode $ref: "${ref}: ${err.message}"`,
        });
    }
}
function checkApproval(approvedHosts, uri) {
    if ((0, external_refs_1.requiresApproval)(uri)) {
        const host = uri.authority;
        const approved = approvedHosts.some((approvedHostname) => approvedHostname.toLowerCase() === host.toLowerCase());
        if (!approved) {
            throw new errors_1.ResolverError({
                message: `Failed to resolve external reference, "${host}" is not in the list of approved hosts.`,
                code: `rejected:${host}`,
            }, uri.fsPath);
        }
    }
}
const resolver = (documentParser, state, approvedHosts, externalRefProvider) => {
    return {
        order: 10,
        canRead: (file) => {
            return true;
        },
        read: (file) => __awaiter(void 0, void 0, void 0, function* () {
            // file.url is already resolved uri, provided by json-schema-ref-parser
            const uri = refToUri(file.url);
            checkApproval(approvedHosts, uri);
            try {
                const document = yield vscode.workspace.openTextDocument(uri);
                const languageId = externalRefProvider.getLanguageId(uri);
                if (languageId) {
                    yield vscode.languages.setTextDocumentLanguage(document, languageId);
                }
                state.documents.add(document);
                return documentParser(document);
            }
            catch (err) {
                throw new errors_1.ResolverError({ message: `Error reading file "${file.url}: ${err.message}"` }, file.url);
            }
        }),
    };
};
exports.cacheParser = {
    order: 100,
    canParse: true,
    parse: ({ data, url, extension }) => {
        return new Promise((resolve, reject) => {
            resolve((0, preserving_json_yaml_parser_1.simpleClone)(data));
        });
    },
};
function mangle(value) {
    return value.replace(/[~\/\#:%]/g, "-");
}
function set(target, path, value) {
    const head = path.slice(0, -1);
    const last = path[path.length - 1];
    let current = target;
    for (const key of head) {
        if (!current[key]) {
            current[key] = {};
        }
        current = current[key];
    }
    // check if the destination already exist
    if (current[last]) {
        throw new Error(`Unable to merge, object already exists at path: #/${path.join("/")}/${last}`);
    }
    current[last] = value;
}
function hooks(document, state) {
    return {
        onRemap: (entry) => {
            const uri = (0, external_refs_1.toInternalUri)(vscode.Uri.parse(entry.file)).toString();
            const hashPath = pointer_1.default.parse(entry.hash);
            if (hashPath[0] == "components" && hashPath.length >= 3) {
                // TODO check that hashPath == 'schemas' or 'parameters', etc.
                let path = ["components", hashPath[1], mangle(entry.file) + "-" + hashPath[2]];
                if (hashPath.length > 3) {
                    path = path.concat(hashPath.slice(3));
                }
                set(state.parsed, path, entry.value);
                insertMapping(state.mapping, path, { uri, hash: entry.hash });
                return pointer_1.default.join("#", path);
            }
            else if ((hashPath[0] === "parameters" ||
                hashPath[0] === "definitions" ||
                hashPath[0] === "responses") &&
                hashPath.length >= 2) {
                let path = [hashPath[0], mangle(entry.file) + "-" + hashPath[1]];
                if (hashPath.length > 2) {
                    path = path.concat(hashPath.slice(2));
                }
                set(state.parsed, path, entry.value);
                insertMapping(state.mapping, path, { uri, hash: entry.hash });
                return pointer_1.default.join("#", path);
            }
            const path = pointer_1.default.parse(entry.pathFromRoot);
            if (state.version !== types_1.OpenApiVersion.Unknown) {
                const parentKey = path[path.length - 1];
                const grandparentKey = path[path.length - 2];
                const destinations = destinationMap[state.version];
                // @ts-ignore
                const destination = destinations[parentKey]
                    ? // @ts-ignore
                        destinations[parentKey]
                    : // @ts-ignore
                        destinations[grandparentKey]
                            ? // @ts-ignore
                                destinations[grandparentKey]
                            : null;
                if (destination) {
                    const ref = entry.$ref.$ref;
                    const mangled = mangle(ref);
                    const path = destination.concat([mangled]);
                    set(state.parsed, path, entry.value);
                    insertMapping(state.mapping, path, { uri, hash: entry.hash });
                    return pointer_1.default.join("#", path);
                }
            }
            insertMapping(state.mapping, path, { uri, hash: entry.hash });
            entry.$ref = entry.parent[entry.key] = ref_1.default.dereference(entry.$ref, entry.value);
        },
    };
}
function bundle(document, version, parsed, documentParser, approvedHosts, externalRefProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        const cloned = (0, preserving_json_yaml_parser_1.simpleClone)(parsed);
        const state = {
            version,
            parsed: cloned,
            mapping: { value: { uri: document.uri.toString(), hash: "" }, children: {} },
            documents: new Set(),
        };
        try {
            const bundled = yield json_schema_ref_parser_1.default.bundle(cloned, {
                cwd: document.uri.toString(),
                resolve: {
                    file: resolver(documentParser, state, approvedHosts, externalRefProvider),
                    http: false, // disable built in http resolver
                },
                parse: {
                    json: exports.cacheParser,
                    yaml: exports.cacheParser,
                },
                continueOnError: true,
                hooks: hooks(document, state),
            });
            return {
                document,
                value: bundled,
                mapping: state.mapping,
                documents: state.documents,
            };
        }
        catch (errors) {
            if (!errors.errors) {
                throw new Error(`Unexpected exception while bundling: ${errors}`);
            }
            return {
                errors: processErrors(errors.errors),
                document,
                documents: state.documents,
            };
        }
    });
}
exports.bundle = bundle;
function processErrors(errors) {
    var _a, _b;
    const result = new Map();
    for (const error of errors) {
        if (!((_a = error === null || error === void 0 ? void 0 : error.path) === null || _a === void 0 ? void 0 : _a.length)) {
            // skip no path and zero length path
            continue;
        }
        if (!result.has(error.source)) {
            result.set(error.source, []);
        }
        const errors = result.get(error.source);
        const filteredErrorPath = error.path.filter((segment) => segment !== null);
        const bundlingError = {
            pointer: (0, pointer_2.joinJsonPointer)([...filteredErrorPath, "$ref"]),
            message: error.message,
            code: error.code,
        };
        if (error.code === "ERESOLVER" && ((_b = error === null || error === void 0 ? void 0 : error.ioErrorCode) === null || _b === void 0 ? void 0 : _b.startsWith("rejected:"))) {
            bundlingError.rejectedHost = error.ioErrorCode.substring("rejected:".length);
        }
        errors.push(bundlingError);
    }
    return result;
}
function insertMapping(root, path, value) {
    let current = root;
    for (const segment of path) {
        if (!current.children[segment]) {
            current.children[segment] = { value: undefined, children: {} };
        }
        current = current.children[segment];
    }
    // TODO check that current.value is empty
    current.value = value;
}
function findMapping(root, pointer) {
    const path = (0, pointer_2.parseJsonPointer)(pointer);
    let current = root;
    let i = 0;
    for (; i < path.length && current.children[path[i]]; i++) {
        current = current.children[path[i]];
    }
    if (!current.value) {
        return undefined;
    }
    const { uri, hash } = current.value;
    if (hash) {
        if (i < path.length) {
            const remaining = path.slice(i, path.length);
            return { uri, hash: hash + (0, pointer_2.joinJsonPointer)(remaining) };
        }
    }
    return { uri, hash };
}
exports.findMapping = findMapping;
//# sourceMappingURL=bundler.js.map