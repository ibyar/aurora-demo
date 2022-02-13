import { map } from './map.js';
import { innerFrom } from '../observable/innerFrom.js';
import { operate } from '../util/lift.js';
import { OperatorSubscriber } from './OperatorSubscriber.js';
export function exhaustMap(project, resultSelector) {
    if (resultSelector) {
        return function (source) {
            return source.pipe(exhaustMap(function (a, i) { return innerFrom(project(a, i)).pipe(map(function (b, ii) { return resultSelector(a, b, i, ii); })); }));
        };
    }
    return operate(function (source, subscriber) {
        var index = 0;
        var innerSub = null;
        var isComplete = false;
        source.subscribe(new OperatorSubscriber(subscriber, function (outerValue) {
            if (!innerSub) {
                innerSub = new OperatorSubscriber(subscriber, undefined, function () {
                    innerSub = null;
                    isComplete && subscriber.complete();
                });
                innerFrom(project(outerValue, index++)).subscribe(innerSub);
            }
        }, function () {
            isComplete = true;
            !innerSub && subscriber.complete();
        }));
    });
}
//# exhaustMap.js.map