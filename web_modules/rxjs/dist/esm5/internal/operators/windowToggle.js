import { __values } from "../../../../../tslib/tslib.es6.js";
import { Subject } from '../Subject.js';
import { Subscription } from '../Subscription.js';
import { operate } from '../util/lift.js';
import { innerFrom } from '../observable/innerFrom.js';
import { OperatorSubscriber } from './OperatorSubscriber.js';
import { noop } from '../util/noop.js';
import { arrRemove } from '../util/arrRemove.js';
export function windowToggle(openings, closingSelector) {
    return operate(function (source, subscriber) {
        var windows = [];
        var handleError = function (err) {
            while (0 < windows.length) {
                windows.shift().error(err);
            }
            subscriber.error(err);
        };
        innerFrom(openings).subscribe(new OperatorSubscriber(subscriber, function (openValue) {
            var window = new Subject();
            windows.push(window);
            var closingSubscription = new Subscription();
            var closeWindow = function () {
                arrRemove(windows, window);
                window.complete();
                closingSubscription.unsubscribe();
            };
            var closingNotifier;
            try {
                closingNotifier = innerFrom(closingSelector(openValue));
            }
            catch (err) {
                handleError(err);
                return;
            }
            subscriber.next(window.asObservable());
            closingSubscription.add(closingNotifier.subscribe(new OperatorSubscriber(subscriber, closeWindow, noop, handleError)));
        }, noop));
        source.subscribe(new OperatorSubscriber(subscriber, function (value) {
            var e_1, _a;
            var windowsCopy = windows.slice();
            try {
                for (var windowsCopy_1 = __values(windowsCopy), windowsCopy_1_1 = windowsCopy_1.next(); !windowsCopy_1_1.done; windowsCopy_1_1 = windowsCopy_1.next()) {
                    var window_1 = windowsCopy_1_1.value;
                    window_1.next(value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (windowsCopy_1_1 && !windowsCopy_1_1.done && (_a = windowsCopy_1.return)) _a.call(windowsCopy_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }, function () {
            while (0 < windows.length) {
                windows.shift().complete();
            }
            subscriber.complete();
        }, handleError, function () {
            while (0 < windows.length) {
                windows.shift().unsubscribe();
            }
        }));
    });
}
//# windowToggle.js.map