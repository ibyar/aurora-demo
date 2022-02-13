import { map } from './map.js';
import { innerFrom } from '../observable/innerFrom.js';
import { operate } from '../util/lift.js';
import { mergeInternals } from './mergeInternals.js';
import { isFunction } from '../util/isFunction.js';
export function mergeMap(project, resultSelector, concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    if (isFunction(resultSelector)) {
        return mergeMap(function (a, i) { return map(function (b, ii) { return resultSelector(a, b, i, ii); })(innerFrom(project(a, i))); }, concurrent);
    }
    else if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return operate(function (source, subscriber) { return mergeInternals(source, subscriber, project, concurrent); });
}
//# mergeMap.js.map