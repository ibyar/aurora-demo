import { switchMap } from './switchMap.js';
import { operate } from '../util/lift.js';
export function switchScan(accumulator, seed) {
    return operate(function (source, subscriber) {
        var state = seed;
        switchMap(function (value, index) { return accumulator(state, value, index); }, function (_, innerValue) { return ((state = innerValue), innerValue); })(source).subscribe(subscriber);
        return function () {
            state = null;
        };
    });
}
//# switchScan.js.map