import { reduce } from './reduce.js';
import { isFunction } from '../util/isFunction.js';
export function max(comparer) {
    return reduce(isFunction(comparer) ? function (x, y) { return (comparer(x, y) > 0 ? x : y); } : function (x, y) { return (x > y ? x : y); });
}
//# max.js.map