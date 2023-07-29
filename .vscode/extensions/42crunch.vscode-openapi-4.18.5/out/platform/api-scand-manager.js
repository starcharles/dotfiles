"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.deleteJobStatus = exports.readJobLog = exports.readJobStatus = exports.createJob = void 0;
const got_1 = __importDefault(require("got"));
function createJob(token, platformService, scandImage, env, connection, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)("api/job", Object.assign(Object.assign({}, gotOptions("POST", connection, logger)), { json: {
                token,
                platformService,
                scandImage,
                env,
            } }));
        return body;
    });
}
exports.createJob = createJob;
function readJobStatus(name, connection, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)(`api/job/${name}`, gotOptions("GET", connection, logger));
        return body;
    });
}
exports.readJobStatus = readJobStatus;
function readJobLog(name, connection, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { body } = yield (0, got_1.default)(`api/logs/${name}`, gotOptionsText("GET", connection, logger));
            return body;
        }
        catch (e) {
            return "" + e;
        }
    });
}
exports.readJobLog = readJobLog;
function deleteJobStatus(name, connection, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = yield (0, got_1.default)(`api/job/${name}`, gotOptions("DELETE", connection, logger));
        return body;
    });
}
exports.deleteJobStatus = deleteJobStatus;
function testConnection(connection, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, got_1.default)("api/job", Object.assign(Object.assign({}, gotOptions("GET", connection, logger)), { timeout: {
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
function gotOptions(method, connection, logger) {
    const headers = makeHeaders(connection.header, true);
    return Object.assign({ method, prefixUrl: connection.url, responseType: "json", timeout: {
            request: 10000,
        }, hooks: getHooks(method, logger) }, headers);
}
function gotOptionsText(method, connection, logger) {
    const headers = makeHeaders(connection.header, false);
    return Object.assign({ method, prefixUrl: connection.url, responseType: "text", hooks: getHooks(method, logger) }, headers);
}
function getHooks(method, logger) {
    const logRequest = (response, retryWithMergedOptions) => {
        logger.debug(`${method} ${response.url} ${response.statusCode}`);
        return response;
    };
    return {
        afterResponse: [logRequest],
    };
}
function makeHeaders(header, isJsonResponseType) {
    const headers = {};
    if (header && header.name && header.value) {
        headers[header.name] = header.value;
    }
    if (isJsonResponseType) {
        headers["Accept"] = "application/json";
    }
    return headers;
}
//# sourceMappingURL=api-scand-manager.js.map