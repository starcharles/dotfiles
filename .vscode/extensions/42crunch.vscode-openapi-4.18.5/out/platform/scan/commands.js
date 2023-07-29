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
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const extract_1 = require("../../util/extract");
exports.default = (cache, platformContext, store, view) => {
    vscode.commands.registerTextEditorCommand("openapi.platform.editorRunSingleOperationScan", (editor, edit, uri, path, method) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            yield editorRunSingleOperationScan(editor, edit, cache, store, view, uri, path, method);
        }
        catch (ex) {
            if (((_a = ex === null || ex === void 0 ? void 0 : ex.response) === null || _a === void 0 ? void 0 : _a.statusCode) === 409 &&
                ((_c = (_b = ex === null || ex === void 0 ? void 0 : ex.response) === null || _b === void 0 ? void 0 : _b.body) === null || _c === void 0 ? void 0 : _c.code) === 109 &&
                ((_e = (_d = ex === null || ex === void 0 ? void 0 : ex.response) === null || _d === void 0 ? void 0 : _d.body) === null || _e === void 0 ? void 0 : _e.message) === "limit reached") {
                vscode.window.showErrorMessage("You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account.");
            }
            else {
                vscode.window.showErrorMessage("Failed to scan: " + ex.message);
            }
        }
    }));
};
function editorRunSingleOperationScan(editor, edit, cache, store, view, uri, path, method) {
    return __awaiter(this, void 0, void 0, function* () {
        yield view.show();
        yield view.sendColorTheme(vscode.window.activeColorTheme);
        yield view.sendStartScan(editor.document);
        const bundle = yield cache.getDocumentBundle(editor.document);
        if (bundle && !("errors" in bundle)) {
            const oas = (0, extract_1.extractSinglePath)(path, bundle.value);
            const rawOas = (0, preserving_json_yaml_parser_1.stringify)(oas);
            const tmpApi = yield store.createTempApi(rawOas);
            const report = yield store.getAuditReport(tmpApi.apiId);
            if ((report === null || report === void 0 ? void 0 : report.data.openapiState) !== "valid") {
                yield store.clearTempApi(tmpApi);
                yield view.show();
                yield view.sendAuditError(editor.document, report.data, bundle.mapping);
                return;
            }
            yield store.createDefaultScanConfig(tmpApi.apiId);
            const configs = yield store.getScanConfigs(tmpApi.apiId);
            const isNewApi = configs[0].configuration !== undefined;
            const c = isNewApi
                ? yield store.readScanConfig(configs[0].configuration.id)
                : yield store.readScanConfig(configs[0].scanConfigurationId);
            const config = isNewApi
                ? JSON.parse(Buffer.from(c.file, "base64").toString("utf-8"))
                : JSON.parse(Buffer.from(c.scanConfiguration, "base64").toString("utf-8"));
            yield store.clearTempApi(tmpApi);
            if (config !== undefined) {
                view.setNewApi(isNewApi);
                yield view.show();
                yield view.sendScanOperation(editor.document, {
                    oas: oas,
                    rawOas: rawOas,
                    path: path,
                    method: method,
                    config,
                });
            }
        }
    });
}
//# sourceMappingURL=commands.js.map