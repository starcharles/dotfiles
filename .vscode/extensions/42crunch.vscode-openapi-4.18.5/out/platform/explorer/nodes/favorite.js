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
exports.FilteredFavoriteApiNode = exports.FavoriteCollectionNode = exports.FavoriteCollectionsNode = void 0;
const vscode = __importStar(require("vscode"));
const api_1 = require("./api");
const base_1 = require("./base");
const load_more_1 = require("./load-more");
class FavoriteCollectionsNode extends base_1.AbstractExplorerNode {
    constructor(parent, store, favoritesStore) {
        super(parent, `${parent.id}-favorite`, "My Favorite Collections", vscode.TreeItemCollapsibleState.Expanded);
        this.store = store;
        this.favoritesStore = favoritesStore;
        this.contextValue = "favorite";
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            const favorites = this.favoritesStore.getFavoriteCollectionIds();
            const collections = yield this.store.getAllCollections();
            const children = collections
                .filter((collection) => favorites.includes(collection.desc.id))
                .map((collection) => new FavoriteCollectionNode(this, this.store, collection));
            return children;
        });
    }
}
exports.FavoriteCollectionsNode = FavoriteCollectionsNode;
class FavoriteCollectionNode extends base_1.AbstractExplorerNode {
    constructor(parent, store, collection) {
        super(parent, `${parent.id}-${collection.desc.id}`, collection.desc.name, collection.summary.apis === 0
            ? vscode.TreeItemCollapsibleState.None
            : vscode.TreeItemCollapsibleState.Collapsed);
        this.store = store;
        this.collection = collection;
        this.icon = "file-directory";
        this.contextValue = "favoriteCollection";
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            const apis = yield this.store.getApis(this.getCollectionId(), this.store.filters.favorite.get(this.getCollectionId()), this.store.limits.getFavorite(this.getCollectionId()));
            const children = apis.apis.map((api) => new api_1.ApiNode(this, this.store, api));
            const hasMore = apis.hasMore ? [new load_more_1.LoadMoreFavoriteApisNode(this)] : [];
            const hasFilter = this.store.filters.favorite.has(this.getCollectionId())
                ? [new FilteredFavoriteApiNode(this, this.store, apis.apis.length)]
                : [];
            return [...hasFilter, ...children, ...hasMore];
        });
    }
    getCollectionId() {
        return this.collection.desc.id;
    }
}
exports.FavoriteCollectionNode = FavoriteCollectionNode;
class FilteredFavoriteApiNode extends base_1.AbstractExplorerNode {
    constructor(parent, store, found) {
        super(parent, `${parent.id}-filter`, `Found ${found}`, vscode.TreeItemCollapsibleState.None);
        this.parent = parent;
        this.store = store;
        this.icon = "filter";
        this.contextValue = "favoriteApiFilter";
    }
    getCollectionId() {
        return this.parent.getCollectionId();
    }
}
exports.FilteredFavoriteApiNode = FilteredFavoriteApiNode;
//# sourceMappingURL=favorite.js.map