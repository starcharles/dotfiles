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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCollectionNamingConventionInputBoxOptions = exports.createApiNamingConventionInputBoxOptions = exports.makeIcon = exports.getApiId = exports.makePlatformUri = exports.isPlatformUri = exports.confirmed = void 0;
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const types_1 = require("./types");
function confirmed(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        const confirmation = yield vscode.window.showInformationMessage(prompt, "Yes", "Cancel");
        return confirmation && confirmation === "Yes";
    });
}
exports.confirmed = confirmed;
function isPlatformUri(uri) {
    return uri.scheme === types_1.platformUriScheme;
}
exports.isPlatformUri = isPlatformUri;
function makePlatformUri(apiId) {
    return vscode.Uri.parse(`${types_1.platformUriScheme}://42crunch.com/apis/${apiId}.json`);
}
exports.makePlatformUri = makePlatformUri;
function getApiId(uri) {
    if (isPlatformUri(uri)) {
        const apiId = path_1.default.basename(uri.fsPath, ".json");
        return apiId;
    }
}
exports.getApiId = getApiId;
function makeIcon(extensionUri, icon) {
    if (typeof icon === "string") {
        return new vscode.ThemeIcon(icon);
    }
    return {
        light: vscode.Uri.parse(extensionUri.toString() + `/resources/light/${icon.light}.svg`),
        dark: vscode.Uri.parse(extensionUri.toString() + `/resources/dark/${icon.dark}.svg`),
    };
}
exports.makeIcon = makeIcon;
function createNamingConventionInputBoxOptions(convention, defaultPattern) {
    const { pattern, description, example } = convention;
    const prompt = example !== "" ? `Example: ${example}` : undefined;
    return {
        prompt,
        validateInput: (input) => {
            if (pattern !== "" && !input.match(pattern)) {
                return `The input does not match the expected pattern "${description}" defined in your organization. Example of the expected value: "${example}"`;
            }
            if (!input.match(defaultPattern)) {
                return `The input does not match the expected pattern "${defaultPattern}"`;
            }
        },
    };
}
function createApiNamingConventionInputBoxOptions(convention) {
    return createNamingConventionInputBoxOptions(convention, "^[\\w _.-]{1,64}$");
}
exports.createApiNamingConventionInputBoxOptions = createApiNamingConventionInputBoxOptions;
function createCollectionNamingConventionInputBoxOptions(convention) {
    return createNamingConventionInputBoxOptions(convention, "^[\\w _.\\/:-]{1,2048}$");
}
exports.createCollectionNamingConventionInputBoxOptions = createCollectionNamingConventionInputBoxOptions;
//# sourceMappingURL=util.js.map