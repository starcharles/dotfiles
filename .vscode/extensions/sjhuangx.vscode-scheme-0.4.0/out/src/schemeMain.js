"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const schemeConfiguration_1 = require("./schemeConfiguration");
function activate(ctx) {
    ctx.subscriptions.push(vscode.languages.setLanguageConfiguration('scheme', schemeConfiguration_1.configuration));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=schemeMain.js.map