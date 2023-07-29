"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
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
exports.readAuditReportSqgTodo = exports.readAuditCompliance = exports.testConnection = exports.createTechnicalCollection = exports.readTechnicalCollection = exports.readScanReportNew = exports.readScanReport = exports.listScanReports = exports.createScanConfigNew = exports.createScanConfig = exports.readScanConfig = exports.listScanConfigs = exports.createDefaultScanConfig = exports.getDataDictionaryFormats = exports.getDataDictionaries = exports.getCollectionNamingConvention = exports.getApiNamingConvention = exports.deleteCollection = exports.createCollection = exports.collectionUpdate = exports.updateApi = exports.createApi = exports.deleteApi = exports.readAuditReport = exports.readCollectionUsers = exports.readCollection = exports.readApi = exports.listApis = exports.searchCollections = exports.listCollections = void 0;
const got_1 = __importStar(require("got"));
function gotOptions(method, options, logger) {
    const logRequest = (response, retryWithMergedOptions) => {
        logger.debug(`${method} ${response.url} ${response.statusCode}`);
        return response;
    };
    return {
        method,
        prefixUrl: options.platformUrl,
        responseType: "json",
        headers: {
            Accept: "application/json",
            "X-API-KEY": options.apiToken,
            "X-42C-IDE": "true",
        },
        hooks: {
            afterResponse: [logRequest],
        },
    };
}
function listCollections(filter, options, logger) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const listOption = (_a = filter === null || filter === void 0 ? void 0 : filter.owner) !== null && _a !== void 0 ? _a : "ALL";
            const { body } = yield (0, got_1.default)(`api/v2/collections?listOption=${listOption}&perPage=0`, gotOptions("GET", options, logger));
            return body;
        }
        catch (ex) {
            throw new Error("Unable to list collections, please check your 42Crunch credentials: " + ex.message);
        }
    });
}
exports.listCollections = listCollections;
function searchCollections(collectionName, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = { collectionName };
        const { body } = yield (0, got_1.default)(`api/v1/search/collections`, Object.assign(Object.assign({}, gotOptions("GET", options, logger)), { searchParams: params }));
        return body;
    });
}
exports.searchCollections = searchCollections;
function listApis(collectionId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)(`api/v1/collections/${collectionId}/apis?withTags=true&perPage=0`, gotOptions("GET", options, logger));
        return body;
    });
}
exports.listApis = listApis;
function readApi(apiId, options, logger, specfile) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = specfile ? { specfile: "true" } : {};
        const { body } = yield (0, got_1.default)(`api/v1/apis/${apiId}`, Object.assign(Object.assign({}, gotOptions("GET", options, logger)), { searchParams: params }));
        return body;
    });
}
exports.readApi = readApi;
function readCollection(collectionId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = (yield (0, got_1.default)(`api/v1/collections/${collectionId}?readOwner=true`, gotOptions("GET", options, logger)));
        return body;
    });
}
exports.readCollection = readCollection;
function readCollectionUsers(collectionId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = (yield (0, got_1.default)(`api/v1/collections/${collectionId}/users`, gotOptions("GET", options, logger)));
        return body;
    });
}
exports.readCollectionUsers = readCollectionUsers;
function readAuditReport(apiId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = (yield (0, got_1.default)(`api/v1/apis/${apiId}/assessmentreport`, gotOptions("GET", options, logger)));
        const text = Buffer.from(body.data, "base64").toString("utf-8");
        const data = JSON.parse(text);
        return { tid: body.tid, data };
    });
}
exports.readAuditReport = readAuditReport;
function deleteApi(apiId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, got_1.default)(`api/v1/apis/${apiId}`, gotOptions("DELETE", options, logger));
    });
}
exports.deleteApi = deleteApi;
function createApi(collectionId, name, contents, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)("api/v2/apis", Object.assign(Object.assign({}, gotOptions("POST", options, logger)), { json: {
                cid: collectionId,
                name,
                specfile: contents.toString("base64"),
            } }));
        return body;
    });
}
exports.createApi = createApi;
function updateApi(apiId, update, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const json = {};
        if (update.specfile) {
            json.specfile = update.specfile.toString("base64");
        }
        if (update.name) {
            json.name = update.name;
        }
        const { body } = yield (0, got_1.default)(`api/v1/apis/${apiId}`, Object.assign(Object.assign({}, gotOptions("PUT", options, logger)), { json }));
        return body;
    });
}
exports.updateApi = updateApi;
function collectionUpdate(collectionId, name, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)(`api/v1/collections/${collectionId}`, Object.assign(Object.assign({}, gotOptions("PUT", options, logger)), { json: { name } }));
        return body;
    });
}
exports.collectionUpdate = collectionUpdate;
function createCollection(name, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)("api/v1/collections", Object.assign(Object.assign({}, gotOptions("POST", options, logger)), { json: {
                name: name,
            } }));
        return body;
    });
}
exports.createCollection = createCollection;
function deleteCollection(collectionId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, got_1.default)(`api/v1/collections/${collectionId}`, gotOptions("DELETE", options, logger));
    });
}
exports.deleteCollection = deleteCollection;
function getApiNamingConvention(options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)(`api/v1/organizations/me/settings/apiNamingConvention`, gotOptions("GET", options, logger));
        return body;
    });
}
exports.getApiNamingConvention = getApiNamingConvention;
function getCollectionNamingConvention(options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)("api/v1/organizations/me/settings/collectionNamingConvention", gotOptions("GET", options, logger));
        return body;
    });
}
exports.getCollectionNamingConvention = getCollectionNamingConvention;
function getDataDictionaries(options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body: { list }, } = yield (0, got_1.default)("api/v2/dataDictionaries", gotOptions("GET", options, logger));
        return (list == null ? [] : list);
    });
}
exports.getDataDictionaries = getDataDictionaries;
function getDataDictionaryFormats(dictionaryId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body: { formats }, } = yield (0, got_1.default)(`api/v2/dataDictionaries/${dictionaryId}/formats`, gotOptions("GET", options, logger));
        if (formats === null) {
            return {};
        }
        const stringProps = ["maxLength", "minLength"];
        const integerProps = ["minimum", "maximum", "default", "example"];
        for (const value of Object.values(formats)) {
            const type = value["type"];
            let props = [];
            if (type === "integer") {
                props = integerProps;
            }
            else if (type === "string") {
                props = stringProps;
            }
            for (const prop of props) {
                if (value.hasOwnProperty(prop)) {
                    value[prop] = parseInt(value[prop], 10);
                }
            }
        }
        return formats;
    });
}
exports.getDataDictionaryFormats = getDataDictionaryFormats;
function createDefaultScanConfig(apiId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)(`api/v2/apis/${apiId}/scanConfigurations/default`, Object.assign(Object.assign({}, gotOptions("POST", options, logger)), { json: {
                name: "default",
            } }));
        return body.id;
    });
}
exports.createDefaultScanConfig = createDefaultScanConfig;
function listScanConfigs(apiId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)(`api/v2/apis/${apiId}/scanConfigurations`, Object.assign({}, gotOptions("GET", options, logger)));
        return body.list;
    });
}
exports.listScanConfigs = listScanConfigs;
function readScanConfig(configId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)(`api/v2/scanConfigurations/${configId}`, Object.assign({}, gotOptions("GET", options, logger)));
        return body;
    });
}
exports.readScanConfig = readScanConfig;
function createScanConfig(apiId, name, config, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const scanConfiguration = Buffer.from(JSON.stringify(config)).toString("base64");
        const { body } = yield (0, got_1.default)(`api/v2/apis/${apiId}/scanConfigurations`, Object.assign(Object.assign({}, gotOptions("POST", options, logger)), { json: {
                name,
                scanConfiguration,
            } }));
        return body.id;
    });
}
exports.createScanConfig = createScanConfig;
function createScanConfigNew(apiId, name, config, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const scanConfiguration = Buffer.from(JSON.stringify(config)).toString("base64");
        const { body } = yield (0, got_1.default)(`api/v2/apis/${apiId}/scanConfigurations`, Object.assign(Object.assign({}, gotOptions("POST", options, logger)), { json: {
                name,
                file: scanConfiguration,
            } }));
        return body.id;
    });
}
exports.createScanConfigNew = createScanConfigNew;
function listScanReports(apiId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)(`api/v2/apis/${apiId}/scanReports`, Object.assign({}, gotOptions("GET", options, logger)));
        return body.list;
    });
}
exports.listScanReports = listScanReports;
function readScanReport(reportId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)(`api/v2/scanReports/${reportId}`, Object.assign({}, gotOptions("GET", options, logger)));
        return body.data;
    });
}
exports.readScanReport = readScanReport;
function readScanReportNew(reportId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)(`api/v2/scanReports/${reportId}`, Object.assign({}, gotOptions("GET", options, logger)));
        return body.file;
    });
}
exports.readScanReportNew = readScanReportNew;
function readTechnicalCollection(technicalName, options, logger) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield (0, got_1.default)(`api/v1/collections/technicalName`, Object.assign(Object.assign({}, gotOptions("POST", options, logger)), { json: { technicalName } }));
            const body = response.body;
            return body.id;
        }
        catch (err) {
            if (err instanceof got_1.HTTPError && ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.statusCode) === 404) {
                return null;
            }
            throw err;
        }
    });
}
exports.readTechnicalCollection = readTechnicalCollection;
function createTechnicalCollection(technicalName, name, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)("api/v1/collections", Object.assign(Object.assign({}, gotOptions("POST", options, logger)), { json: {
                technicalName: technicalName,
                name: name,
                source: "default",
            } }));
        return body.desc.id;
    });
}
exports.createTechnicalCollection = createTechnicalCollection;
function testConnection(options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, got_1.default)("api/v2/collections?page=1&perPage=1", Object.assign(Object.assign({}, gotOptions("GET", options, logger)), { timeout: {
                    request: 5000,
                } }));
            return { success: true };
        }
        catch (ex) {
            return { success: false, message: `${ex}` };
        }
    });
}
exports.testConnection = testConnection;
function readAuditCompliance(taskId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = (yield (0, got_1.default)(`api/v2/sqgs/audit/reportComplianceStatus/${taskId}?readSqg=true&readReport=false`, Object.assign({}, gotOptions("GET", options, logger))));
        return body;
    });
}
exports.readAuditCompliance = readAuditCompliance;
function readAuditReportSqgTodo(taskId, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = (yield (0, got_1.default)(`api/v2/sqgs/audit/todo/${taskId}`, gotOptions("GET", options, logger)));
        const text = Buffer.from(body.data, "base64").toString("utf-8");
        const data = JSON.parse(text);
        return { tid: body.tid, data };
    });
}
exports.readAuditReportSqgTodo = readAuditReportSqgTodo;
//# sourceMappingURL=api.js.map