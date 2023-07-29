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
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const path_1 = require("path");
const vscode = __importStar(require("vscode"));
const bundler_1 = require("../bundler");
const pointer_1 = require("../pointer");
const types_1 = require("../types");
function securitySchemes(issue, fix, parameter, version, bundle, document) {
    var _a, _b, _c;
    if ("errors" in bundle) {
        return [];
    }
    if (version !== types_1.OpenApiVersion.Unknown && bundle.value) {
        if (version === types_1.OpenApiVersion.V2 && ((_a = bundle.value) === null || _a === void 0 ? void 0 : _a.securityDefinitions)) {
            return Object.keys(bundle.value.securityDefinitions);
        }
        else if (version === types_1.OpenApiVersion.V3 && ((_c = (_b = bundle.value) === null || _b === void 0 ? void 0 : _b.components) === null || _c === void 0 ? void 0 : _c.securitySchemes)) {
            return Object.keys(bundle.value.components.securitySchemes);
        }
    }
    return [];
}
function mostUsedByName(issue, fix, parameter, version, bundle, document) {
    const propertyHints = buildPropertyHints(bundle);
    const issuePointer = (0, pointer_1.parseJsonPointer)(issue.pointer);
    const parameterPointer = (0, pointer_1.parseJsonPointer)(parameter.path);
    const name = issuePointer[issuePointer.length - 1];
    const property = parameterPointer[parameterPointer.length - 1];
    if (propertyHints[name] && propertyHints[name][property] !== undefined) {
        return [propertyHints[name][property]];
    }
    return [];
}
function relativeReference(base, mapping) {
    const target = vscode.Uri.parse(mapping.uri);
    const hash = mapping.hash === "#" ? "" : mapping.hash;
    if (base.scheme !== target.scheme || base.authority !== target.authority) {
        return `${mapping.uri}${hash}`;
    }
    const relative = path_1.posix.relative(path_1.posix.dirname(base.path), target.path);
    return `${relative}${hash}`;
}
function schemaRefByResponseCode(issue, fix, parameter, version, bundle, document) {
    const schemaRefs = buildSchemaRefByResponseCode(version, bundle);
    // FIXME maybe should account for fix.path?
    const path = [...(0, pointer_1.parseJsonPointer)(issue.pointer), ...(0, pointer_1.parseJsonPointer)(parameter.path)].reverse();
    const code = version === types_1.OpenApiVersion.V2 ? path[2] : path[4];
    if (code && schemaRefs[code]) {
        const mapping = schemaRefs[code];
        return [relativeReference(document.uri, mapping)];
    }
    return [];
}
function buildSchemaRefByResponseCode(version, bundled) {
    var _a, _b, _c, _d, _e, _f;
    if ("errors" in bundled) {
        return [];
    }
    const hints = {};
    const paths = (_a = bundled.value["paths"]) !== null && _a !== void 0 ? _a : {};
    for (const path of Object.keys(paths)) {
        for (const operation of Object.values(paths[path])) {
            const responses = (_b = operation["responses"]) !== null && _b !== void 0 ? _b : {};
            for (const [code, response] of Object.entries(responses)) {
                const ref = version == types_1.OpenApiVersion.V2
                    ? (_c = response === null || response === void 0 ? void 0 : response["schema"]) === null || _c === void 0 ? void 0 : _c["$ref"]
                    : (_f = (_e = (_d = response === null || response === void 0 ? void 0 : response["content"]) === null || _d === void 0 ? void 0 : _d["application/json"]) === null || _e === void 0 ? void 0 : _e["schema"]) === null || _f === void 0 ? void 0 : _f["$ref"];
                if (ref) {
                    const mapping = (0, bundler_1.findMapping)(bundled.mapping, ref) || {
                        uri: bundled.mapping.value.uri,
                        hash: ref,
                    };
                    if (!hints[code]) {
                        hints[code] = [];
                    }
                    hints[code].push(mapping);
                }
            }
        }
    }
    for (const code of Object.keys(hints)) {
        hints[code] = mode(hints[code]);
    }
    return hints;
}
function buildPropertyHints(bundled) {
    const hints = {};
    // TODO: boost perfomance
    if (!("errors" in bundled)) {
        walk(bundled, null, [], (parent, path, key, value) => {
            // TODO check items for arrays
            if (path.length > 3 && path[1] === "properties") {
                const property = path[0];
                if (!hints[property]) {
                    hints[property] = {};
                }
                if (!hints[property][key]) {
                    hints[property][key] = [];
                }
                hints[property][key].push(value);
            }
        });
        // update hints replacing arrays of occurences of values
        // with most frequent value in the array
        for (const property of Object.keys(hints)) {
            for (const key of Object.keys(hints[property])) {
                hints[property][key] = mode(hints[property][key]);
            }
        }
    }
    return hints;
}
function walk(current, parent, path, visitor) {
    for (const key of Object.keys(current)) {
        const value = current[key];
        if (typeof value === "object" && value !== null) {
            walk(value, current, [key, ...path], visitor);
        }
        else {
            visitor(parent, path, key, value);
        }
    }
}
function mode(arr) {
    return arr
        .sort((a, b) => arr.filter((v) => v === a).length - arr.filter((v) => v === b).length)
        .pop();
}
const SOURCES = {
    securitySchemes,
    mostUsedByName,
    schemaRefByResponseCode,
};
exports.default = SOURCES;
//# sourceMappingURL=quickfix-sources.js.map