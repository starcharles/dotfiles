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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = void 0;
const vscode = __importStar(require("vscode"));
const misc_1 = __importDefault(require("./commands/misc"));
const util_1 = __importDefault(require("./commands/util"));
const create_api_1 = __importDefault(require("./commands/create-api"));
const filter_1 = __importDefault(require("./commands/filter"));
const report_1 = __importDefault(require("./commands/report"));
const commands_1 = __importDefault(require("./data-dictionary/commands"));
function registerCommands(context, platformContext, auditContext, store, favorites, importedUrls, cache, provider, tree, reportWebView, dataDictionaryView, dataDictionaryDiagnostics) {
    const commands = {};
    Object.assign(commands, (0, misc_1.default)(store, favorites, provider, tree));
    Object.assign(commands, (0, util_1.default)(context, store));
    Object.assign(commands, (0, create_api_1.default)(store, importedUrls, provider, tree, cache));
    Object.assign(commands, (0, filter_1.default)(store, provider));
    Object.assign(commands, (0, report_1.default)(store, context, auditContext, cache, reportWebView));
    Object.assign(commands, (0, commands_1.default)(cache, platformContext, store, dataDictionaryView, dataDictionaryDiagnostics));
    return Object.keys(commands).map((name) => {
        const handler = commands[name];
        const id = `openapi.platform.${name}`;
        if (name.startsWith("editor")) {
            return vscode.commands.registerTextEditorCommand(id, handler);
        }
        return vscode.commands.registerCommand(id, handler);
    });
}
exports.registerCommands = registerCommands;
//# sourceMappingURL=commands.js.map