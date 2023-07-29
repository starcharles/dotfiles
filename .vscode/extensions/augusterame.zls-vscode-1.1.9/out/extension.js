"use strict";
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
exports.deactivate = exports.activate = void 0;
const vscode_1 = require("vscode");
const vscode = require("vscode");
const node_1 = require("vscode-languageclient/node");
const axios_1 = require("axios");
const os = require("os");
const fs = require("fs");
const path = require("path");
const which = require("which");
const mkdirp = require("mkdirp");
const child_process = require("child_process");
let outputChannel;
let client = null;
const downloadsRoot = "https://zig.pm/zls/downloads";
/* eslint-disable @typescript-eslint/naming-convention */
var InstallationName;
(function (InstallationName) {
    InstallationName["x86_linux"] = "x86-linux";
    InstallationName["x86_windows"] = "x86-windows";
    InstallationName["x86_64_linux"] = "x86_64-linux";
    InstallationName["x86_64_macos"] = "x86_64-macos";
    InstallationName["x86_64_windows"] = "x86_64-windows";
    InstallationName["arm_64_macos"] = "aarch64-macos";
})(InstallationName || (InstallationName = {}));
/* eslint-enable @typescript-eslint/naming-convention */
function getDefaultInstallationName() {
    // NOTE: Not using a JS switch because they're ugly as hell and clunky :(
    const plat = process.platform;
    const arch = process.arch;
    if (arch === "ia32") {
        if (plat === "linux")
            return InstallationName.x86_linux;
        else if (plat === "win32")
            return InstallationName.x86_windows;
    }
    else if (arch === "x64") {
        if (plat === "linux")
            return InstallationName.x86_64_linux;
        else if (plat === "darwin")
            return InstallationName.x86_64_macos;
        else if (plat === "win32")
            return InstallationName.x86_64_windows;
    }
    else if (arch === "arm64") {
        if (plat === "darwin")
            return InstallationName.arm_64_macos;
    }
    return null;
}
function installExecutable(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const def = getDefaultInstallationName();
        if (!def) {
            vscode_1.window.showInformationMessage(`Your system isn't built by our CI!\nPlease follow the instructions [here](https://github.com/zigtools/zls#from-source) to get started!`);
            return null;
        }
        return vscode_1.window.withProgress({
            title: "Installing zls...",
            location: vscode.ProgressLocation.Notification,
        }, (progress) => __awaiter(this, void 0, void 0, function* () {
            progress.report({ message: "Downloading zls executable..." });
            const exe = (yield axios_1.default.get(`${downloadsRoot}/${def}/bin/zls${def.endsWith("windows") ? ".exe" : ""}`, {
                responseType: "arraybuffer"
            })).data;
            progress.report({ message: "Installing..." });
            const installDir = vscode.Uri.joinPath(context.globalStorageUri, "zls_install");
            if (!fs.existsSync(installDir.fsPath))
                mkdirp.sync(installDir.fsPath);
            const zlsBinPath = vscode.Uri.joinPath(installDir, `zls${def.endsWith("windows") ? ".exe" : ""}`).fsPath;
            fs.writeFileSync(zlsBinPath, exe, "binary");
            fs.chmodSync(zlsBinPath, 0o755);
            let config = vscode_1.workspace.getConfiguration("zls");
            yield config.update("path", zlsBinPath, true);
            return zlsBinPath;
        }));
    });
}
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        outputChannel = vscode_1.window.createOutputChannel("Zig Language Server");
        vscode.commands.registerCommand("zls.install", () => __awaiter(this, void 0, void 0, function* () {
            yield stopClient();
            yield installExecutable(context);
        }));
        vscode.commands.registerCommand("zls.stop", () => __awaiter(this, void 0, void 0, function* () {
            yield stopClient();
        }));
        vscode.commands.registerCommand("zls.startRestart", () => __awaiter(this, void 0, void 0, function* () {
            yield stopClient();
            yield checkUpdateMaybe(context);
            yield startClient(context);
        }));
        vscode.commands.registerCommand("zls.openconfig", () => __awaiter(this, void 0, void 0, function* () {
            yield openConfig(context);
        }));
        vscode.commands.registerCommand("zls.update", () => __awaiter(this, void 0, void 0, function* () {
            yield stopClient();
            yield checkUpdate(context, false);
            yield startClient(context);
        }));
        yield checkUpdateMaybe(context);
        yield startClient(context);
    });
}
exports.activate = activate;
function checkUpdateMaybe(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const configuration = vscode_1.workspace.getConfiguration("zls");
        const checkForUpdate = configuration.get("check_for_update", true);
        if (checkForUpdate) {
            try {
                yield checkUpdate(context, true);
            }
            catch (err) {
                outputChannel.appendLine(`Failed to check for update. Reason: ${err.message}`);
            }
        }
        ;
    });
}
function startClient(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const configuration = vscode_1.workspace.getConfiguration("zls");
        const debugLog = configuration.get("debugLog", false);
        const zlsPath = yield getZLSPath(context);
        if (!zlsPath) {
            vscode_1.window.showWarningMessage("Couldn't find Zig Language Server (ZLS) executable");
            return null;
        }
        let serverOptions = {
            command: zlsPath,
            args: debugLog ? ["--enable-debug-log"] : []
        };
        // Options to control the language client
        let clientOptions = {
            documentSelector: [{ scheme: "file", language: "zig" }],
            outputChannel,
        };
        // Create the language client and start the client.
        client = new node_1.LanguageClient("zls", "Zig Language Server", serverOptions, clientOptions);
        return client.start().catch(reason => {
            vscode_1.window.showWarningMessage(`Failed to run Zig Language Server (ZLS): ${reason}`);
            client = null;
        });
    });
}
function stopClient() {
    return __awaiter(this, void 0, void 0, function* () {
        if (client)
            client.stop();
        client = null;
    });
}
// returns the file system path to the zls executable
function getZLSPath(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const configuration = vscode_1.workspace.getConfiguration("zls");
        var zlsPath = configuration.get("path", null);
        if (!zlsPath) {
            zlsPath = which.sync('zls', { nothrow: true });
        }
        else if (zlsPath.startsWith("~")) {
            zlsPath = path.join(os.homedir(), zlsPath.substring(1));
        }
        else if (!path.isAbsolute(zlsPath)) {
            zlsPath = which.sync(zlsPath, { nothrow: true });
        }
        var message = null;
        const zlsPathExists = zlsPath !== null && fs.existsSync(zlsPath);
        if (zlsPath && zlsPathExists) {
            try {
                fs.accessSync(zlsPath, fs.constants.R_OK | fs.constants.X_OK);
            }
            catch (_a) {
                message = `\`zls.path\` ${zlsPath} is not an executable`;
            }
            const stat = fs.statSync(zlsPath);
            if (!stat.isFile()) {
                message = `\`zls.path\` ${zlsPath} is not a file`;
            }
        }
        if (message === null) {
            if (!zlsPath) {
                message = "Couldn't find Zig Language Server (ZLS) executable";
            }
            else if (!zlsPathExists) {
                message = `Couldn't find Zig Language Server (ZLS) executable at ${zlsPath}`;
            }
        }
        if (message) {
            const response = yield vscode_1.window.showWarningMessage(message, "Install ZLS", "Specify Path");
            if (response === "Install ZLS") {
                return yield installExecutable(context);
            }
            else if (response === "Specify Path") {
                const uris = yield vscode_1.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    title: "Select Zig Language Server (ZLS) executable",
                });
                if (uris) {
                    yield configuration.update("path", uris[0].path, true);
                    return uris[0].path;
                }
            }
            return null;
        }
        return zlsPath;
    });
}
function checkUpdate(context, autoInstallPrebuild) {
    return __awaiter(this, void 0, void 0, function* () {
        const configuration = vscode_1.workspace.getConfiguration("zls");
        const zlsPath = yield getZLSPath(context);
        if (!zlsPath)
            return;
        if (!(yield isUpdateAvailable(zlsPath)))
            return;
        const isPrebuild = yield isZLSPrebuildBinary(context);
        if (autoInstallPrebuild && isPrebuild) {
            yield installExecutable(context);
        }
        else {
            const message = `There is a new update available for ZLS. ${!isPrebuild ? "It would replace your installation with a prebuilt binary." : ""}`;
            const response = yield vscode_1.window.showInformationMessage(message, "Install update", "Never ask again");
            if (response === "Install update") {
                yield installExecutable(context);
            }
            else if (response === "Never ask again") {
                yield configuration.update("check_for_update", false, true);
            }
        }
    });
}
// checks whether zls has been installed with `installExecutable`
function isZLSPrebuildBinary(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const configuration = vscode_1.workspace.getConfiguration("zls");
        var zlsPath = configuration.get("path", null);
        if (!zlsPath)
            return false;
        const zlsBinPath = vscode.Uri.joinPath(context.globalStorageUri, "zls_install", "zls").fsPath;
        return zlsPath.startsWith(zlsBinPath);
    });
}
// checks whether there is newer version on master
function isUpdateAvailable(zlsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        // get current version
        const buffer = child_process.execFileSync(zlsPath, ['--version']);
        const version = parseVersion(buffer.toString('utf8'));
        if (!version)
            return null;
        // compare version triple if commit id is available
        if (version.commitHeight === null || version.commitHash === null) {
            // get latest tagged version
            const tagsResponse = yield axios_1.default.get("https://api.github.com/repos/zigtools/zls/tags");
            const latestVersion = parseVersion(tagsResponse.data[0].name);
            if (!latestVersion)
                return null;
            if (latestVersion.major < version.major)
                return false;
            if (latestVersion.major > version.major)
                return true;
            if (latestVersion.minor < version.minor)
                return false;
            if (latestVersion.minor > version.minor)
                return true;
            if (latestVersion.patch < version.patch)
                return false;
            if (latestVersion.patch > version.patch)
                return true;
            return false;
        }
        const response = yield axios_1.default.get("https://api.github.com/repos/zigtools/zls/commits/master");
        const masterHash = response.data.sha;
        const isMaster = masterHash.startsWith(version.commitHash);
        return !isMaster;
    });
}
function parseVersion(str) {
    const matches = /(\d+)\.(\d+)\.(\d+)(-dev\.(\d+)\+([0-9a-fA-F]+))?/.exec(str);
    //                  0   . 10   .  0  -dev .218   +d0732db
    //                                  (         optional          )?
    if (!matches)
        return null;
    if (matches.length !== 4 && matches.length !== 7)
        return null;
    return {
        major: parseInt(matches[1]),
        minor: parseInt(matches[2]),
        patch: parseInt(matches[3]),
        commitHeight: (matches.length === 7) ? parseInt(matches[5]) : null,
        commitHash: (matches.length === 7) ? matches[6] : null,
    };
}
function openConfig(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const zlsPath = yield getZLSPath(context);
        if (!zlsPath)
            return;
        const buffer = child_process.execFileSync(zlsPath, ['--show-config-path']);
        const path = buffer.toString('utf8').trimEnd();
        yield vscode.window.showTextDocument(vscode.Uri.file(path), { preview: false });
    });
}
function deactivate() {
    return stopClient();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map