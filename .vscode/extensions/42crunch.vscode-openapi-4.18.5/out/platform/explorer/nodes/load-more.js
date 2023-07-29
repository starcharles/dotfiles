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
exports.LoadMoreFavoriteApisNode = exports.LoadMoreApisNode = exports.LoadMoreCollectionsNode = void 0;
const vscode = __importStar(require("vscode"));
const base_1 = require("./base");
class LoadMoreCollectionsNode extends base_1.AbstractExplorerNode {
    constructor(parent) {
        super(parent, `${parent.id}-load-more`, "Load More...  ", vscode.TreeItemCollapsibleState.None);
        this.icon = "refresh";
        this.item.command = {
            command: "openapi.platform.loadMoreCollections",
            title: "",
            arguments: [parent],
        };
    }
}
exports.LoadMoreCollectionsNode = LoadMoreCollectionsNode;
class LoadMoreApisNode extends base_1.AbstractExplorerNode {
    constructor(parent) {
        super(parent, `${parent.id}-load-more`, "Load More...  ", vscode.TreeItemCollapsibleState.None);
        this.parent = parent;
        this.icon = "refresh";
        this.item.command = {
            command: "openapi.platform.loadMoreApis",
            title: "",
            arguments: [parent],
        };
    }
}
exports.LoadMoreApisNode = LoadMoreApisNode;
class LoadMoreFavoriteApisNode extends base_1.AbstractExplorerNode {
    constructor(parent) {
        super(parent, `${parent.id}-load-more`, "Load More...  ", vscode.TreeItemCollapsibleState.None);
        this.parent = parent;
        this.icon = "refresh";
        this.item.command = {
            command: "openapi.platform.loadMoreFavoriteApis",
            title: "",
            arguments: [parent],
        };
    }
}
exports.LoadMoreFavoriteApisNode = LoadMoreFavoriteApisNode;
//# sourceMappingURL=load-more.js.map