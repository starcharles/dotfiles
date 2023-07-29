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
exports.default = (store, provider) => ({
    apisFilter: (collection) => apisFilter(store, provider, collection),
    favoriteApisFilter: (collection) => favoriteApisFilter(store, provider, collection),
    collectionsFilter: (collections) => collectionsFilter(store, provider, collections),
    collectionsFilterReset: (node) => __awaiter(void 0, void 0, void 0, function* () {
        store.filters.collection = undefined;
        provider.refresh();
    }),
    apisFilterReset: (node) => __awaiter(void 0, void 0, void 0, function* () {
        store.filters.api.delete(node.getCollectionId());
        provider.refresh();
    }),
    favoriteApisFilterReset: (node) => __awaiter(void 0, void 0, void 0, function* () {
        store.filters.favorite.delete(node.getCollectionId());
        provider.refresh();
    }),
    loadMoreCollections: (collections) => __awaiter(void 0, void 0, void 0, function* () {
        store.limits.increaseCollections();
        provider.refresh();
    }),
    loadMoreApis: (collection) => __awaiter(void 0, void 0, void 0, function* () {
        store.limits.increaseApis(collection.getCollectionId());
        provider.refresh();
    }),
    loadMoreFavoriteApis: (collection) => __awaiter(void 0, void 0, void 0, function* () {
        store.limits.increaseFavorite(collection.getCollectionId());
        provider.refresh();
    }),
});
function collectionsFilter(store, provider, collections) {
    return __awaiter(this, void 0, void 0, function* () {
        const filter = { name: undefined, owner: "ALL" };
        const name = yield vscode.window.showInputBox({
            prompt: "Filter Collections by Name",
        });
        if (name !== undefined) {
            if (name !== "") {
                filter.name = name;
                store.filters.collection = filter;
            }
            else {
                store.filters.collection = undefined;
            }
            provider.refresh();
        }
    });
}
function apisFilter(store, provider, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const filter = { name: undefined };
        const name = yield vscode.window.showInputBox({
            prompt: "Filter APIs by Name",
        });
        if (name !== undefined) {
            if (name !== "") {
                filter.name = name;
                store.filters.api.set(collection.getCollectionId(), filter);
            }
            else {
                store.filters.api.delete(collection.getCollectionId());
            }
            provider.refresh();
        }
    });
}
function favoriteApisFilter(store, provider, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const filter = { name: undefined };
        const name = yield vscode.window.showInputBox({
            prompt: "Filter APIs by Name",
        });
        if (name !== undefined) {
            if (name !== "") {
                filter.name = name;
                store.filters.favorite.set(collection.getCollectionId(), filter);
            }
            else {
                store.filters.favorite.delete(collection.getCollectionId());
            }
            provider.refresh();
        }
    });
}
//# sourceMappingURL=filter.js.map