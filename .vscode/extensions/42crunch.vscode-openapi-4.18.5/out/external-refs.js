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
exports.registerAddApprovedHost = exports.ApproveHostnameAction = exports.ExternalRefDocumentProvider = exports.fromInternalUri = exports.toInternalUri = exports.requiresApproval = exports.INTERNAL_SCHEMES = void 0;
const vscode = __importStar(require("vscode"));
const got_1 = __importDefault(require("got"));
const configuration_1 = require("./configuration");
exports.INTERNAL_SCHEMES = {
    http: "openapi-internal-http",
    https: "openapi-internal-https",
};
const CONTENT_TYPES = {
    "application/json": "json",
    "application/x-yaml": "yaml",
    "text/yaml": "yaml",
};
const EXTENSIONS = {
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
};
function requiresApproval(internalUri) {
    var _a;
    return Object.values(exports.INTERNAL_SCHEMES).includes((_a = internalUri.scheme) === null || _a === void 0 ? void 0 : _a.toLowerCase());
}
exports.requiresApproval = requiresApproval;
function toInternalUri(uri) {
    const scheme = exports.INTERNAL_SCHEMES[uri.scheme];
    if (scheme) {
        return uri.with({ scheme });
    }
    return uri;
}
exports.toInternalUri = toInternalUri;
function fromInternalUri(uri) {
    for (const [external, internal] of Object.entries(exports.INTERNAL_SCHEMES)) {
        if (uri.scheme === internal) {
            return uri.with({ scheme: external });
        }
    }
    return uri;
}
exports.fromInternalUri = fromInternalUri;
function getLanguageId(uri, contentType) {
    const fromContentType = contentType && CONTENT_TYPES[contentType.toLowerCase()];
    if (fromContentType) {
        return fromContentType;
    }
    for (const [extension, language] of Object.entries(EXTENSIONS)) {
        if (uri.toLowerCase().endsWith(extension)) {
            return language;
        }
    }
    return undefined;
}
class ExternalRefDocumentProvider {
    constructor() {
        this.cache = {};
    }
    getLanguageId(uri) {
        const actualUri = fromInternalUri(uri);
        return this.cache[actualUri.toString()];
    }
    provideTextDocumentContent(uri, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const approvedHosts = configuration_1.configuration.get("approvedHostnames");
            const approved = approvedHosts.some((approvedHostname) => approvedHostname.toLowerCase() === uri.authority.toLowerCase());
            if (!approved) {
                throw new Error(`Hostname ${uri.authority}" is not in the list of approved hosts`);
            }
            const actualUri = fromInternalUri(uri);
            const { body, headers } = yield (0, got_1.default)(actualUri.toString());
            const languageId = getLanguageId(actualUri.toString(), headers["content-type"]);
            if (languageId) {
                this.cache[actualUri.toString()] = languageId;
            }
            try {
                if (languageId === "json") {
                    return JSON.stringify(JSON.parse(body), null, 2);
                }
            }
            catch (ex) {
                // ignore
            }
            return body;
        });
    }
}
exports.ExternalRefDocumentProvider = ExternalRefDocumentProvider;
class ApproveHostnameAction {
    provideCodeActions(document, range, context, token) {
        const result = [];
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.code === "rejected" && "rejectedHost" in diagnostic) {
                const hostname = diagnostic["rejectedHost"];
                const title = `Add "${hostname}" to the list of approved hostnames`;
                const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
                action.command = {
                    arguments: [diagnostic["rejectedHost"]],
                    command: "openapi.addApprovedHost",
                    title,
                };
                action.diagnostics = [diagnostic];
                action.isPreferred = true;
                result.push(action);
            }
        }
        return result;
    }
}
ApproveHostnameAction.providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
exports.ApproveHostnameAction = ApproveHostnameAction;
function registerAddApprovedHost(context) {
    return vscode.commands.registerCommand("openapi.addApprovedHost", (hostname) => {
        const approved = configuration_1.configuration.get("approvedHostnames");
        if (!approved.includes(hostname.toLocaleLowerCase()))
            configuration_1.configuration.update("approvedHostnames", [...approved, hostname.toLocaleLowerCase()], vscode.ConfigurationTarget.Global);
    });
}
exports.registerAddApprovedHost = registerAddApprovedHost;
//# sourceMappingURL=external-refs.js.map