import { isEmptyElement } from '../attributes/tags.js';
import { DomElementNode, CommentNode, parseTextChild, TextContent, LiveTextContent, DomFragmentNode, DomStructuralDirectiveNode, DomAttributeDirectiveNode } from '../ast/dom.js';
import { directiveRegistry } from '../directives/register-directive.js';
export class EscapeHTMLCharacter {
    constructor() {
        const escapeRegexSource = '(?:' + Object.keys(EscapeHTMLCharacter.ESCAPE_MAP).join('|') + ')';
        this.test = new RegExp(escapeRegexSource);
        this.replace = new RegExp(escapeRegexSource, 'g');
    }
    escaper(match) {
        return EscapeHTMLCharacter.ESCAPE_MAP[match];
    }
    unescape(text) {
        if (!text) {
            return text;
        }
        return this.test.test(text) ? text.replace(this.replace, this.escaper) : text;
    }
}
EscapeHTMLCharacter.ESCAPE_MAP = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x60;': '`'
};
export class NodeParser {
    constructor() {
        this.tagNameRegExp = /[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF]/;
        this.commentOpenCount = 0;
        this.commentCloseCount = 0;
        this.escaper = new EscapeHTMLCharacter();
    }
    get currentNode() {
        return this.stackTrace[this.stackTrace.length - 1];
    }
    parse(html) {
        this.reset();
        for (; this.index < html.length; this.index++) {
            this.stateFn = this.stateFn(html[this.index]);
        }
        if (this.tempText && this.stateFn === this.parseText) {
            this.stateFn('<');
        }
        if (this.stackTrace.length > 0) {
            console.error(this.stackTrace);
            throw new Error(`error parsing html, had ${this.stackTrace.length} element, with no closing tag`);
        }
        let stack = this.childStack;
        this.reset();
        return stack;
    }
    reset() {
        this.index = 0;
        this.childStack = [];
        this.stackTrace = [];
        this.propType = 'attr';
        this.commentOpenCount = 0;
        this.commentCloseCount = 0;
        this.stateFn = this.parseText;
        this.propertyName = this.propertyValue = this.tempText = '';
    }
    parseText(token) {
        if (token === '<') {
            if (this.tempText) {
                this.tempText = this.escaper.unescape(this.tempText);
                this.stackTrace.push(this.tempText);
                this.popElement();
                this.tempText = '';
            }
            return this.parseTag;
        }
        this.tempText += token;
        return this.parseText;
    }
    parseTag(token) {
        if (token === '/') {
            return this.parseCloseTag;
        }
        if (token === '!') {
            this.commentOpenCount = 0;
            this.commentCloseCount = 0;
            return this.parseComment;
        }
        this.index--;
        return this.parseOpenTag;
    }
    parseComment(token) {
        if (token === '-') {
            if (this.commentOpenCount < 2) {
                this.commentOpenCount++;
            }
            else {
                this.commentCloseCount++;
            }
            return this.parseComment;
        }
        else if (token === '>' && this.commentCloseCount === 2) {
            this.tempText = this.escaper.unescape(this.tempText);
            this.stackTrace.push(new CommentNode(this.tempText.trim()));
            this.popElement();
            this.tempText = '';
            this.commentOpenCount = 0;
            this.commentCloseCount = 0;
            return this.parseText;
        }
        if (this.commentCloseCount > 0) {
            for (let i = 0; i < this.commentCloseCount; i++) {
                this.tempText += '-';
            }
            this.commentCloseCount = 0;
        }
        this.tempText += token;
        return this.parseComment;
    }
    parseCloseTag(token) {
        if (token === '>') {
            if (!isEmptyElement(this.currentNode.tagName)
                && this.currentNode.tagName.trim().toLowerCase() !== this.tempText.trim().toLowerCase()) {
                throw 'Wrong closed tag at char ' + this.index;
            }
            this.popElement();
            this.tempText = '';
            return this.parseText;
        }
        this.tempText += token;
        return this.parseCloseTag;
    }
    parseOpenTag(token) {
        if (token === '>') {
            this.stackTrace.push(new DomElementNode(this.tempText));
            if (isEmptyElement(this.tempText)) {
                this.popElement();
            }
            this.tempText = '';
            return this.parseText;
        }
        else if (this.tagNameRegExp.test(token)) {
            this.tempText += token;
            return this.parseOpenTag;
        }
        else if (/\s/.test(token)) {
            this.stackTrace.push(new DomElementNode(this.tempText));
            this.tempText = '';
            this.propType = 'attr';
            return this.parsePropertyName;
        }
        throw new SyntaxError('Error while parsing open tag');
    }
    parsePropertyName(token) {
        if (token === '>') {
            if (this.tempText.trim()) {
                this.propertyName = this.tempText;
                this.currentNode.addAttribute(this.propertyName, true);
                this.propertyName, this.propertyValue = this.tempText = '';
            }
            if (isEmptyElement(this.currentNode.tagName)) {
                this.popElement();
            }
            this.tempText = '';
            return this.parseText;
        }
        else if (token === '/') {
            return this.parsePropertyName;
        }
        else if (/\[/.test(token)) {
            this.propType = 'input';
            return this.parseInputOutput;
        }
        else if (/\(|@/.test(token)) {
            this.propType = 'output';
            return this.parseInputOutput;
        }
        else if (/#/.test(token)) {
            this.propType = 'ref-name';
            return this.parseRefName;
        }
        else if (/=/.test(token)) {
            this.propertyName = this.tempText;
            this.tempText = '';
            return this.parsePropertyName;
        }
        else if (/"/.test(token)) {
            return this.parsePropertyValue;
        }
        else if (/\d/.test(token)) {
            this.tempText += token;
            return this.parsePropertyValue;
        }
        else if (/\s/.test(token)) {
            if (this.tempText.trim()) {
                this.propertyName = this.tempText;
                this.currentNode.addAttribute(this.propertyName, true);
                this.propertyName, this.propertyValue = this.tempText = '';
            }
            return this.parsePropertyName;
        }
        this.tempText += token;
        return this.parsePropertyName;
    }
    parseRefName(token) {
        if (/=/.test(token)) {
            return this.parseRefName;
        }
        else if (/"/.test(token)) {
            this.propertyName = this.tempText;
            this.tempText = '';
            return this.parsePropertyValue;
        }
        else if (/\s/.test(token)) {
            this.currentNode.setTemplateRefName(this.tempText, '');
            this.propertyName = this.tempText = '';
            this.propType = 'attr';
            return this.parsePropertyName;
        }
        else if (/>/.test(token)) {
            this.currentNode.setTemplateRefName(this.tempText, '');
            this.propertyName = this.tempText = '';
            this.propType = 'attr';
            return this.parseText;
        }
        this.tempText += token;
        return this.parseRefName;
    }
    parseInputOutput(token) {
        if (/\(/.test(token)) {
            this.propType = 'two-way';
            return this.parseInputOutput;
        }
        else if (/\)|\]|=/.test(token)) {
            return this.parseInputOutput;
        }
        else if (/"/.test(token)) {
            this.propertyName = this.tempText;
            this.tempText = '';
            return this.parsePropertyValue;
        }
        this.tempText += token;
        return this.parseInputOutput;
    }
    parsePropertyValue(token) {
        if (/"/.test(token)) {
            this.propertyValue = this.tempText;
            switch (this.propType) {
                case 'input':
                    this.currentNode.addInput(this.propertyName, this.propertyValue);
                    break;
                case 'output':
                    this.currentNode.addOutput(this.propertyName, this.propertyValue);
                    break;
                case 'two-way':
                    this.currentNode.addTwoWayBinding(this.propertyName, this.propertyValue);
                    break;
                case 'ref-name':
                    this.currentNode.setTemplateRefName(this.propertyName, this.propertyValue);
                    break;
                case 'attr':
                default:
                    if (/^([-+]?\d*\.?\d+)(?:[eE]([-+]?\d+))?$/.test(this.propertyValue.trim())) {
                        this.currentNode.addAttribute(this.propertyName, +this.propertyValue.trim());
                    }
                    else if (/^(true|false)$/.test(this.propertyValue.trim().toLowerCase())) {
                        if (this.propertyValue.trim().toLowerCase() === 'true') {
                            this.currentNode.addAttribute(this.propertyName, true);
                        }
                        else {
                            this.currentNode.addAttribute(this.propertyName, false);
                        }
                    }
                    else {
                        this.currentNode.addAttribute(this.propertyName, this.propertyValue);
                    }
            }
            this.propertyName, this.propertyValue = this.tempText = '';
            this.propType = 'attr';
            return this.parsePropertyName;
        }
        this.tempText += token;
        return this.parsePropertyValue;
    }
    popElement() {
        const element = this.stackTrace.pop();
        if (element) {
            const parent = this.stackTrace.pop();
            if (parent && parent instanceof DomElementNode) {
                if (typeof element === 'string') {
                    parent.addTextChild(element);
                }
                else if (element instanceof DomElementNode) {
                    parent.addChild(this.checkNode(element));
                }
                else {
                    parent.addChild(element);
                }
                this.stackTrace.push(parent);
            }
            else {
                if (typeof element === 'string') {
                    parseTextChild(element).forEach(text => this.childStack.push(text));
                }
                else if (element instanceof DomElementNode) {
                    this.childStack.push(this.checkNode(element));
                }
                else {
                    this.childStack.push(element);
                }
            }
        }
    }
    checkNode(node) {
        const attributes = node.attributes;
        if (attributes) {
            let temp;
            temp = attributes.find(attr => attr.name === 'is');
            if (temp) {
                attributes.splice(attributes.indexOf(temp), 1);
                node.is = temp.value;
            }
            temp = attributes.filter(attr => {
                return typeof attr.value === 'string' && (/\{\{(.+)\}\}/g).test(attr.value);
            });
            if (temp?.length) {
                temp.forEach(templateAttrs => {
                    attributes.splice(attributes.indexOf(templateAttrs), 1);
                    node.addTemplateAttr(templateAttrs.name, templateAttrs.value);
                });
            }
            temp = attributes.filter(attr => attr.name.startsWith('on'));
            if (temp?.length) {
                temp.forEach(templateAttrs => {
                    attributes.splice(attributes.indexOf(templateAttrs), 1);
                    node.addOutput(templateAttrs.name.substring(2), templateAttrs.value);
                });
            }
        }
        const directiveNames = this.extractDirectiveNames(node);
        let sdName;
        if (directiveNames.length) {
            const directives = [];
            directiveNames.forEach(attributeName => {
                if (attributeName.startsWith('*')) {
                    if (sdName) {
                        console.error(`Only one Structural Directive is allowed on an element [${sdName}, ${attributeName}]`);
                        return;
                    }
                    sdName = attributeName;
                    return;
                }
                const directive = new DomAttributeDirectiveNode(attributeName);
                if (directiveRegistry.get(attributeName).hasAttributes()) {
                    this.extractDirectiveAttributesFromNode(attributeName, directive, node);
                }
                directives.push(directive);
            });
            if (directives.length) {
                node.attributeDirectives = directives;
            }
        }
        if (sdName) {
            const temp = node.attributes.filter(attr => attr.name == sdName)[0];
            node.attributes.splice(node.attributes.indexOf(temp), 1);
            const isTemplate = node.tagName === 'template';
            const directiveNode = isTemplate ? new DomFragmentNode(node.children) : node;
            const directive = (typeof temp?.value === 'boolean')
                ? new DomStructuralDirectiveNode(temp.name, directiveNode)
                : new DomStructuralDirectiveNode(temp.name, directiveNode, String(temp.value));
            const directiveName = temp.name.substring(1);
            if (isTemplate) {
                directive.inputs = node.inputs;
                directive.outputs = node.outputs;
                directive.attributes = node.attributes;
                directive.templateAttrs = node.templateAttrs;
                directive.attributeDirectives = node.attributeDirectives;
            }
            else if (directiveRegistry.hasAttributes(directiveName)) {
                this.extractDirectiveAttributesFromNode(directiveName, directive, node);
                directive.attributeDirectives = node.attributeDirectives;
            }
            if (isTemplate && node.templateRefName) {
                node.children = [directive];
                return node;
            }
            return directive;
        }
        if (directiveRegistry.has('*' + node.tagName)) {
            const children = new DomFragmentNode(node.children);
            const directive = new DomStructuralDirectiveNode('*' + node.tagName, children);
            directive.inputs = node.inputs;
            directive.outputs = node.outputs;
            directive.attributes = node.attributes;
            directive.templateAttrs = node.templateAttrs;
            directive.attributeDirectives = node.attributeDirectives;
            return directive;
        }
        return node;
    }
    extractDirectiveAttributesFromNode(directiveName, directive, node) {
        const attributes = directiveRegistry.getAttributes(directiveName);
        if (!attributes) {
            return;
        }
        const filterByAttrName = createFilterByAttrName(attributes);
        directive.attributes = node.attributes?.filter(filterByAttrName);
        directive.inputs = node.inputs?.filter(filterByAttrName);
        directive.outputs = node.outputs?.filter(filterByAttrName);
        directive.twoWayBinding = node.twoWayBinding?.filter(filterByAttrName);
        directive.templateAttrs = node.templateAttrs?.filter(filterByAttrName);
        node.inputs && directive.inputs?.forEach(createArrayCleaner(node.inputs));
        node.outputs && directive.outputs?.forEach(createArrayCleaner(node.outputs));
        node.twoWayBinding && directive.twoWayBinding?.forEach(createArrayCleaner(node.twoWayBinding));
        node.attributes && directive.attributes?.forEach(createArrayCleaner(node.attributes));
        node.templateAttrs && directive.templateAttrs?.forEach(createArrayCleaner(node.templateAttrs));
    }
    extractDirectiveNames(node) {
        const names = [];
        if (node.attributes?.length) {
            names.push(...this.getAttributeDirectives(node.attributes));
        }
        if (node.inputs?.length) {
            names.push(...this.getAttributeDirectives(node.inputs));
        }
        if (node.twoWayBinding?.length) {
            names.push(...this.getAttributeDirectives(node.twoWayBinding));
        }
        if (node.templateAttrs?.length) {
            names.push(...this.getAttributeDirectives(node.templateAttrs));
        }
        if (node.outputs?.length) {
            names.push(...this.getAttributeDirectives(node.outputs));
        }
        return names;
    }
    getAttributeDirectives(attributes) {
        return directiveRegistry.filterDirectives(attributes.map(attr => attr.name));
    }
}
function createFilterByAttrName(attributes) {
    return (attr) => attributes.includes(attr.name);
}
function createArrayCleaner(attributes) {
    return (attr) => attributes.splice(attributes.indexOf(attr), 1);
}
export class HTMLParser {
    constructor() {
        this.nodeParser = new NodeParser();
    }
    parse(html) {
        return this.nodeParser.parse(html);
    }
    toDomRootNode(html) {
        let stack = this.nodeParser.parse(html);
        if (!stack || stack.length === 0) {
            return new DomFragmentNode([new TextContent('')]);
        }
        else if (stack?.length === 1) {
            return stack[0];
        }
        else {
            return new DomFragmentNode(stack);
        }
    }
    stringify(stack) {
        let html = '';
        stack?.forEach(node => {
            if (node instanceof TextContent) {
                html += node.value;
            }
            else if (node instanceof LiveTextContent) {
                html += `{{${node.value}}}`;
            }
            else if (node instanceof CommentNode) {
                html += `<!-- ${node.comment} -->`;
            }
            else if (node instanceof DomElementNode) {
                let attrs = '';
                if (node.attributes) {
                    attrs += node.attributes.map(attr => `${attr.name}="${attr.value}"`).join(' ') + ' ';
                }
                if (node.twoWayBinding) {
                    attrs += node.twoWayBinding.map(attr => `[(${attr.name})]="${attr.value}"`).join(' ').concat(' ');
                }
                if (node.inputs) {
                    attrs += node.inputs.map(attr => `[${attr.name}]="${attr.value}"`).join(' ').concat(' ');
                }
                if (node.outputs) {
                    attrs += node.outputs.map(attr => `(${attr.name})="${attr.value}"`).join(' ').concat(' ');
                }
                if (node.templateAttrs) {
                    attrs += node.templateAttrs.map(attr => `${attr.name}="${attr.value}"`).join(' ').concat(' ');
                }
                if (isEmptyElement(node.tagName)) {
                    if (attrs) {
                        html += `<${node.tagName} ${attrs}/>`;
                    }
                    else {
                        html += `<${node.tagName} />`;
                    }
                }
                else {
                    let children = this.stringify(node.children);
                    if (attrs && children) {
                        html += `<${node.tagName} ${attrs}>${children}</${node.tagName}>`;
                    }
                    else if (attrs) {
                        html += `<${node.tagName} ${attrs}></${node.tagName}>`;
                    }
                    else if (children) {
                        html += `<${node.tagName}>${children}<</${node.tagName}>`;
                    }
                    else {
                        html += `<${node.tagName}></${node.tagName}>`;
                    }
                }
            }
        });
        return html;
    }
}
export const htmlParser = new HTMLParser();
//# sourceMappingURL=html-parser.js.map