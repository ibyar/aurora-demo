import { operate } from '../util/lift.js';
import { OperatorSubscriber } from './OperatorSubscriber.js';
import { innerFrom } from '../observable/innerFrom.js';
import { noop } from '../util/noop.js';
export function skipUntil(notifier) {
    return operate(function (source, subscriber) {
        var taking = false;
        var skipSubscriber = new OperatorSubscriber(subscriber, function () {
            skipSubscriber === null || skipSubscriber === void 0 ? void 0 : skipSubscriber.unsubscribe();
            taking = true;
        }, noop);
        innerFrom(notifier).subscribe(skipSubscriber);
        source.subscribe(new OperatorSubscriber(subscriber, function (value) { return taking && subscriber.next(value); }));
    });
}
//# skipUntil.js.map