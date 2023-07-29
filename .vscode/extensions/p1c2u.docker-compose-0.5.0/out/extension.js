'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const appInsightsClient_1 = require("./telemetry/appInsightsClient");
const nullClient_1 = require("./telemetry/nullClient");
const workspaceConfigurator_1 = require("./configurators/workspaceConfigurator");
const providers_1 = require("./explorers/providers");
const models_1 = require("./projects/models");
function activate(context) {
    const configuration = workspaceConfigurator_1.WorkspaceConfigurator.getConfiguration();
    const interval = configuration.get("autoRefreshInterval");
    const files = configuration.get("files");
    const shell = configuration.get("shell");
    const projectNames = configuration.get("projectNames");
    const isTelemetryEnabled = configuration.get("enableTelemetry");
    const telemetryClient = isTelemetryEnabled ? new appInsightsClient_1.AppInsightsClient("1234-1234-1234-1234") : new nullClient_1.NullClient();
    const workspace = new models_1.Workspace(vscode.workspace && vscode.workspace.workspaceFolders, projectNames, files, shell);
    const projectsProvider = new providers_1.DockerComposeProjectsProvider(context, workspace);
    const servicesProvider = new providers_1.DockerComposeServicesProvider(context, workspace);
    servicesProvider.setAutoRefresh(interval);
    vscode.window.registerTreeDataProvider("dockerComposeServices", servicesProvider);
    vscode.window.createTreeView('dockerComposeProjects', { treeDataProvider: projectsProvider, canSelectMany: true });
    telemetryClient.sendEvent("loadExtension");
    let refreshExplorer = vscode.commands.registerCommand("docker-compose.explorer.refresh", () => {
        servicesProvider.refresh();
        telemetryClient.sendEvent("refreshExplorer");
    });
    let shellService = vscode.commands.registerCommand("docker-compose.service.shell", (node) => {
        servicesProvider.shellService(node);
        telemetryClient.sendEvent("shellService");
    });
    let selectProject = vscode.commands.registerCommand("docker-compose.project.select", (node) => {
        // projectsProvider.selectProject(node);
        servicesProvider.selectProject(node);
        telemetryClient.sendEvent("selectProject");
    });
    let startProject = vscode.commands.registerCommand("docker-compose.project.start", (node) => {
        servicesProvider.startProject(node);
        telemetryClient.sendEvent("startProject");
    });
    let stopProject = vscode.commands.registerCommand("docker-compose.project.stop", (node) => {
        servicesProvider.stopProject(node);
        telemetryClient.sendEvent("stopProject");
    });
    let upProject = vscode.commands.registerCommand("docker-compose.project.up", (node) => {
        servicesProvider.upProject(node);
        telemetryClient.sendEvent("upProject");
    });
    let downProject = vscode.commands.registerCommand("docker-compose.project.down", (node) => {
        servicesProvider.downProject(node);
        telemetryClient.sendEvent("downProject");
    });
    let upService = vscode.commands.registerCommand("docker-compose.service.up", (node) => {
        servicesProvider.upService(node);
        telemetryClient.sendEvent("upService");
    });
    let downService = vscode.commands.registerCommand("docker-compose.service.down", (node) => {
        servicesProvider.downService(node);
        telemetryClient.sendEvent("downService");
    });
    let startService = vscode.commands.registerCommand("docker-compose.service.start", (node) => {
        servicesProvider.startService(node);
        telemetryClient.sendEvent("startService");
    });
    let stopService = vscode.commands.registerCommand("docker-compose.service.stop", (node) => {
        servicesProvider.stopService(node);
        telemetryClient.sendEvent("stopService");
    });
    let restartService = vscode.commands.registerCommand("docker-compose.service.restart", (node) => {
        servicesProvider.restartService(node);
        telemetryClient.sendEvent("restartService");
    });
    let buildService = vscode.commands.registerCommand("docker-compose.service.build", (node) => {
        servicesProvider.buildService(node);
        telemetryClient.sendEvent("buildService");
    });
    let killService = vscode.commands.registerCommand("docker-compose.service.kill", (node) => {
        servicesProvider.killService(node);
        telemetryClient.sendEvent("killService");
    });
    let attachContainer = vscode.commands.registerCommand("docker-compose.container.attach", (node) => {
        servicesProvider.attachContainer(node);
        telemetryClient.sendEvent("attachContainer");
    });
    let logsContainer = vscode.commands.registerCommand("docker-compose.container.logs", (node) => {
        servicesProvider.logsContainer(node);
        telemetryClient.sendEvent("logsContainer");
    });
    let startContainer = vscode.commands.registerCommand("docker-compose.container.start", (node) => {
        servicesProvider.startContainer(node);
        telemetryClient.sendEvent("startContainer");
    });
    let stopContainer = vscode.commands.registerCommand("docker-compose.container.stop", (node) => {
        servicesProvider.stopContainer(node);
        telemetryClient.sendEvent("stopContainer");
    });
    let killContainer = vscode.commands.registerCommand("docker-compose.container.kill", (node) => {
        servicesProvider.killContainer(node);
        telemetryClient.sendEvent("killContainer");
    });
    context.subscriptions.push(selectProject);
    context.subscriptions.push(upProject);
    context.subscriptions.push(downProject);
    context.subscriptions.push(startProject);
    context.subscriptions.push(stopProject);
    context.subscriptions.push(shellService);
    context.subscriptions.push(upService);
    context.subscriptions.push(downService);
    context.subscriptions.push(startService);
    context.subscriptions.push(stopService);
    context.subscriptions.push(restartService);
    context.subscriptions.push(buildService);
    context.subscriptions.push(killService);
    context.subscriptions.push(attachContainer);
    context.subscriptions.push(logsContainer);
    context.subscriptions.push(startContainer);
    context.subscriptions.push(stopContainer);
    context.subscriptions.push(killContainer);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map