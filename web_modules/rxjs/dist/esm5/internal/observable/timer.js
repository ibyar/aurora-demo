import { Observable } from '../Observable.js';
import { async as asyncScheduler } from '../scheduler/async.js';
import { isScheduler } from '../util/isScheduler.js';
import { isValidDate } from '../util/isDate.js';
export function timer(dueTime, intervalOrScheduler, scheduler) {
    if (dueTime === void 0) { dueTime = 0; }
    if (scheduler === void 0) { scheduler = asyncScheduler; }
    var intervalDuration = -1;
    if (intervalOrScheduler != null) {
        if (isScheduler(intervalOrScheduler)) {
            scheduler = intervalOrScheduler;
        }
        else {
            intervalDuration = intervalOrScheduler;
        }
    }
    return new Observable(function (subscriber) {
        var due = isValidDate(dueTime) ? +dueTime - scheduler.now() : dueTime;
        if (due < 0) {
            due = 0;
        }
        var n = 0;
        return scheduler.schedule(function () {
            if (!subscriber.closed) {
                subscriber.next(n++);
                if (0 <= intervalDuration) {
                    this.schedule(undefined, intervalDuration);
                }
                else {
                    subscriber.complete();
                }
            }
        }, due);
    });
}
//# timer.js.map