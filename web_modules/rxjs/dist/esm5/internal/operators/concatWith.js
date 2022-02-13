import { __read, __spreadArray } from "../../../../../tslib/tslib.es6.js";
import { concat } from './concat.js';
export function concatWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return concat.apply(void 0, __spreadArray([], __read(otherSources)));
}
//# concatWith.js.map