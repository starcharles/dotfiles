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
exports.ImportedUrlStore = void 0;
const KEY = "openapi-42crunch.imported-urls";
const MAX_SIZE = 100;
class ImportedUrlStore {
    constructor(context) {
        this.context = context;
    }
    getUrl(apiId) {
        const imported = this.context.globalState.get(KEY);
        if (imported) {
            const found = imported.filter((entry) => entry.apiId === apiId);
            if (found.length > 0) {
                return found[0].url;
            }
        }
    }
    setUrl(apiId, url) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const imported = (_a = this.context.globalState.get(KEY)) !== null && _a !== void 0 ? _a : [];
            const cleaned = imported.filter((entry) => entry.apiId !== apiId);
            cleaned.push({ apiId, url: url.toString() });
            if (cleaned.length > MAX_SIZE) {
                cleaned.shift();
            }
            yield this.context.globalState.update(KEY, cleaned);
        });
    }
}
exports.ImportedUrlStore = ImportedUrlStore;
//# sourceMappingURL=imported-url-store.js.map