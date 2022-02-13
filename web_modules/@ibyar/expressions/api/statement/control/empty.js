var EmptyStatement_1;
import { __decorate, __metadata } from "../../../../../tslib/tslib.es6.js";
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
let EmptyStatement = EmptyStatement_1 = class EmptyStatement extends AbstractExpressionNode {
    constructor() {
        super();
        this.semicolon = ';';
    }
    static fromJSON(node) {
        return EmptyStatement_1.INSTANCE;
    }
    shareVariables(scopeList) { }
    set(stack, value) {
        throw new Error(`EmptyStatement#set() has no implementation.`);
    }
    get(stack) {
        return void 0;
    }
    dependency(computed) {
        return [];
    }
    dependencyPath(computed) {
        return [];
    }
    toString() {
        return this.semicolon;
    }
    toJson() {
        return {};
    }
};
EmptyStatement.INSTANCE = Object.freeze(new EmptyStatement_1());
EmptyStatement = EmptyStatement_1 = __decorate([
    Deserializer('EmptyStatement'),
    __metadata("design:paramtypes", [])
], EmptyStatement);
export { EmptyStatement };
//# empty.js.map