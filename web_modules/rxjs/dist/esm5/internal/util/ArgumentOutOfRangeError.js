import { createErrorClass } from './createErrorClass.js';
export var ArgumentOutOfRangeError = createErrorClass(function (_super) {
    return function ArgumentOutOfRangeErrorImpl() {
        _super(this);
        this.name = 'ArgumentOutOfRangeError';
        this.message = 'argument out of range';
    };
});
//# ArgumentOutOfRangeError.js.map