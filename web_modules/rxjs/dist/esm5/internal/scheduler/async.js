import { AsyncAction } from './AsyncAction.js';
import { AsyncScheduler } from './AsyncScheduler.js';
export var asyncScheduler = new AsyncScheduler(AsyncAction);
export var async = asyncScheduler;
//# async.js.map