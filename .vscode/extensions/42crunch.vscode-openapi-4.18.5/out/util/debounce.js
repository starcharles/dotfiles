"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = void 0;
function debounce(fn, options) {
    let timer;
    return (...args) => {
        return new Promise((resolve) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                resolve(fn(...args));
            }, options.delay);
        });
    };
}
exports.debounce = debounce;
//# sourceMappingURL=debounce.js.map