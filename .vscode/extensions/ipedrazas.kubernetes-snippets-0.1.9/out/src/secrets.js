'use strict';
var vscode = require('vscode');
var Window = vscode.window;
var Range = vscode.Range;
function activate(context) {
    var encode = vscode.commands.registerCommand('secrets.base64Encode', function () {
        var editor = Window.activeTextEditor;
        var doc = editor.document;
        var selection = editor.selections;
        base64Encode(editor, doc, selection);
    });
    var decode = vscode.commands.registerCommand('secrets.base64Decode', function () {
        var editor = Window.activeTextEditor;
        var doc = editor.document;
        var selection = editor.selections;
        base64Decode(editor, doc, selection);
    });
    context.subscriptions.push(encode);
}
exports.activate = activate;
// Encode - string to Base64
function base64Encode(editor, doc, sel) {
    for (var i in sel) {
        editor.edit(function (edit) {
            var txt = doc.getText(new Range(sel[i].start, sel[i].end));
            var buffer = new Buffer(txt);
            edit.replace(sel[i], buffer.toString('base64'));
        });
    }
}
// Decode - Base64 to string
function base64Decode(editor, doc, sel) {
    for (var i in sel) {
        editor.edit(function (edit) {
            var txt = doc.getText(new Range(sel[i].start, sel[i].end));
            var buffer = new Buffer(txt, 'base64');
            edit.replace(sel[i], buffer.toString());
        });
    }
}
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=secrets.js.map