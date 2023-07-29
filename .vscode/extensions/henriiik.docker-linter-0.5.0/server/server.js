"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const child_process_1 = require("child_process");
let connection = vscode_languageserver_1.createConnection(vscode_languageserver_1.ProposedFeatures.all);
let linterSettings = null;
let linterName = "";
let debug = false;
let documents = new vscode_languageserver_1.TextDocuments();
let ready = false;
function log(message) {
    connection.console.log(`${linterName}: ${message}`);
}
function getDebugString(extra) {
    return [linterSettings.machine, linterSettings.container, linterSettings.command, linterSettings.regexp, extra].join(" | ");
}
;
function getDebugDiagnostic(message) {
    return {
        range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: Number.MAX_VALUE },
        },
        severity: vscode_languageserver_1.DiagnosticSeverity.Information,
        message
    };
}
function getDiagnostic(match) {
    let line = parseInt(match[linterSettings.line], 10) - 1;
    let start = 0;
    let end = Number.MAX_VALUE;
    if (linterSettings.column) {
        start = end = parseInt(match[linterSettings.column], 10) - 1;
    }
    let severity = vscode_languageserver_1.DiagnosticSeverity.Error;
    if (linterSettings.severity) {
        let tmp = linterSettings.severity;
        if (typeof tmp === "number") {
            tmp = match[Number(tmp)];
        }
        switch (tmp) {
            case "warning":
                severity = vscode_languageserver_1.DiagnosticSeverity.Warning;
                break;
            case "info":
                severity = vscode_languageserver_1.DiagnosticSeverity.Information;
                break;
        }
    }
    let diagnostic = {
        range: {
            start: { line, character: start },
            end: { line, character: end }
        },
        severity,
        message: match[linterSettings.message]
    };
    if (linterSettings.code) {
        diagnostic.code = match[linterSettings.code];
    }
    return diagnostic;
}
;
function parseBuffer(buffer) {
    let result = [];
    let lines = buffer.toString().split("\n");
    let problemRegex = new RegExp(linterSettings.regexp, "m");
    lines.forEach(line => {
        let match = line.match(problemRegex);
        if (match) {
            result.push(getDiagnostic(match));
        }
    });
    return result;
}
;
function isInteger(value) {
    return isFinite(value) && Math.floor(value) === value;
}
function checkDockerVersion() {
    return new Promise((resolve, reject) => {
        child_process_1.exec(`docker -v`, function (error, stdout, stderr) {
            if (error) {
                let errString = `Could not find docker: '${stderr.toString()}'`;
                reject(new vscode_languageserver_1.ResponseError(99, errString, { retry: true }));
            }
            resolve({ capabilities: { textDocumentSync: documents.syncKind } });
        });
    });
}
function setMachineEnv(machine) {
    return new Promise((resolve, reject) => {
        if (machine.length === 0) {
            resolve(machine);
        }
        else {
            child_process_1.exec(`docker-machine env ${machine} --shell bash`, function (error, stdout, stderr) {
                if (error) {
                    let errString = stderr.toString();
                    connection.window.showErrorMessage(`Could not get docker-machine environment: '${errString}'`);
                    reject(machine);
                }
                let out = stdout.toString();
                let envRegex = /export (.+)="(.+)"\n/g;
                let match;
                while (match = envRegex.exec(out)) {
                    process.env[match[1]] = match[2];
                }
                resolve(machine);
            });
        }
    });
}
documents.listen(connection);
documents.onDidChangeContent((event) => {
    validateSingle(event.document);
});
connection.onInitialize((params) => {
    return checkDockerVersion();
});
let isValidating = {};
let needsValidating = {};
function validate(document) {
    let uri = document.uri;
    if (debug) {
        log(`Validation requested for: ${uri}`);
    }
    if (!ready || isValidating[uri]) {
        needsValidating[uri] = document;
        return;
    }
    ;
    isValidating[uri] = true;
    let cmd = "docker";
    let args = `exec -i ${linterSettings.container} ${linterSettings.command}`;
    if (debug) {
        log(`Running command: '${cmd} ${args}'`);
    }
    let child = child_process_1.spawn(cmd, args.split(" "));
    child.stdin.write(document.getText());
    child.stdin.end();
    let diagnostics = [];
    let debugString = "";
    child.stderr.on("data", (data) => {
        debugString += data.toString();
        diagnostics = diagnostics.concat(parseBuffer(data));
    });
    child.stdout.on("data", (data) => {
        debugString += data.toString();
        diagnostics = diagnostics.concat(parseBuffer(data));
    });
    child.on("close", (code) => {
        if (debug) {
            log(`Command exited with code: ${code}`);
            connection.console.log(debugString);
        }
        if (debugString.match(/^Error response from daemon/)) {
            connection.window.showErrorMessage(`Is your container running? Error: ${debugString}`);
        }
        else if (debugString.match(/^An error occurred trying to connect/)) {
            connection.window.showErrorMessage(`Is your machine correctly configured? Error: ${debugString}`);
        }
        else {
            connection.sendDiagnostics({ uri, diagnostics });
        }
        isValidating[uri] = false;
        let revalidateDocument = needsValidating[uri];
        if (revalidateDocument) {
            if (debug) {
                log(`Re-validating: ${uri}`);
            }
            delete needsValidating[uri];
            validate(revalidateDocument);
        }
        else {
            if (debug) {
                log(`Validation finished for: ${uri}`);
            }
        }
    });
}
function getMessage(err, document) {
    let result = null;
    if (typeof err.message === "string" || err.message instanceof String) {
        result = err.message;
        result = result.replace(/\r?\n/g, " ");
        if (/^CLI: /.test(result)) {
            result = result.substr(5);
        }
    }
    else {
        result = `An unknown error occured while validating file: ${vscode_languageserver_1.Files.uriToFilePath(document.uri)}`;
    }
    return result;
}
function validateSingle(document) {
    try {
        validate(document);
    }
    catch (err) {
        connection.window.showErrorMessage(getMessage(err, document));
    }
}
function validateMany(documents) {
    let tracker = new vscode_languageserver_1.ErrorMessageTracker();
    documents.forEach(document => {
        try {
            validate(document);
        }
        catch (err) {
            tracker.add(getMessage(err, document));
        }
    });
    tracker.sendErrors(connection);
}
let linters = ["perl", "perlcritic", "flake8", "rubocop", "php"];
connection.onDidChangeConfiguration((params) => {
    let settings = params.settings["docker-linter"];
    debug = settings.debug === true ? true : false;
    linters.forEach(linter => {
        if (settings[linter]) {
            linterSettings = settings[linter];
            linterName = linter;
        }
        ;
    });
    if (debug) {
        log(`Settings updated.`);
    }
    setMachineEnv(linterSettings.machine)
        .then(response => {
        ready = true;
        validateMany(documents.all());
    });
});
connection.onDidChangeWatchedFiles((params) => {
    validateMany(documents.all());
});
connection.listen();
//# sourceMappingURL=server.js.map