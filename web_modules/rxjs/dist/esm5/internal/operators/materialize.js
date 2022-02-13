import { Notification } from '../Notification.js';
import { operate } from '../util/lift.js';
import { OperatorSubscriber } from './OperatorSubscriber.js';
export function materialize() {
    return operate(function (source, subscriber) {
        source.subscribe(new OperatorSubscriber(subscriber, function (value) {
            subscriber.next(Notification.createNext(value));
        }, function () {
            subscriber.next(Notification.createComplete());
            subscriber.complete();
        }, function (err) {
            subscriber.next(Notification.createError(err));
            subscriber.complete();
        }));
    });
}
//# materialize.js.map