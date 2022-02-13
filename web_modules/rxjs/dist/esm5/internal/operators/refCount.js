import { operate } from '../util/lift.js';
import { OperatorSubscriber } from './OperatorSubscriber.js';
export function refCount() {
    return operate(function (source, subscriber) {
        var connection = null;
        source._refCount++;
        var refCounter = new OperatorSubscriber(subscriber, undefined, undefined, undefined, function () {
            if (!source || source._refCount <= 0 || 0 < --source._refCount) {
                connection = null;
                return;
            }
            var sharedConnection = source._connection;
            var conn = connection;
            connection = null;
            if (sharedConnection && (!conn || sharedConnection === conn)) {
                sharedConnection.unsubscribe();
            }
            subscriber.unsubscribe();
        });
        source.subscribe(refCounter);
        if (!refCounter.closed) {
            connection = source.connect();
        }
    });
}
//# refCount.js.map