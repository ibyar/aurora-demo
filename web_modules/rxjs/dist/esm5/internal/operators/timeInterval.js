import { asyncScheduler } from '../scheduler/async.js';
import { scan } from './scan.js';
import { defer } from '../observable/defer.js';
import { map } from './map.js';
export function timeInterval(scheduler) {
    if (scheduler === void 0) { scheduler = asyncScheduler; }
    return function (source) {
        return defer(function () {
            return source.pipe(scan(function (_a, value) {
                var current = _a.current;
                return ({ value: value, current: scheduler.now(), last: current });
            }, {
                current: scheduler.now(),
                value: undefined,
                last: undefined,
            }), map(function (_a) {
                var current = _a.current, last = _a.last, value = _a.value;
                return new TimeInterval(value, current - last);
            }));
        });
    };
}
var TimeInterval = (function () {
    function TimeInterval(value, interval) {
        this.value = value;
        this.interval = interval;
    }
    return TimeInterval;
}());
export { TimeInterval };
//# timeInterval.js.map