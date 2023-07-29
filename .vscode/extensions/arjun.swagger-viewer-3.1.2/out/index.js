"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const PreviewClient = require("./preview/client");
function activate(context) {
    PreviewClient.activate(context);
}
exports.activate = activate;
function deactivate() {
    PreviewClient.deactivate();
}
exports.deactivate = deactivate;
//# sourceMappingURL=index.js.map