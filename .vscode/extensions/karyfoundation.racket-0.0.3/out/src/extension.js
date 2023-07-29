//
// Copyright 2017 Kary Foundation, Inc.
//   Author: Pouya Kary <k@karyfoundation.org>
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
"use strict";
//
// ─── IMPORTS ────────────────────────────────────────────────────────────────────
//
const vscode = require('vscode');
//
// ─── COMPILED REGEXPS ───────────────────────────────────────────────────────────
//
// ./orchestras/space-between-identifiers.orchestra
const identifierFinder = /(?:(?:;(?:.)*|[\s\+\*\(\)\[\]]|"(?:(?:\\"|[^"]))*"))+/g;
const trashMatcher = /^[:#]+$/g;
//
// ─── ACTIVATION FUNCTION ────────────────────────────────────────────────────────
//
function activate(context) {
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('racket', provideSuggestions, '.'));
}
exports.activate = activate;
//
// ─── DEACTIVATION ───────────────────────────────────────────────────────────────
//
function deactivate() {
    // nothing goes here
}
exports.deactivate = deactivate;
//
// ─── EXPORTS ────────────────────────────────────────────────────────────────────
//
const provideSuggestions = {
    provideCompletionItems: provider
};
//
// ─── PROVIDER ───────────────────────────────────────────────────────────────────
//
function provider(document, position, token) {
    // context words                         
    const words = document
        .getText()
        .split(identifierFinder);
    // suggestions
    let suggestions = new Array();
    // getting suggestions
    for (const word of words) {
        const suggestion = createSuggestion(word);
        if (suggestion !== null)
            suggestions.push(suggestion);
    }
    // done
    return suggestions;
}
//
// ─── CREATE SUGGESTION ──────────────────────────────────────────────────────────
//
function createSuggestion(word) {
    if (!trashMatcher.test(word)) {
        const suggestion = new vscode.CompletionItem(word);
        if (word.startsWith('#')) {
            suggestion.kind = vscode.CompletionItemKind.Enum;
            suggestion.insertText = word.replace(/^[#:]+/, '');
        }
        else {
            suggestion.kind = vscode.CompletionItemKind.Variable;
        }
        return suggestion;
    }
    else {
        return null;
    }
}
// ────────────────────────────────────────────────────────────────────────────────
//# sourceMappingURL=extension.js.map