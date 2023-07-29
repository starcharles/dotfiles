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
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePlatformUser = exports.configureCredentials = exports.getPlatformCredentials = exports.getAnondCredentials = exports.hasCredentials = void 0;
const vscode = __importStar(require("vscode"));
const client_1 = require("./audit/client");
const config_1 = require("./util/config");
function hasCredentials(configuration, secrets) {
    return __awaiter(this, void 0, void 0, function* () {
        if (getAnondCredentials(configuration)) {
            return "anond";
        }
        const platform = yield getPlatformCredentials(configuration, secrets);
        if (platform !== undefined) {
            return "platform";
        }
        return undefined;
    });
}
exports.hasCredentials = hasCredentials;
function getAnondCredentials(configuration) {
    return configuration.get("securityAuditToken");
}
exports.getAnondCredentials = getAnondCredentials;
function getPlatformCredentials(configuration, secrets) {
    return __awaiter(this, void 0, void 0, function* () {
        const platformUrl = configuration.get("platformUrl");
        const services = configuration.get("platformServices");
        const apiToken = yield secrets.get("platformApiToken");
        if (platformUrl && apiToken) {
            // favour services specified in the configuration, else try
            // to derive services from the platformUrl
            if (services) {
                return {
                    platformUrl,
                    services,
                    apiToken,
                };
            }
            return {
                platformUrl,
                services: (0, config_1.deriveServices)(platformUrl),
                apiToken,
            };
        }
    });
}
exports.getPlatformCredentials = getPlatformCredentials;
function configureCredentials(configuration, secrets) {
    return __awaiter(this, void 0, void 0, function* () {
        const userType = yield chooseNewOrExisting();
        if (userType === "existing") {
            return (yield configurePlatformUser(configuration, secrets)) ? "platform" : undefined;
        }
        else if (userType === "new") {
            return (yield configureAnondUser(configuration)) ? "anond" : undefined;
        }
        return undefined;
    });
}
exports.configureCredentials = configureCredentials;
function chooseNewOrExisting() {
    return __awaiter(this, void 0, void 0, function* () {
        const options = [
            "I have an existing 42Crunch Platform account",
            "I'm a new user, please email me the token",
        ];
        const response = yield vscode.window.showInformationMessage("VS Code needs an API key to use the service.", {
            detail: "42Crunch Audit runs 300+ checks for security best practices in your API. Use your existing platform credentials or provide an email to receive a freemium token.",
            modal: true,
        }, ...options);
        if (response === options[0]) {
            return "existing";
        }
        if (response === options[1]) {
            return "new";
        }
        return undefined;
    });
}
function configureAnondUser(configuration) {
    return __awaiter(this, void 0, void 0, function* () {
        const email = yield vscode.window.showInputBox({
            prompt: "Enter your email to receive the token.",
            ignoreFocusOut: true,
            placeHolder: "email address",
            validateInput: (value) => value.indexOf("@") > 0 && value.indexOf("@") < value.length - 1
                ? null
                : "Please enter valid email address",
        });
        if (!email) {
            return false;
        }
        const tokenRequestResult = yield vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Requesting token" }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield (0, client_1.requestToken)(email);
            }
            catch (e) {
                vscode.window.showErrorMessage("Unexpected error when trying to request token: " + e);
            }
        }));
        if (!tokenRequestResult || tokenRequestResult.status !== "success") {
            return false;
        }
        const token = yield vscode.window.showInputBox({
            prompt: "The token has been sent. If you don't get the mail within a couple minutes, check your spam folder and that the address is correct. Paste the token above.",
            ignoreFocusOut: true,
            placeHolder: "token",
        });
        if (!token) {
            return false;
        }
        yield configuration.update("securityAuditToken", token, vscode.ConfigurationTarget.Global);
        return true;
    });
}
function configurePlatformUser(configuration, secrets) {
    return __awaiter(this, void 0, void 0, function* () {
        const platformUrl = yield vscode.window.showInputBox({
            prompt: "Enter 42Crunch platform URL",
            placeHolder: "platform url",
            value: "https://platform.42crunch.com/",
            ignoreFocusOut: true,
            validateInput: (input) => {
                try {
                    const url = vscode.Uri.parse(input, true);
                    if (url.scheme !== "https") {
                        return 'URL scheme must be "https"';
                    }
                    if (!url.authority) {
                        return "URL authority must not be empty";
                    }
                    if (url.path != "/") {
                        return "URL path must be empty";
                    }
                }
                catch (ex) {
                    return `${ex}`;
                }
            },
        });
        if (!platformUrl) {
            return false;
        }
        const UUID_REGEX = /^(ide_|api_)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const token = yield vscode.window.showInputBox({
            prompt: "Enter 42Crunch IDE token",
            placeHolder: "IDE Token",
            ignoreFocusOut: true,
            validateInput: (input) => {
                if (!input || !input.match(UUID_REGEX)) {
                    return "Must be a valid IDE Token";
                }
            },
        });
        if (!token) {
            return false;
        }
        yield configuration.update("platformUrl", vscode.Uri.parse(platformUrl).toString(), vscode.ConfigurationTarget.Global);
        yield secrets.store("platformApiToken", token);
        return true;
    });
}
exports.configurePlatformUser = configurePlatformUser;
//# sourceMappingURL=credentials.js.map