var ExpressionStatement_1;
import { __decorate, __metadata } from "../../../../tslib/tslib.es6.js";
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { isDeclarationExpression } from '../utils.js';
let ExpressionStatement = ExpressionStatement_1 = class ExpressionStatement extends AbstractExpressionNode {
    constructor(body) {
        super();
        this.body = body;
    }
    static fromJSON(node, deserializer) {
        return new ExpressionStatement_1(node.body.map(line => deserializer(line)));
    }
    static visit(node, visitNode) {
        node.body.forEach(visitNode);
    }
    getBody() {
        return this.body;
    }
    shareVariables(scopeList) {
        this.body.forEach(statement => statement.shareVariables(scopeList));
    }
    set(stack, value) {
        throw new Error(`ExpressionStatement#set() has no implementation.`);
    }
    get(stack) {
        let value;
        this.body.forEach(node => value = node.get(stack));
        return value;
    }
    dependency(computed) {
        return this.body.flatMap(exp => exp.dependency(computed));
    }
    dependencyPath(computed) {
        return this.body.flatMap(node => node.dependencyPath(computed));
    }
    toString() {
        return this.body
            .map(node => ({ insert: !isDeclarationExpression(node), string: node.toString() }))
            .map(ref => `${ref.string}${ref.insert ? ';' : ''}`)
            .join('\n');
    }
    toJson() {
        return { body: this.body.map(exp => exp.toJSON()) };
    }
};
ExpressionStatement = ExpressionStatement_1 = __decorate([
    Deserializer('ExpressionStatement'),
    __metadata("design:paramtypes", [Array])
], ExpressionStatement);
export { ExpressionStatement };
//# sourceMappingURL=statement.js.map