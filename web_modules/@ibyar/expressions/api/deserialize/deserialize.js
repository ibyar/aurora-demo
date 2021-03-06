import { expressionTypes } from './type-store.js';
export function Deserializer(type) {
    return (target) => {
        target.type = type;
        expressionTypes.set(type, target);
        return target;
    };
}
export function getDeserializerType(target) {
    return target.type;
}
export function serializeNode(node) {
    return JSON.stringify(node);
}
/**
 * convert from json expression `JSON.stringify(node)` or `serializeNode` to `ExpressionNode`
 * @param node as type `NodeJsonType`
 * @returns ExpressionNode
 */
export function deserialize(node) {
    const fromJSON = expressionTypes.get(node.type)?.fromJSON;
    if (fromJSON) {
        return fromJSON(node, deserialize);
    }
    else {
        throw new Error(`Couldn't find Expression class for name: ${JSON.stringify(node)}.`);
    }
}
export function deserializeNode(node) {
    const exp = JSON.parse(node);
    return deserialize(exp);
}
//# sourceMappingURL=deserialize.js.map