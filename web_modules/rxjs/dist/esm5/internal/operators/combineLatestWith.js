import { __read, __spreadArray } from "../../../../../tslib/tslib.es6.js";
import { combineLatest } from './combineLatest.js';
export function combineLatestWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return combineLatest.apply(void 0, __spreadArray([], __read(otherSources)));
}
//# sourceMappingURL=combineLatestWith.js.map