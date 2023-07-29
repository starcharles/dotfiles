"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
let linters = [
    {
        name: "perl",
        language: "perl"
    }, {
        name: "perlcritic",
        language: "perl"
    }, {
        name: "perl",
        language: "perl+mojolicious"
    }, {
        name: "perlcritic",
        language: "perl+mojolicious"
    }, {
        name: "flake8",
        language: "python"
    }, {
        name: "rubocop",
        language: "ruby"
    }, {
        name: "php",
        language: "php"
    }
];
function activate(context) {
    let outputChannel = vscode_1.window.createOutputChannel("Docker Linter");
    let port = 6008;
    linters.forEach(linter => {
        port += 1;
        let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
        let debugOptions = { execArgv: ["--nolazy", "--inspect=" + port] };
        let serverOptions = {
            run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
            debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
        };
        let clientOptions = {
            documentSelector: [linter.language],
            synchronize: {
                configurationSection: [`docker-linter.${linter.name}`, `docker-linter.debug`]
            },
            outputChannel: outputChannel,
        };
        let client = new vscode_languageclient_1.LanguageClient(`Docker Linter: ${linter.name}`, serverOptions, clientOptions);
        let monitor = new vscode_languageclient_1.SettingMonitor(client, `docker-linter.${linter.name}.enable`).start();
        context.subscriptions.push(monitor);
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map