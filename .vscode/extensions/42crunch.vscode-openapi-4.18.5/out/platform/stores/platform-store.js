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
exports.PlatformStore = exports.Filters = exports.Limits = void 0;
const vscode_1 = require("vscode");
const api_1 = require("../api");
const COLLECTION_PAGE_SIZE = 100;
const APIS_PAGE_SIZE = 100;
class Limits {
    constructor() {
        this.collections = COLLECTION_PAGE_SIZE;
        this.apis = new Map();
        this.favorite = new Map();
    }
    getCollections() {
        return this.collections;
    }
    increaseCollections() {
        this.collections = this.collections + COLLECTION_PAGE_SIZE;
    }
    getApis(collectionId) {
        var _a;
        return (_a = this.apis.get(collectionId)) !== null && _a !== void 0 ? _a : APIS_PAGE_SIZE;
    }
    increaseApis(collectionId) {
        var _a;
        this.apis.set(collectionId, ((_a = this.apis.get(collectionId)) !== null && _a !== void 0 ? _a : APIS_PAGE_SIZE) + APIS_PAGE_SIZE);
    }
    getFavorite(collectionId) {
        var _a;
        return (_a = this.favorite.get(collectionId)) !== null && _a !== void 0 ? _a : APIS_PAGE_SIZE;
    }
    increaseFavorite(collectionId) {
        var _a;
        this.favorite.set(collectionId, ((_a = this.favorite.get(collectionId)) !== null && _a !== void 0 ? _a : APIS_PAGE_SIZE) + APIS_PAGE_SIZE);
    }
    reset() {
        this.collections = COLLECTION_PAGE_SIZE;
        this.apis = new Map();
        this.favorite = new Map();
    }
}
exports.Limits = Limits;
class Filters {
    constructor() {
        this.collection = undefined;
        this.api = new Map();
        this.favorite = new Map();
    }
}
exports.Filters = Filters;
class PlatformStore {
    constructor(logger) {
        this.logger = logger;
        this.apiLastAssessment = new Map();
        this.connection = undefined;
        this.limits = new Limits();
        this.filters = new Filters();
        this._onConnectionDidChange = new vscode_1.EventEmitter();
        this.connected = false;
    }
    get onConnectionDidChange() {
        return this._onConnectionDidChange.event;
    }
    setCredentials(credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            this.connection = credentials;
            yield this.refresh();
            this._onConnectionDidChange.fire({
                credentials: this.hasCredentials(),
                connected: this.isConnected(),
            });
        });
    }
    hasCredentials() {
        return (this.connection !== undefined && !!this.connection.platformUrl && !!this.connection.apiToken);
    }
    isConnected() {
        return this.connected;
    }
    testConnection(credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.testConnection)(credentials, this.logger);
        });
    }
    getConnection() {
        if (this.connection === undefined) {
            throw new Error(`Platform connection has not been configured`);
        }
        return this.connection;
    }
    getCollectionNamingConvention() {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.getCollectionNamingConvention)(this.getConnection(), this.logger);
        });
    }
    getApiNamingConvention() {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.getApiNamingConvention)(this.getConnection(), this.logger);
        });
    }
    getCollections(filter, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield (0, api_1.listCollections)(filter, this.getConnection(), this.logger);
            const filtered = response.list.filter((collection) => {
                if (filter) {
                    return filter.name
                        ? collection.desc.name.toLowerCase().includes(filter.name.toLowerCase())
                        : true;
                }
                return true;
            });
            const hasMore = filtered.length > limit;
            return {
                hasMore,
                collections: filtered.slice(0, limit),
            };
        });
    }
    searchCollections(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.searchCollections)(name, this.getConnection(), this.logger);
        });
    }
    getAllCollections() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield (0, api_1.listCollections)({ name: undefined, owner: "ALL" }, this.getConnection(), this.logger);
            return response.list;
        });
    }
    createCollection(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield (0, api_1.createCollection)(name, this.getConnection(), this.logger);
            return collection;
        });
    }
    collectionRename(collectionId, name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, api_1.collectionUpdate)(collectionId, name, this.getConnection(), this.logger);
        });
    }
    apiRename(apiId, name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, api_1.updateApi)(apiId, { name }, this.getConnection(), this.logger);
        });
    }
    createApi(collectionId, name, json) {
        return __awaiter(this, void 0, void 0, function* () {
            const api = yield (0, api_1.createApi)(collectionId, name, Buffer.from(json), this.getConnection(), this.logger);
            return api;
        });
    }
    createTempApi(json) {
        return __awaiter(this, void 0, void 0, function* () {
            const collectionId = yield this.findOrCreateTempCollection();
            const apiName = `tmp-${Date.now()}`;
            const api = yield (0, api_1.createApi)(collectionId, apiName, Buffer.from(json), this.getConnection(), this.logger);
            return { apiId: api.desc.id, collectionId };
        });
    }
    clearTempApi(tmp) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, api_1.deleteApi)(tmp.apiId, this.getConnection(), this.logger);
            // check if any of the old apis have to be deleted
            const current = new Date().getTime();
            const response = yield (0, api_1.listApis)(tmp.collectionId, this.getConnection(), this.logger);
            for (const api of response.list) {
                const name = api.desc.name;
                if (name.startsWith("tmp-")) {
                    const timestamp = Number(name.split("-")[1]);
                    if (current - timestamp > 600000) {
                        yield (0, api_1.deleteApi)(api.desc.id, this.getConnection(), this.logger);
                    }
                }
            }
        });
    }
    updateApi(apiId, content) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const api = yield (0, api_1.readApi)(apiId, this.getConnection(), this.logger, false);
            const last = ((_a = api === null || api === void 0 ? void 0 : api.assessment) === null || _a === void 0 ? void 0 : _a.last) ? new Date(api.assessment.last) : new Date(0);
            this.apiLastAssessment.set(apiId, last);
            yield (0, api_1.updateApi)(apiId, { specfile: content }, this.getConnection(), this.logger);
        });
    }
    deleteCollection(collectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, api_1.deleteCollection)(collectionId, this.getConnection(), this.logger);
        });
    }
    deleteApi(apiId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, api_1.deleteApi)(apiId, this.getConnection(), this.logger);
        });
    }
    getApis(collectionId, filter, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield (0, api_1.listApis)(collectionId, this.getConnection(), this.logger);
            const filtered = response.list.filter((api) => {
                if (filter) {
                    return filter.name ? api.desc.name.toLowerCase().includes(filter.name.toLowerCase()) : true;
                }
                return true;
            });
            const hasMore = filtered.length > limit;
            return {
                hasMore,
                apis: filtered.slice(0, limit),
            };
        });
    }
    getApi(apiId) {
        return __awaiter(this, void 0, void 0, function* () {
            const api = yield (0, api_1.readApi)(apiId, this.getConnection(), this.logger, true);
            return api;
        });
    }
    getCollection(collectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield (0, api_1.readCollection)(collectionId, this.getConnection(), this.logger);
            return collection;
        });
    }
    getCollectionUsers(collectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield (0, api_1.readCollectionUsers)(collectionId, this.getConnection(), this.logger);
            return collection;
        });
    }
    getAuditReport(apiId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const ASSESSMENT_MAX_WAIT = 60000;
            const ASSESSMENT_RETRY = 1000;
            const start = Date.now();
            let now = Date.now();
            const last = (_a = this.apiLastAssessment.get(apiId)) !== null && _a !== void 0 ? _a : new Date(0);
            while (now - start < ASSESSMENT_MAX_WAIT) {
                const api = yield (0, api_1.readApi)(apiId, this.getConnection(), this.logger, false);
                const current = new Date(api.assessment.last);
                const ready = api.assessment.isProcessed && current.getTime() > last.getTime();
                if (ready) {
                    const report = yield (0, api_1.readAuditReport)(apiId, this.getConnection(), this.logger);
                    return report;
                }
                yield delay(ASSESSMENT_RETRY);
                now = Date.now();
            }
            throw new Error(`Timed out while waiting for the assessment report for API ID: ${apiId}`);
        });
    }
    getDataDictionaries() {
        return __awaiter(this, void 0, void 0, function* () {
            const dictionaries = yield (0, api_1.getDataDictionaries)(this.getConnection(), this.logger);
            dictionaries.push({
                id: "standard",
                name: "standard",
                description: "Default standard formats",
            });
            const result = [];
            for (const dictionary of dictionaries) {
                const formats = yield (0, api_1.getDataDictionaryFormats)(dictionary.id, this.getConnection(), this.logger);
                result.push({
                    id: dictionary.id,
                    name: dictionary.name,
                    description: dictionary.description,
                    formats,
                });
            }
            return result;
        });
    }
    getDataDictionaryFormats() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.formats) {
                const dictionaries = yield (0, api_1.getDataDictionaries)(this.getConnection(), this.logger);
                dictionaries.push({
                    id: "standard",
                    name: "standard",
                    description: "Default standard formats",
                });
                const result = [];
                for (const dictionary of dictionaries) {
                    const formats = yield (0, api_1.getDataDictionaryFormats)(dictionary.id, this.getConnection(), this.logger);
                    for (const format of Object.values(formats)) {
                        // entries from a standard dictionary do not have a o: prefix
                        if (dictionary.id === "standard") {
                            result.push({
                                id: `o:${format.name}`,
                                name: format.name,
                                description: format.description,
                                format: format,
                            });
                        }
                        else {
                            result.push({
                                id: `o:${dictionary.name}:${format.name}`,
                                name: `o:${dictionary.name}:${format.name}`,
                                description: format.description,
                                format: format,
                            });
                        }
                    }
                }
                this.formats = result;
            }
            return this.formats;
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            this.formats = undefined;
            if (this.hasCredentials()) {
                const { success } = yield (0, api_1.testConnection)(this.getConnection(), this.logger);
                this.connected = success;
            }
            else {
                this.connected = false;
            }
        });
    }
    createDefaultScanConfig(apiId) {
        return __awaiter(this, void 0, void 0, function* () {
            const configId = yield (0, api_1.createDefaultScanConfig)(apiId, this.getConnection(), this.logger);
            return configId;
        });
    }
    readScanConfig(configId) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield (0, api_1.readScanConfig)(configId, this.getConnection(), this.logger);
            return config;
        });
    }
    createScanConfig(apiId, name, config) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.createScanConfig)(apiId, name, config, this.getConnection(), this.logger);
        });
    }
    createScanConfigNew(apiId, name, config) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.createScanConfigNew)(apiId, name, config, this.getConnection(), this.logger);
        });
    }
    getScanConfigs(apiId) {
        return __awaiter(this, void 0, void 0, function* () {
            const MAX_WAIT = 30000;
            const RETRY = 1000;
            const start = Date.now();
            const deadline = start + MAX_WAIT;
            while (Date.now() < deadline) {
                const configs = yield (0, api_1.listScanConfigs)(apiId, this.getConnection(), this.logger);
                if (configs.length > 0) {
                    return configs;
                }
                yield delay(RETRY);
            }
            throw new Error(`Timed out while waiting for the scan config for API ID: ${apiId}`);
        });
    }
    listScanReports(apiId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.listScanReports)(apiId, this.getConnection(), this.logger);
        });
    }
    readScanReport(reportId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.readScanReport)(reportId, this.getConnection(), this.logger);
        });
    }
    readScanReportNew(reportId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.readScanReportNew)(reportId, this.getConnection(), this.logger);
        });
    }
    readTechnicalCollection(technicalName) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.readTechnicalCollection)(technicalName, this.getConnection(), this.logger);
        });
    }
    createTechnicalCollection(technicalName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.createTechnicalCollection)(technicalName, name, this.getConnection(), this.logger);
        });
    }
    readAuditCompliance(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.readAuditCompliance)(taskId, this.getConnection(), this.logger);
        });
    }
    readAuditReportSqgTodo(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, api_1.readAuditReportSqgTodo)(taskId, this.getConnection(), this.logger);
        });
    }
    findOrCreateTempCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            const collectionName = "IDE Temp Collection";
            const collections = yield this.searchCollections(collectionName);
            if (collections.list.length === 0) {
                const collection = yield this.createCollection(collectionName);
                return collection.desc.id;
            }
            return collections.list[0].id;
        });
    }
}
exports.PlatformStore = PlatformStore;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=platform-store.js.map