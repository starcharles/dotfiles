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
exports.deriveServices = exports.saveConfig = exports.loadConfig = void 0;
const vscode = __importStar(require("vscode"));
function loadConfig(configuration, secrets) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const platformUrl = configuration.get("platformUrl");
        const apiToken = (_a = (yield secrets.get("platformApiToken"))) !== null && _a !== void 0 ? _a : "";
        const insecureSslHostnames = configuration.get("tryit.insecureSslHostnames");
        const platformServices = configuration.get("platformServices");
        const scandManager = configuration.get("platformScandManager");
        const docker = configuration.get("docker");
        const scanRuntime = configuration.get("platformConformanceScanRuntime");
        const scanImage = configuration.get("platformConformanceScanImage");
        const scandManagerHeader = yield secrets.get("platformScandManagerHeader");
        return {
            platformUrl,
            platformApiToken: apiToken,
            insecureSslHostnames,
            platformServices: {
                source: platformServices === "" ? "auto" : "manual",
                manual: platformServices,
                auto: deriveServices(platformUrl),
            },
            scandManager: Object.assign(Object.assign({}, scandManager), { header: scandManagerHeader !== undefined ? JSON.parse(scandManagerHeader) : { name: "", value: "" } }),
            scanRuntime,
            scanImage,
            docker,
            platform: process.platform,
        };
    });
}
exports.loadConfig = loadConfig;
function saveConfig(config, configuration, secrets) {
    return __awaiter(this, void 0, void 0, function* () {
        yield configuration.update("platformUrl", config.platformUrl, vscode.ConfigurationTarget.Global);
        if (config.platformServices.source === "auto") {
            yield configuration.update("platformServices", "", vscode.ConfigurationTarget.Global);
        }
        else {
            yield configuration.update("platformServices", config.platformServices.manual, vscode.ConfigurationTarget.Global);
        }
        yield configuration.update("platformScandManager", config.scandManager, vscode.ConfigurationTarget.Global);
        yield configuration.update("docker", config.docker, vscode.ConfigurationTarget.Global);
        yield configuration.update("platformConformanceScanRuntime", config.scanRuntime, vscode.ConfigurationTarget.Global);
        yield configuration.update("platformConformanceScanImage", config.scanImage, vscode.ConfigurationTarget.Global);
        // secrets
        yield secrets.store("platformApiToken", config.platformApiToken);
        if (config.scandManager.auth == "header") {
            yield secrets.store("platformScandManagerHeader", JSON.stringify(config.scandManager.header));
        }
    });
}
exports.saveConfig = saveConfig;
function deriveServices(platformUrl) {
    const platformHost = vscode.Uri.parse(platformUrl).authority;
    if (platformHost.toLowerCase().startsWith("platform")) {
        return platformHost.replace(/^platform/i, "services") + ":8001";
    }
    return "services." + platformHost + ":8001";
}
exports.deriveServices = deriveServices;
//# sourceMappingURL=config.js.map