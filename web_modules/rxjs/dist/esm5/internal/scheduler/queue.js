import { QueueAction } from './QueueAction.js';
import { QueueScheduler } from './QueueScheduler.js';
export var queueScheduler = new QueueScheduler(QueueAction);
export var queue = queueScheduler;
//# queue.js.map