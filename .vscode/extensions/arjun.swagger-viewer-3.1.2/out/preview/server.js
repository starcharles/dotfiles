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
exports.PreviewServer = void 0;
const path = require("path");
const fs = require("fs");
const vscode = require("vscode");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const SwaggerParser = require("swagger-parser");
const portfinder_1 = require("portfinder");
const SERVER_PORT = vscode.workspace.getConfiguration("swaggerViewer").defaultPort || 18512;
const FILE_CONTENT = {};
class PreviewServer {
    constructor() {
        this.currentHost = null;
        this.currentPort = SERVER_PORT;
        this.serverRunning = false;
    }
    initiateServer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.serverRunning)
                return;
            this.currentHost =
                vscode.workspace.getConfiguration("swaggerViewer").defaultHost ||
                    "localhost";
            this.currentPort = yield portfinder_1.getPortPromise({ port: this.currentPort });
            const app = express();
            app.use(express.static(path.join(__dirname, "..", "..", "static")));
            app.use("/node_modules", express.static(path.join(__dirname, "..", "..", "node_modules")));
            app.use("/:fileHash", (req, res) => {
                let htmlContent = fs
                    .readFileSync(path.join(__dirname, "..", "..", "static", "index.html"))
                    .toString("utf-8")
                    .replace("%FILE_HASH%", req.params.fileHash);
                res.setHeader("Content-Type", "text/html");
                res.send(htmlContent);
            });
            this.server = http.createServer(app);
            this.io = new socketio.Server(this.server);
            app.set("host", this.currentHost);
            app.set("port", this.currentPort);
            this.startServer(this.currentPort);
            this.io.on("connection", (socket) => {
                socket.on("GET_INITIAL", function (data, fn) {
                    let fileHash = data.fileHash;
                    socket.join(fileHash);
                    fn(FILE_CONTENT[fileHash]);
                });
            });
        });
    }
    startServer(port) {
        this.currentPort = port;
        this.server.listen(this.currentPort, this.currentHost, () => {
            this.serverRunning = true;
        });
    }
    update(filePath, fileHash, content) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                FILE_CONTENT[fileHash] = yield SwaggerParser.bundle(filePath, content, {});
                this.io && this.io.to(fileHash).emit("TEXT_UPDATE", content);
            }
            catch (err) { }
        });
    }
    getUrl(fileHash) {
        return `http://${this.currentHost}:${this.currentPort}/${fileHash}`;
    }
    stop() {
        this.server.close();
        this.server = null;
        this.serverRunning = false;
    }
}
exports.PreviewServer = PreviewServer;
//# sourceMappingURL=server.js.map