'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const zigCompilerProvider_1 = require("./zigCompilerProvider");
const zigBuild_1 = require("./zigBuild");
const zigFormat_1 = require("./zigFormat");
const ZIG_MODE = { language: 'zig', scheme: 'file' };
exports.logChannel = vscode.window.createOutputChannel('zig');
exports.zigFormatStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
function activate(context) {
    let compiler = new zigCompilerProvider_1.default();
    compiler.activate(context.subscriptions);
    vscode.languages.registerCodeActionsProvider('zig', compiler);
    context.subscriptions.push(exports.logChannel);
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(ZIG_MODE, new zigFormat_1.ZigFormatProvider(exports.logChannel)));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(ZIG_MODE, new zigFormat_1.ZigRangeFormatProvider(exports.logChannel)));
    exports.buildDiagnosticCollection = vscode.languages.createDiagnosticCollection('zig');
    context.subscriptions.push(exports.buildDiagnosticCollection);
    // Commands
    context.subscriptions.push(vscode.commands.registerCommand('zig.build.workspace', () => zigBuild_1.zigBuild()));
    context.subscriptions.push(vscode.commands.registerCommand('zig.format.file', () => console.log('test')));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map