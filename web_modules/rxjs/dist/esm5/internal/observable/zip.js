import { __read, __spreadArray } from "../../../../../tslib/tslib.es6.js";
import { Observable } from '../Observable.js';
import { innerFrom } from './innerFrom.js';
import { argsOrArgArray } from '../util/argsOrArgArray.js';
import { EMPTY } from './empty.js';
import { OperatorSubscriber } from '../operators/OperatorSubscriber.js';
import { popResultSelector } from '../util/args.js';
export function zip() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var resultSelector = popResultSelector(args);
    var sources = argsOrArgArray(args);
    return sources.length
        ? new Observable(function (subscriber) {
            var buffers = sources.map(function () { return []; });
            var completed = sources.map(function () { return false; });
            subscriber.add(function () {
                buffers = completed = null;
            });
            var _loop_1 = function (sourceIndex) {
                innerFrom(sources[sourceIndex]).subscribe(new OperatorSubscriber(subscriber, function (value) {
                    buffers[sourceIndex].push(value);
                    if (buffers.every(function (buffer) { return buffer.length; })) {
                        var result = buffers.map(function (buffer) { return buffer.shift(); });
                        subscriber.next(resultSelector ? resultSelector.apply(void 0, __spreadArray([], __read(result))) : result);
                        if (buffers.some(function (buffer, i) { return !buffer.length && completed[i]; })) {
                            subscriber.complete();
                        }
                    }
                }, function () {
                    completed[sourceIndex] = true;
                    !buffers[sourceIndex].length && subscriber.complete();
                }));
            };
            for (var sourceIndex = 0; !subscriber.closed && sourceIndex < sources.length; sourceIndex++) {
                _loop_1(sourceIndex);
            }
            return function () {
                buffers = completed = null;
            };
        })
        : EMPTY;
}
//# zip.js.map