import { Observable } from '../Observable.js';
import { noop } from '../util/noop.js';
export var NEVER = new Observable(noop);
export function never() {
    return NEVER;
}
//# never.js.map