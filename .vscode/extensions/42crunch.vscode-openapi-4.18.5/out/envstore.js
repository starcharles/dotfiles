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
exports.EnvStore = void 0;
const vscode_1 = require("vscode");
const ENV_DEFAULT_KEY = "openapi-42crunch.environment-default";
const ENV_SECRETS_KEY = "openapi-42crunch.environment-secrets";
class EnvStore {
    constructor(memento, secret) {
        this.memento = memento;
        this.secret = secret;
        this._onEnvironmentDidChange = new vscode_1.EventEmitter();
    }
    get onEnvironmentDidChange() {
        return this._onEnvironmentDidChange.event;
    }
    save(env) {
        return __awaiter(this, void 0, void 0, function* () {
            if (env.name === "default") {
                yield this.memento.update(ENV_DEFAULT_KEY, env.environment);
            }
            else if (env.name === "secrets") {
                yield this.secret.store(ENV_SECRETS_KEY, JSON.stringify(env.environment));
            }
            this._onEnvironmentDidChange.fire(env);
        });
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            const defaultEnv = this.memento.get(ENV_DEFAULT_KEY, {});
            const secretsEnv = JSON.parse((yield this.secret.get(ENV_SECRETS_KEY)) || "{}");
            return { default: defaultEnv, secrets: secretsEnv };
        });
    }
}
exports.EnvStore = EnvStore;
//# sourceMappingURL=envstore.js.map