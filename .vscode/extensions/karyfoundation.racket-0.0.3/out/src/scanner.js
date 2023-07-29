//
// Copyright 2016 Kary Foundation, Inc.
//   Author: Pouya Kary <k@karyfoundation.org>
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
"use strict";
//
// ─── IMPORT ─────────────────────────────────────────────────────────────────────
//
var vscode_1 = require('vscode');
//
// ─── EXPORTS ────────────────────────────────────────────────────────────────────
//
exports.provideSuggestions = {
    provideCompletionItems: provider
};
//
// ─── PROVIDER ───────────────────────────────────────────────────────────────────
//
function provider(document, position, token) {
    // context words                         
    var words = document.getText().split(/(?:(?:;(?:.)*|[\s\+\*\(\)\[\]]|"(?:(?:\\"|[^"]))*"))+/g);
    // suggestions
    var suggestions = new Array();
    // getting suggestions
    for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
        var word = words_1[_i];
        suggestions.push(new vscode_1.CompletionItem(word));
    }
    // done
    return suggestions;
}
// ────────────────────────────────────────────────────────────────────────────────
//# sourceMappingURL=scanner.js.map