"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixType = exports.OpenApiVersion = exports.extensionQualifiedId = exports.configId = void 0;
exports.configId = "openapi";
exports.extensionQualifiedId = "42Crunch.vscode-openapi";
var OpenApiVersion;
(function (OpenApiVersion) {
    OpenApiVersion[OpenApiVersion["Unknown"] = 0] = "Unknown";
    OpenApiVersion[OpenApiVersion["V2"] = 1] = "V2";
    OpenApiVersion[OpenApiVersion["V3"] = 2] = "V3";
})(OpenApiVersion = exports.OpenApiVersion || (exports.OpenApiVersion = {}));
var FixType;
(function (FixType) {
    FixType["Insert"] = "insert";
    FixType["Replace"] = "replace";
    FixType["Delete"] = "delete";
    FixType["RegexReplace"] = "regex-replace";
    FixType["RenameKey"] = "renameKey";
})(FixType = exports.FixType || (exports.FixType = {}));
//# sourceMappingURL=types.js.map