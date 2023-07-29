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
exports.DataDictionariesNode = exports.RootNode = void 0;
const vscode = __importStar(require("vscode"));
const base_1 = require("./base");
const collection_1 = require("./collection");
const favorite_1 = require("./favorite");
class RootNode {
    constructor(store, favorites) {
        this.store = store;
        this.favorites = favorites;
        this.id = "root";
        this.parent = undefined;
        this.favorite = new favorite_1.FavoriteCollectionsNode(this, this.store, this.favorites);
        this.collections = new collection_1.CollectionsNode(this, this.store);
        this.dictionaries = new DataDictionariesNode(this, this.store);
        this.item = {};
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return [this.favorite, this.dictionaries, this.collections];
        });
    }
}
exports.RootNode = RootNode;
class DataDictionariesNode extends base_1.AbstractExplorerNode {
    constructor(parent, store) {
        super(parent, `${parent.id}-data-dictionaries`, "Data Dictionaries", vscode.TreeItemCollapsibleState.None);
        this.store = store;
        this.item.command = {
            command: "openapi.platform.browseDataDictionaries",
            title: "",
        };
    }
}
exports.DataDictionariesNode = DataDictionariesNode;
//# sourceMappingURL=root.js.map