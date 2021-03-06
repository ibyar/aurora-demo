import { Observable } from '../Observable.js';
import { isFunction } from '../util/isFunction.js';
export function throwError(errorOrErrorFactory, scheduler) {
    var errorFactory = isFunction(errorOrErrorFactory) ? errorOrErrorFactory : function () { return errorOrErrorFactory; };
    var init = function (subscriber) { return subscriber.error(errorFactory()); };
    return new Observable(scheduler ? function (subscriber) { return scheduler.schedule(init, 0, subscriber); } : init);
}
//# sourceMappingURL=throwError.js.map