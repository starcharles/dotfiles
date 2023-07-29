"use strict";
//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//
// You can provide your own test runner if you want to override it by exporting
// a function run(testRoot: string, clb: (error:Error) => void) that the extension
// host can call to run the tests. The test runner is expected to use console.log
// to report the results back to the caller. When the tests are finished, return
// a possible error to the callback or null if none.
Object.defineProperty(exports, "__esModule", { value: true });
const testRunner = require("vscode/lib/testrunner");
// You can directly control Mocha options by uncommenting the following lines
// See https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options for more info
let config = {
    ui: 'tdd',
    useColors: true,
    timeout: 60000
};
testRunner.configure(config);
module.exports = testRunner;
//# sourceMappingURL=index.js.map