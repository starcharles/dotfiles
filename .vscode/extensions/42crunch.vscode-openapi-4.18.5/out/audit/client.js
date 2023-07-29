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
exports.audit = exports.requestToken = exports.getArticles = void 0;
const vscode = __importStar(require("vscode"));
const got_1 = __importDefault(require("got"));
const form_data_1 = __importDefault(require("form-data"));
const ASSESS_URL = "https://stateless.42crunch.com/api/v1/anon/assess/vscode";
const TOKEN_URL = "https://stateless.42crunch.com/api/v1/anon/token";
const ARTICLES_URL = "https://platform.42crunch.com/kdb/audit-with-yaml.json";
let cachedArticles = undefined;
function getArticles() {
    return __awaiter(this, void 0, void 0, function* () {
        if (cachedArticles === undefined) {
            cachedArticles = downloadArticles();
        }
        return cachedArticles;
    });
}
exports.getArticles = getArticles;
function downloadArticles() {
    return __awaiter(this, void 0, void 0, function* () {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Loading API Contract Security Audit KDB Articles...",
            cancellable: false,
        }, (progress, cancellationToken) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield (0, got_1.default)(ARTICLES_URL);
                return JSON.parse(response.body);
            }
            catch (error) {
                throw new Error(`Failed to read articles.json: ${error}`);
            }
        }));
    });
}
function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
function requestToken(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, got_1.default)(TOKEN_URL, {
            method: "POST",
            form: { email },
            headers: {
                Accept: "application/json",
            },
        });
        return JSON.parse(response.body);
    });
}
exports.requestToken = requestToken;
function submitAudit(text, apiToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const form = new form_data_1.default();
        form.append("specfile", text, {
            filename: "swagger.json",
            contentType: "application/json",
        });
        const response = yield (0, got_1.default)(ASSESS_URL, {
            method: "POST",
            body: form,
            headers: {
                Accept: "application/json",
                "X-API-TOKEN": apiToken,
            },
        });
        return JSON.parse(response.body);
    });
}
function retryAudit(token, apiToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, got_1.default)(`ASSESS_URL?token=${token}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-API-TOKEN": apiToken,
            },
        });
        return JSON.parse(response.body);
    });
}
function audit(text, apiToken, progress) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = yield submitAudit(text, apiToken);
        if (result.status === "IN_PROGRESS") {
            for (let attempt = 0; attempt < 20; attempt++) {
                yield delay(5000);
                if (attempt === 2) {
                    progress.report({
                        message: "Processing takes longer than expected, please wait...",
                    });
                }
                const retry = yield retryAudit(result.token, apiToken);
                if (retry.status === "PROCESSED") {
                    result = retry;
                    break;
                }
            }
        }
        if (result.status === "PROCESSED") {
            return result.report;
        }
        throw new Error("Failed to retrieve audit result");
    });
}
exports.audit = audit;
//# sourceMappingURL=client.js.map