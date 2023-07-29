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
const vscode = __importStar(require("vscode"));
const util_1 = require("../util");
const api_1 = require("../explorer/nodes/api");
const collection_1 = require("../explorer/nodes/collection");
exports.default = (store, favorites, provider, tree) => ({
    deleteApi: (api) => __awaiter(void 0, void 0, void 0, function* () {
        if (yield (0, util_1.confirmed)("Are you sure you want to delete the selected API")) {
            const apiId = api.getApiId();
            for (const document of vscode.workspace.textDocuments) {
                if ((0, util_1.getApiId)(document.uri) === apiId) {
                    yield vscode.window.showTextDocument(document, { preserveFocus: false });
                    yield vscode.commands.executeCommand("workbench.action.closeActiveEditor");
                }
            }
            yield store.deleteApi(apiId);
            provider.refresh();
        }
    }),
    collectionAddToFavorite: (collection) => __awaiter(void 0, void 0, void 0, function* () {
        favorites.addFavoriteCollection(collection.getCollectionId());
        provider.refresh();
    }),
    collectionRemoveFromFavorite: (collection) => __awaiter(void 0, void 0, void 0, function* () {
        if (yield (0, util_1.confirmed)("Are you sure you want to remove selected collection from Favorite?")) {
            favorites.removeFavoriteCollection(collection.getCollectionId());
            provider.refresh();
        }
    }),
    collectionRename: (collection) => __awaiter(void 0, void 0, void 0, function* () {
        const convention = yield store.getCollectionNamingConvention();
        const name = yield vscode.window.showInputBox(Object.assign({ title: "Rename collection", value: collection.collection.desc.name }, (0, util_1.createCollectionNamingConventionInputBoxOptions)(convention)));
        if (name) {
            yield store.collectionRename(collection.getCollectionId(), name);
            provider.refresh();
        }
    }),
    apiRename: (api) => __awaiter(void 0, void 0, void 0, function* () {
        const convention = yield store.getCollectionNamingConvention();
        const name = yield vscode.window.showInputBox(Object.assign({ title: "Rename API", value: api.api.desc.name }, (0, util_1.createCollectionNamingConventionInputBoxOptions)(convention)));
        if (name) {
            yield store.apiRename(api.getApiId(), name);
            provider.refresh();
        }
    }),
    deleteCollection: (collection) => __awaiter(void 0, void 0, void 0, function* () {
        if (collection.collection.summary.apis > 0) {
            yield vscode.window.showWarningMessage("This collection is not empty, please remove all APIs in the collection first.");
            return;
        }
        if (yield (0, util_1.confirmed)("Are you sure you want to delete the selected collection?")) {
            yield store.deleteCollection(collection.getCollectionId());
            provider.refresh();
        }
    }),
    focusApi: (collectionId, apiId) => __awaiter(void 0, void 0, void 0, function* () {
        const collection = yield store.getCollection(collectionId);
        const api = yield store.getApi(apiId);
        const collectionNode = new collection_1.CollectionNode(store, provider.root.collections, collection);
        const apiNode = new api_1.ApiNode(collectionNode, store, api);
        tree.reveal(apiNode, { focus: true });
    }),
    focusCollection: (collectionId) => __awaiter(void 0, void 0, void 0, function* () {
        const collection = yield store.getCollection(collectionId);
        const collectionNode = new collection_1.CollectionNode(store, provider.root.collections, collection);
        tree.reveal(collectionNode, { focus: true });
    }),
    createCollection: () => __awaiter(void 0, void 0, void 0, function* () {
        const convention = yield store.getCollectionNamingConvention();
        const name = yield vscode.window.showInputBox(Object.assign({ title: "Create new collection", placeHolder: "New collection name" }, (0, util_1.createCollectionNamingConventionInputBoxOptions)(convention)));
        if (name) {
            const collection = yield store.createCollection(name);
            const collectionNode = new collection_1.CollectionNode(store, provider.root.collections, collection);
            provider.refresh();
            tree.reveal(collectionNode, { focus: true });
        }
    }),
    refreshCollections: () => __awaiter(void 0, void 0, void 0, function* () {
        yield store.refresh();
        provider.refresh();
    }),
    editApi: (apiId) => __awaiter(void 0, void 0, void 0, function* () {
        const uri = (0, util_1.makePlatformUri)(apiId);
        const document = yield vscode.workspace.openTextDocument(uri);
        yield vscode.window.showTextDocument(document);
    }),
});
//# sourceMappingURL=misc.js.map