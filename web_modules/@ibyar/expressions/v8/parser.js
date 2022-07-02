import { JavaScriptInlineParser } from './inline.js';
import { Token } from './token.js';
import { Class, ClassBody, ClassDeclaration, ClassExpression, MetaProperty, MethodDefinition, PropertyDefinition, StaticBlock, Super } from '../api/class/class.js';
import { Identifier, Literal, NullNode } from '../api/definition/values.js';
import { AssignmentExpression } from '../api/operators/assignment.js';
import { VariableDeclarationNode, VariableDeclarator } from '../api/statement/declarations/declares.js';
import { TokenStream } from './stream.js';
import { Program } from '../api/program.js';
import { ExportAllDeclaration, ExportDefaultDeclaration, ExportNamedDeclaration, ExportSpecifier } from '../api/module/export.js';
import { ImportDeclaration, ImportDefaultSpecifier, ImportExpression, ImportNamespaceSpecifier, ImportSpecifier } from '../api/module/import.js';
import { ImportAttribute } from '../api/module/common.js';
import { ClassLiteralProperty, ClassLiteralPropertyKind, classPropertyKindFor, createClassInfo, FunctionKind, FunctionSyntaxKind, isAccessor, isStrict, LanguageMode, ParseFunctionFlag, PropertyKind, PropertyKindInfo, PropertyPosition, VariableDeclarationContext } from './enums.js';
export class JavaScriptParser extends JavaScriptInlineParser {
    /**
     * parser js with
     * @param source
     * @returns
     */
    static parse(source, { mode } = {}) {
        mode ?? (mode = LanguageMode.Strict);
        const stream = (typeof source === 'string') || Array.isArray(source)
            ? TokenStream.getTokenStream(source, mode) : source;
        const parser = new JavaScriptParser(stream);
        return parser.scan();
    }
    /**
     * parse inline code like that used in html 2 or 1 way binding
     */
    static parseScript(source, options) {
        return JavaScriptInlineParser.parse(source, options);
    }
    scan() {
        const isModule = isStrict(this.languageMode);
        if (isModule) {
            this.setFunctionKind(FunctionKind.Module);
        }
        const body = isModule ? this.parseModuleItemList() : this.parseStatementList(Token.EOS);
        return new Program(isModule ? 'module' : 'script', body);
    }
    parseNewTargetExpression() {
        this.consume(Token.PERIOD);
        const target = this.parsePropertyOrPrivatePropertyName();
        if (target.toString() !== 'target') {
            throw new Error(this.errorMessage(`Expression (new.${target.toString()}) not supported.`));
        }
        return MetaProperty.NewTarget;
    }
    parseClassExpression() {
        this.consume(Token.CLASS);
        let name;
        let isStrictReserved = false;
        if (this.peekAnyIdentifier()) {
            name = this.parseAndClassifyIdentifier(this.next());
            isStrictReserved = Token.isStrictReservedWord(this.current().token);
        }
        const classLiteral = this.parseClassLiteral(name, isStrictReserved);
        return new ClassExpression(classLiteral.getBody(), classLiteral.getDecorators(), classLiteral.getId(), classLiteral.getSuperClass());
    }
    parseClassDeclaration(names, defaultExport) {
        // ClassDeclaration ::
        //   'class' Identifier ('extends' LeftHandExpression)? '{' ClassBody '}'
        //   'class' ('extends' LeftHandExpression)? '{' ClassBody '}'
        //
        // The anonymous form is allowed iff [default_export] is true.
        //
        // 'class' is expected to be consumed by the caller.
        //
        // A ClassDeclaration
        //
        //   class C { ... }
        //
        // has the same semantics as:
        //
        //   let C = class C { ... };
        //
        // so rewrite it as such.
        const nextToken = this.peek().token;
        const isStrictReserved = Token.isStrictReservedWord(nextToken);
        let name;
        let variableName;
        if (defaultExport && (nextToken == Token.EXTENDS || nextToken == Token.LBRACE)) {
            name = new Literal('default');
            variableName = '.default';
        }
        else {
            const identifier = this.parseIdentifier();
            variableName = identifier.getName();
            name = identifier;
        }
        const classLiteral = this.parseClassLiteral(name, isStrictReserved);
        return new ClassDeclaration(classLiteral.getBody(), classLiteral.getDecorators(), classLiteral.getId(), classLiteral.getSuperClass());
    }
    parseClassLiteral(name, nameIsStrictReserved) {
        const isAnonymous = !!!name;
        // All parts of a ClassDeclaration and ClassExpression are strict code.
        if (!isAnonymous) {
            if (nameIsStrictReserved) {
                throw new Error(this.errorMessage(`Unexpected Strict Reserved class name`));
            }
            if (this.isEvalOrArguments(name)) {
                throw new Error(this.errorMessage(`Strict Eval Arguments not allowed for class name`));
            }
        }
        const classInfo = createClassInfo();
        classInfo.isAnonymous = isAnonymous;
        if (this.check(Token.EXTENDS)) {
            classInfo.extends = this.parseLeftHandSideExpression();
        }
        this.expect(Token.LBRACE);
        const hasExtends = !!classInfo.extends;
        while (this.peek().isNotType(Token.RBRACE)) {
            if (this.check(Token.SEMICOLON))
                continue;
            // Either we're parsing a `static { }` initialization block or a property.
            if (this.peek().isType(Token.STATIC) && this.peekAhead().isType(Token.LBRACE)) {
                const staticBlock = this.parseClassStaticBlock(classInfo);
                classInfo.staticElements.push(staticBlock);
                classInfo.hasStaticBlocks = true;
                continue;
            }
            // FuncNameInferrerState fni_state(& fni_);
            // If we haven't seen the constructor yet, it potentially is the next
            // property.
            let isConstructor = !classInfo.hasSeenConstructor;
            const propInfo = new PropertyKindInfo();
            propInfo.position = PropertyPosition.ClassLiteral;
            const property = this.parseClassPropertyDefinition(classInfo, propInfo, hasExtends);
            // if (has_error()) return impl() . FailureExpression();
            const propertyKind = classPropertyKindFor(propInfo.kind);
            if (!classInfo.hasStaticComputedNames && propInfo.isStatic && propInfo.isComputedName) {
                classInfo.hasStaticComputedNames = true;
            }
            isConstructor && (isConstructor = classInfo.hasSeenConstructor);
            const isField = propertyKind == ClassLiteralPropertyKind.FIELD;
            if (propInfo.isPrivate) {
                if (isConstructor) {
                    throw new Error(this.errorMessage('private constructor is not allowed'));
                }
                classInfo.requiresBrand || (classInfo.requiresBrand = !isField && !propInfo.isStatic);
                const isMethod = propertyKind == ClassLiteralPropertyKind.METHOD;
                classInfo.hasPrivateMethods || (classInfo.hasPrivateMethods = isMethod);
                classInfo.hasStaticPrivateMethods || (classInfo.hasStaticPrivateMethods = isMethod && propInfo.isStatic);
                this.declarePrivateClassMember(propInfo.name, property, propertyKind, propInfo.isStatic, classInfo);
                continue;
            }
            if (isField) {
                if (propInfo.isComputedName) {
                    classInfo.computedFieldCount++;
                }
                this.declarePublicClassField(property, propInfo.isStatic, propInfo.isComputedName, classInfo);
                continue;
            }
            this.declarePublicClassMethod(name, property, isConstructor, classInfo);
        }
        this.expect(Token.RBRACE);
        const classBody = this.rewriteClassLiteral(classInfo, name);
        return new Class(classBody, [], name, classInfo.extends);
    }
    declarePublicClassMethod(name, property, isConstructor, classInfo) {
        // throw new Error('Method not implemented.');
        if (isConstructor) {
            if (classInfo.constructor) {
                throw new SyntaxError(this.errorMessage('A class may only have one constructor.'));
            }
            classInfo.constructor = property;
            // set the class name as the constructor name
            Reflect.set(classInfo.constructor, 'id', name);
            return;
        }
        classInfo.publicMembers.push(property);
    }
    declarePublicClassField(property, isStatic, isComputedName, classInfo) {
        if (isStatic) {
            classInfo.staticElements.push(property);
        }
        else {
            classInfo.instanceFields.push(property);
        }
        // if (isComputedName) {
        // 	classInfo.publicMembers.push(property);
        // }
    }
    declarePrivateClassMember(propertyName, property, kind, isStatic, classInfo) {
        classInfo.privateMembers.push(property);
    }
    // protected createPrivateNameVariable(mode: VariableMode, staticFlag: StaticFlag, propertyName: string) {
    // 	throw new Error('Method not implemented.');
    // }
    parseClassPropertyDefinition(classInfo, propInfo, hasExtends) {
        if (!classInfo) {
            throw new Error(this.errorMessage('class info is undefined'));
        }
        if (propInfo.position !== PropertyPosition.ClassLiteral) {
            throw new Error(this.errorMessage('expected property position ClassLiteral'));
        }
        const nameToken = this.peek();
        let nameExpression;
        if (nameToken.isType(Token.STATIC)) {
            this.consume(Token.STATIC);
            if (this.peek().isType(Token.LPAREN)) {
                propInfo.kind = PropertyKind.Method;
                nameExpression = this.parseIdentifier();
                propInfo.name = nameExpression.getName();
            }
            else if (this.peek().isType(Token.ASSIGN)
                || this.peek().isType(Token.SEMICOLON)
                || this.peek().isType(Token.RBRACK)) {
                nameExpression = this.parseIdentifier();
                propInfo.name = nameExpression.getName();
            }
            else {
                propInfo.isStatic = true;
                nameExpression = this.parseProperty(propInfo);
            }
        }
        else {
            nameExpression = this.parseProperty(propInfo);
        }
        switch (propInfo.kind) {
            case PropertyKind.Assign:
            case PropertyKind.ClassField:
            case PropertyKind.ShorthandOrClassField:
            case PropertyKind.NotSet: {
                // This case is a name followed by a
                // name or other property. Here we have
                // to assume that's an uninitialized
                // field followed by a line break
                // followed by a property, with ASI
                // adding the semicolon. If not, there
                // will be a syntax error after parsing
                // the first name as an uninitialized
                // field.
                propInfo.kind = PropertyKind.ClassField;
                // if (!propInfo.isComputedName) {
                // 	this.checkClassFieldName(propInfo.name, propInfo.isStatic);
                // }
                const initializer = this.parseMemberInitializer(classInfo, propInfo.isStatic);
                this.expectSemicolon();
                const result = this.newClassLiteralProperty(nameExpression, initializer, ClassLiteralPropertyKind.FIELD, propInfo.isStatic, propInfo.isComputedName, propInfo.isPrivate);
                this.setFunctionNameFromPropertyName(result, propInfo.name);
                return result;
            }
            case PropertyKind.Method: {
                // MethodDefinition
                //    PropertyName '(' StrictFormalParameters ')' '{' FunctionBody '}'
                //    '*' PropertyName '(' StrictFormalParameters ')' '{' FunctionBody '}'
                //    async PropertyName '(' StrictFormalParameters ')'
                //        '{' FunctionBody '}'
                //    async '*' PropertyName '(' StrictFormalParameters ')'
                //        '{' FunctionBody '}'
                if (!propInfo.isComputedName) {
                    this.checkClassMethodName(propInfo, classInfo);
                }
                let kind = this.methodKindFor(propInfo.isStatic, propInfo.funcFlag);
                if (!propInfo.isStatic && propInfo.name.toString() === 'constructor') {
                    classInfo.hasSeenConstructor = true;
                    kind = hasExtends ? FunctionKind.DerivedConstructor : FunctionKind.BaseConstructor;
                }
                const value = this.parseFunctionLiteral(kind, FunctionSyntaxKind.AccessorOrMethod, nameExpression);
                const result = this.newClassLiteralProperty(nameExpression, value, ClassLiteralProperty.Kind.METHOD, propInfo.isStatic, propInfo.isComputedName, propInfo.isPrivate);
                this.setFunctionNameFromPropertyName(result, propInfo.name);
                return result;
            }
            case PropertyKind.AccessorGetter:
            case PropertyKind.AccessorSetter: {
                if (propInfo.funcFlag !== ParseFunctionFlag.IsNormal) {
                    throw new Error(this.errorMessage('accessor is not normal function'));
                }
                const isGet = propInfo.kind == PropertyKind.AccessorGetter;
                if (!propInfo.isComputedName) {
                    this.checkClassMethodName(propInfo, classInfo);
                    // Make sure the name expression is a string since we need a Name for
                    // Runtime_DefineAccessorPropertyUnchecked and since we can determine
                    // this statically we can skip the extra runtime check.
                    nameExpression = new Literal(propInfo.name);
                }
                let kind;
                if (propInfo.isStatic) {
                    kind = isGet ? FunctionKind.StaticGetterFunction
                        : FunctionKind.StaticSetterFunction;
                }
                else {
                    kind = isGet ? FunctionKind.GetterFunction
                        : FunctionKind.SetterFunction;
                }
                const value = this.parseFunctionLiteral(kind, FunctionSyntaxKind.AccessorOrMethod, nameExpression);
                const propertyKind = isGet ? ClassLiteralProperty.Kind.GETTER : ClassLiteralProperty.Kind.SETTER;
                const result = this.newClassLiteralProperty(nameExpression, value, propertyKind, propInfo.isStatic, propInfo.isComputedName, propInfo.isPrivate);
                const prefix = isGet ? 'get ' : 'set ';
                this.setFunctionNameFromPropertyName(result, propInfo.name, prefix);
                return result;
            }
            case PropertyKind.Value:
            case PropertyKind.Shorthand:
            case PropertyKind.Spread:
                // throw new Error(this.errorMessage('Report Unexpected Token'));
                return NullNode;
        }
        throw new Error(this.errorMessage('UNREACHABLE'));
    }
    checkClassMethodName(propInfo, classInfo) {
        if (!(propInfo.kind == PropertyKind.Method || isAccessor(propInfo.kind))) {
            throw new Error(this.errorMessage('not kind of method or setter or getter'));
        }
        if (propInfo.isPrivate && propInfo.name.toString() === 'constructor') {
            throw new Error(this.errorMessage('constructor is private'));
        }
        else if (propInfo.isStatic && propInfo.name.toString() === 'prototype') {
            throw new Error(this.errorMessage('static prototype'));
        }
        else if (propInfo.name.toString() === 'constructor') {
            if (propInfo.funcFlag !== ParseFunctionFlag.IsNormal || isAccessor(propInfo.kind)) {
                if (propInfo.funcFlag === ParseFunctionFlag.IsGenerator) {
                    throw new Error(this.errorMessage('constructor is generator'));
                }
                else if (propInfo.funcFlag === ParseFunctionFlag.IsAsync) {
                    throw new Error(this.errorMessage('constructor is async'));
                }
                if (classInfo.hasSeenConstructor) {
                    throw new Error(this.errorMessage('duplicate constructor'));
                }
            }
            classInfo.hasSeenConstructor = true;
        }
    }
    parseClassStaticBlock(classInfo) {
        this.consume(Token.STATIC);
        // Each static block has its own var and lexical scope, so make a new var
        // block scope instead of using the synthetic members initializer function
        // scope.
        this.setStatue(true, FunctionKind.ClassStaticInitializerFunction);
        const block = this.parseBlock();
        this.restoreStatue();
        classInfo.hasStaticElements = true;
        return new StaticBlock(block.getBody());
    }
    declareClass(variableName, value, names) {
        names?.push(variableName);
        const proxy = this.declareVariable(variableName, 'let');
        return new AssignmentExpression('=', proxy, value);
    }
    declareVariable(name, mode) {
        return new VariableDeclarationNode([new VariableDeclarator(new Identifier(name))], mode);
    }
    newClassLiteralProperty(nameExpression, initializer, kind, isStatic, isComputedName, isPrivate) {
        switch (kind) {
            case ClassLiteralPropertyKind.METHOD:
                if (nameExpression.toString() === 'constructor') {
                    return new MethodDefinition('constructor', nameExpression, initializer, [], isComputedName, isStatic);
                }
                return new MethodDefinition('method', nameExpression, initializer, [], isComputedName, isStatic);
            case ClassLiteralPropertyKind.GETTER:
                return new MethodDefinition('get', nameExpression, initializer, [], isComputedName, isStatic);
            case ClassLiteralPropertyKind.SETTER:
                return new MethodDefinition('set', nameExpression, initializer, [], isComputedName, isStatic);
            case ClassLiteralPropertyKind.FIELD:
                return new PropertyDefinition(nameExpression, [], isComputedName, isStatic, initializer);
            default:
                break;
        }
        throw new Error(this.errorMessage('UNREACHABLE'));
    }
    parseMemberInitializer(classInfo, isStatic) {
        const kind = isStatic
            ? FunctionKind.ClassStaticInitializerFunction
            : FunctionKind.ClassMembersInitializerFunction;
        let initializer = undefined;
        if (this.check(Token.ASSIGN)) {
            this.setStatue(true, kind);
            initializer = this.parseAssignmentExpression();
            this.restoreStatue();
        }
        if (isStatic) {
            classInfo.hasStaticElements = true;
        }
        else {
            classInfo.hasInstanceMembers = true;
        }
        return initializer;
    }
    setFunctionNameFromPropertyName(property, name, prefix) {
        // TODO: no need for this now
        // check later when needed
        // the ClassExpression* handle this
    }
    parseSuperExpression() {
        this.consume(Token.SUPER);
        if (Token.isProperty(this.peek().token)) {
            if (this.peek().isType(Token.PERIOD) && this.peekAhead().isType(Token.PRIVATE_NAME)) {
                this.consume(Token.PERIOD);
                this.consume(Token.PRIVATE_NAME);
                throw new Error(this.errorMessage('Unexpected Private Field'));
            }
            if (this.peek().isType(Token.QUESTION_PERIOD)) {
                this.consume(Token.QUESTION_PERIOD);
                throw new Error(this.errorMessage('Optional Chaining No Super'));
            }
            return Super.INSTANCE;
        }
        throw new Error(this.errorMessage('Unexpected Super'));
    }
    rewriteClassLiteral(classInfo, name) {
        const body = [];
        if (classInfo.hasSeenConstructor) {
            body.push(classInfo.constructor);
        }
        body.push(...classInfo.staticElements);
        body.push(...classInfo.instanceFields);
        body.push(...classInfo.publicMembers);
        body.push(...classInfo.privateMembers);
        return new ClassBody(body);
    }
    parseModuleItemList() {
        // ecma262/#prod-Module
        // Module :
        //    ModuleBody?
        //
        // ecma262/#prod-ModuleItemList
        // ModuleBody :
        //    ModuleItem*
        const body = [];
        while (this.peek().isNotType(Token.EOS)) {
            const stat = this.parseModuleItem();
            if (!stat) {
                break;
            }
            if (this.isEmptyStatement(stat)) {
                continue;
            }
            body.push(stat);
        }
        return body;
    }
    parseModuleItem() {
        // ecma262/#prod-ModuleItem
        // ModuleItem :
        //    ImportDeclaration
        //    ExportDeclaration
        //    StatementListItem
        const next = this.peek();
        if (next.isType(Token.EXPORT)) {
            return this.parseExportDeclaration();
        }
        if (next.isType(Token.IMPORT)) {
            // We must be careful not to parse a dynamic import expression as an import
            // declaration. Same for import.meta expressions.
            const peekAhead = this.peekAhead();
            if (peekAhead.isNotType(Token.LPAREN) && peekAhead.isNotType(Token.PERIOD)) {
                return this.parseImportDeclaration();
                // return factory() -> EmptyStatement();
            }
        }
        return this.parseStatementListItem();
    }
    parseExportDeclaration() {
        // ExportDeclaration:
        //    'export' '*' 'from' ModuleSpecifier ';'
        //    'export' '*' 'from' ModuleSpecifier [no LineTerminator here]
        //        AssertClause ';'
        //    'export' '*' 'as' IdentifierName 'from' ModuleSpecifier ';'
        //    'export' '*' 'as' IdentifierName 'from' ModuleSpecifier
        //        [no LineTerminator here] AssertClause ';'
        //    'export' '*' 'as' ModuleExportName 'from' ModuleSpecifier ';'
        //    'export' '*' 'as' ModuleExportName 'from' ModuleSpecifier ';'
        //        [no LineTerminator here] AssertClause ';'
        //    'export' ExportClause ('from' ModuleSpecifier)? ';'
        //    'export' ExportClause ('from' ModuleSpecifier [no LineTerminator here]
        //        AssertClause)? ';'
        //    'export' VariableStatement
        //    'export' Declaration
        //    'export' 'default' ... (handled in ParseExportDefault)
        //
        // ModuleExportName :
        //   StringLiteral
        this.expect(Token.EXPORT);
        let result;
        const names = [];
        // Statement * result = nullptr;
        // ZonePtrList <const AstRawString> names(1, zone());
        // Scanner::Location loc = scanner() -> peek_location();
        switch (this.peek().token) {
            case Token.DEFAULT:
                return this.parseExportDefault();
            case Token.MUL:
                return this.parseExportStar();
            case Token.LBRACE: {
                // There are two cases here:
                //
                // 'export' ExportClause ';'
                // and
                // 'export' ExportClause FromClause ';'
                //
                // In the first case, the exported identifiers in ExportClause must
                // not be reserved words, while in the latter they may be. We
                // pass in a location that gets filled with the first reserved word
                // encountered, and then throw a SyntaxError if we are in the
                // non-FromClause case.
                // Scanner::Location reserved_loc = Scanner:: Location:: invalid();
                // Scanner::Location string_literal_local_name_loc =
                // Scanner:: Location:: invalid();
                // ZoneChunkList < ExportClauseData >* export_data =
                // ParseExportClause(& reserved_loc, & string_literal_local_name_loc);
                const exportData = this.parseExportClause();
                let moduleSpecifier;
                let importAssertions;
                if (this.checkContextualKeyword('from')) {
                    // Scanner::Location specifier_loc = scanner() -> peek_location();
                    moduleSpecifier = this.parseModuleSpecifier();
                    importAssertions = this.parseImportAssertClause();
                    this.expectSemicolon();
                    // if (exportData.isEmpty()) {
                    // 	// module() -> AddEmptyImport(module_specifier, import_assertions, specifier_loc, zone());
                    // } else {
                    // 	// for (const ExportClauseData& data : * export_data) {
                    // 	// 	module() -> AddExport(data.local_name, data.export_name,
                    // 	// 		module_specifier, import_assertions,
                    // 	// 		data.location, specifier_loc, zone());
                    // 	// }
                    // }
                }
                else {
                    // if (reserved_loc.IsValid()) {
                    // 	// No FromClause, so reserved words are invalid in ExportClause.
                    // 	ReportMessageAt(reserved_loc, MessageTemplate:: kUnexpectedReserved);
                    // 	return nullptr;
                    // } else if (string_literal_local_name_loc.IsValid()) {
                    // 	ReportMessageAt(string_literal_local_name_loc,
                    // 		MessageTemplate:: kModuleExportNameWithoutFromClause);
                    // 	return nullptr;
                    // }
                    this.expectSemicolon();
                    // for (const ExportClauseData& data : * export_data) {
                    // 	module() -> AddExport(data.local_name, data.export_name, data.location,
                    // 		zone());
                    // }
                }
                return new ExportNamedDeclaration(exportData, undefined, moduleSpecifier, importAssertions);
                // return factory() -> EmptyStatement();
            }
            case Token.FUNCTION: {
                const declaration = this.parseFunctionDeclaration();
                const identifier = declaration.getId();
                result = new ExportNamedDeclaration([new ExportSpecifier(identifier, identifier)], declaration);
                break;
            }
            case Token.CLASS: {
                this.consume(Token.CLASS);
                const declaration = this.parseClassDeclaration(names, false);
                const identifier = declaration.getId();
                result = new ExportNamedDeclaration([new ExportSpecifier(identifier, identifier)], declaration);
                break;
            }
            case Token.VAR:
            case Token.LET:
            case Token.CONST:
                const declaration = this.parseVariableStatement(VariableDeclarationContext.StatementListItem, names);
                const specifiers = declaration.getDeclarations()
                    .map(node => new ExportSpecifier(node.getId(), node.getId()));
                result = new ExportNamedDeclaration(specifiers, declaration);
                break;
            case Token.ASYNC:
                this.consume(Token.ASYNC);
                if (this.peek().isType(Token.FUNCTION) && !this.scanner.hasLineTerminatorBeforeNext()) {
                    const declaration = this.parseAsyncFunctionDeclaration(names, false);
                    const identifier = declaration.getId();
                    result = new ExportNamedDeclaration([new ExportSpecifier(identifier, identifier)], declaration);
                    break;
                }
            default:
                throw new SyntaxError(this.errorMessage('Unexpected Token'));
        }
        // loc.end_pos = scanner() -> location().end_pos;
        // SourceTextModuleDescriptor * descriptor = module();
        // for (const AstRawString* name : names) {
        // 	descriptor -> AddExport(name, name, loc, zone());
        // }
        return result;
    }
    parseImportDeclaration() {
        // ImportDeclaration :
        //   'import' ImportClause 'from' ModuleSpecifier ';'
        //   'import' ModuleSpecifier ';'
        //   'import' ImportClause 'from' ModuleSpecifier [no LineTerminator here]
        //       AssertClause ';'
        //   'import' ModuleSpecifier [no LineTerminator here] AssertClause';'
        //
        // ImportClause :
        //   ImportedDefaultBinding
        //   NameSpaceImport
        //   NamedImports
        //   ImportedDefaultBinding ',' NameSpaceImport
        //   ImportedDefaultBinding ',' NamedImports
        //
        // NameSpaceImport :
        //   '*' 'as' ImportedBinding
        this.expect(Token.IMPORT);
        const tok = this.peek();
        // 'import' ModuleSpecifier ';'
        if (tok.isType(Token.STRING)) {
            // Scanner::Location specifier_loc = scanner() -> peek_location();
            const moduleSpecifier = this.parseModuleSpecifier();
            const importAssertions = this.parseImportAssertClause();
            this.expectSemicolon();
            // module() -> AddEmptyImport(module_specifier, import_assertions, specifier_loc,zone());
            return new ImportDeclaration(moduleSpecifier, undefined, importAssertions);
        }
        // Parse ImportedDefaultBinding if present.
        let importDefaultBinding;
        // Scanner::Location import_default_binding_loc;
        if (tok.isNotType(Token.MUL) && tok.isNotType(Token.LBRACE)) {
            importDefaultBinding = this.parseNonRestrictedIdentifier();
            // DeclareUnboundVariable(import_default_binding, VariableMode:: kConst,kNeedsInitialization, pos);
        }
        // Parse NameSpaceImport or NamedImports if present.
        let moduleNamespaceBinding;
        let namedImports;
        // Scanner::Location module_namespace_binding_loc;
        // const ZonePtrList<const NamedImport >* named_imports = nullptr;
        if (importDefaultBinding == undefined || this.check(Token.COMMA)) {
            switch (this.peek().token) {
                case Token.MUL: {
                    this.consume(Token.MUL);
                    this.expectContextualKeyword('as');
                    moduleNamespaceBinding = this.parseNonRestrictedIdentifier();
                    // ExpectContextualKeyword(ast_value_factory() -> as_string());
                    // module_namespace_binding = ParseNonRestrictedIdentifier();
                    // module_namespace_binding_loc = scanner() -> location();
                    // DeclareUnboundVariable(module_namespace_binding, VariableMode:: kConst, kCreatedInitialized, pos);
                    break;
                }
                case Token.LBRACE:
                    namedImports = this.parseNamedImports();
                    break;
                default:
                    throw new SyntaxError(this.errorMessage('Unexpected Token'));
            }
        }
        this.expectContextualKeyword('from');
        // ExpectContextualKeyword(ast_value_factory() -> from_string());
        // Scanner::Location specifier_loc = scanner() -> peek_location();
        const moduleSpecifier = this.parseModuleSpecifier();
        const importAssertions = this.parseImportAssertClause();
        this.expectSemicolon();
        // Now that we have all the information, we can make the appropriate
        // declarations.
        // TODO(neis): Would prefer to call DeclareVariable for each case below rather
        // than above and in ParseNamedImports, but then a possible error message
        // would point to the wrong location.  Maybe have a DeclareAt version of
        // Declare that takes a location?
        const specifiers = [];
        if (moduleNamespaceBinding) {
            specifiers.push(new ImportNamespaceSpecifier(moduleNamespaceBinding));
        }
        if (importDefaultBinding) {
            specifiers.push(new ImportDefaultSpecifier(importDefaultBinding));
        }
        if (namedImports?.length) {
            specifiers.push(...namedImports);
        }
        return new ImportDeclaration(moduleSpecifier, specifiers.length ? specifiers : undefined, importAssertions);
    }
    parseImportExpressions() {
        this.consume(Token.IMPORT);
        if (this.check(Token.PERIOD)) {
            this.expectContextualKeyword('meta');
            return MetaProperty.ImportMeta;
        }
        if (this.peek().isNotType(Token.LPAREN)) {
            throw new SyntaxError(this.errorMessage('Unexpected Token'));
        }
        this.consume(Token.LPAREN);
        if (this.peek().isType(Token.RPAREN)) {
            throw new SyntaxError(this.errorMessage('Import Missing Specifier'));
        }
        this.setAcceptIN(true);
        const specifier = this.parseAssignmentExpressionCoverGrammar();
        if (this.check(Token.COMMA)) {
            if (this.check(Token.RPAREN)) {
                // A trailing comma allowed after the specifier.
                return new ImportExpression(specifier);
            }
            else {
                const importAssertions = this.parseAssignmentExpressionCoverGrammar();
                this.check(Token.COMMA); // A trailing comma is allowed after the import
                // assertions.
                this.expect(Token.RPAREN);
                return new ImportExpression(specifier, importAssertions);
            }
        }
        this.expect(Token.RPAREN);
        this.restoreAcceptIN();
        return new ImportExpression(specifier);
    }
    parseVariableStatement(varContext, names) {
        // VariableStatement ::
        //   VariableDeclarations ';'
        // The scope of a var declared variable anywhere inside a function
        // is the entire function (ECMA-262, 3rd, 10.1.3, and 12.2). Thus we can
        // transform a source-level var declaration into a (Function) Scope
        // declaration, and rewrite the source-level initialization into an assignment
        // statement. We use a block to collect multiple assignments.
        //
        // We mark the block as initializer block because we don't want the
        // rewriter to add a '.result' assignment to such a block (to get compliant
        // behavior for code such as print(eval('var x = 7')), and for cosmetic
        // reasons when pretty-printing. Also, unless an assignment (initialization)
        // is inside an initializer block, it is ignored.
        const declarations = this.parseVariableDeclarations(varContext);
        this.expectSemicolon();
        names.push(...declarations.getDeclarations().map(d => d.getId().toString()));
        return declarations;
    }
    parseImportAssertClause() {
        // AssertClause :
        //    assert '{' '}'
        //    assert '{' AssertEntries '}'
        // AssertEntries :
        //    IdentifierName: AssertionKey
        //    IdentifierName: AssertionKey , AssertEntries
        // AssertionKey :
        //     IdentifierName
        //     StringLiteral
        //   auto import_assertions = zone() -> New<ImportAssertions>(zone());
        // if (!FLAG_harmony_import_assertions) {
        // 	return import_assertions;
        // }
        // Assert clause is optional, and cannot be preceded by a LineTerminator.
        if (this.scanner.hasLineTerminatorBeforeNext() || !this.checkContextualKeyword('assert')) {
            return undefined;
        }
        this.expect(Token.LBRACE);
        const counts = {};
        const importAssertions = [];
        while (this.peek().isNotType(Token.RBRACE)) {
            let attributeKey = this.checkAndGetValue(Token.STRING);
            if (!attributeKey) {
                attributeKey = this.parsePropertyOrPrivatePropertyName();
            }
            this.expect(Token.COLON);
            const attributeValue = this.expectAndGetValue(Token.STRING);
            importAssertions.push(new ImportAttribute(attributeKey, attributeValue));
            counts[attributeKey.toString()] = (counts[attributeKey.toString()] ?? 0) + 1;
            if (counts[attributeKey.toString()] > 1) {
                // 	// It is a syntax error if two AssertEntries have the same key.
                throw new SyntaxError(this.errorMessage('Import Assertion  Duplicate Key'));
            }
            if (this.peek().isType(Token.RBRACE))
                break;
            if (!this.check(Token.COMMA)) {
                throw new SyntaxError('Unexpected Token');
            }
        }
        this.expect(Token.RBRACE);
        return importAssertions;
    }
    parseModuleSpecifier() {
        // ModuleSpecifier :
        //    StringLiteral
        return this.expectAndGetValue(Token.STRING);
    }
    parseExportClause() {
        // ExportClause :
        //   '{' '}'
        //   '{' ExportsList '}'
        //   '{' ExportsList ',' '}'
        //
        // ExportsList :
        //   ExportSpecifier
        //   ExportsList ',' ExportSpecifier
        //
        // ExportSpecifier :
        //   IdentifierName
        //   IdentifierName 'as' IdentifierName
        //   IdentifierName 'as' ModuleExportName
        //   ModuleExportName
        //   ModuleExportName 'as' ModuleExportName
        //
        // ModuleExportName :
        //   StringLiteral
        // ZoneChunkList < ExportClauseData >* export_data = zone() -> New<ZoneChunkList<ExportClauseData>>(zone());
        this.expect(Token.LBRACE);
        const exportData = [];
        let nameTok = this.peek();
        while (nameTok.isNotType(Token.RBRACE)) {
            const localName = this.parseExportSpecifierName();
            let exportName;
            if (this.checkContextualKeyword('as')) {
                exportName = this.parseExportSpecifierName();
            }
            else {
                exportName = localName;
            }
            exportData.push(new ExportSpecifier(exportName, localName));
            if (this.peek().isType(Token.RBRACE))
                break;
            if (!this.check(Token.COMMA)) {
                throw new SyntaxError('Unexpected Token');
            }
        }
        this.expect(Token.RBRACE);
        return exportData;
    }
    parseExportSpecifierName() {
        const next = this.next();
        // IdentifierName
        if (next.isType(Token.IDENTIFIER) || Token.isPropertyName(next.token)) {
            return next.getValue();
        }
        // ModuleExportName
        if (next.isType(Token.STRING)) {
            const exportName = next.getValue();
            return exportName;
        }
        throw new SyntaxError(this.errorMessage('Unexpected Token'));
    }
    parseNamedImports() {
        // NamedImports :
        //   '{' '}'
        //   '{' ImportsList '}'
        //   '{' ImportsList ',' '}'
        //
        // ImportsList :
        //   ImportSpecifier
        //   ImportsList ',' ImportSpecifier
        //
        // ImportSpecifier :
        //   BindingIdentifier
        //   IdentifierName 'as' BindingIdentifier
        //   ModuleExportName 'as' BindingIdentifier
        this.expect(Token.LBRACE);
        const result = [];
        //   auto result = zone() -> New < ZonePtrList <const NamedImport>> (1, zone());
        while (this.peek().isNotType(Token.RBRACE)) {
            const importName = this.parseExportSpecifierName();
            let localName = importName;
            // In the presence of 'as', the left-side of the 'as' can
            // be any IdentifierName. But without 'as', it must be a valid
            // BindingIdentifier.
            if (this.checkContextualKeyword('as')) {
                localName = this.parsePropertyOrPrivatePropertyName();
            }
            if (!Token.isValidIdentifier(this.current().token, LanguageMode.Strict, false, isStrict(this.languageMode))) {
                throw new SyntaxError(this.errorMessage('Unexpected Reserved Keyword'));
            }
            else if (this.isEvalOrArguments(localName)) {
                throw new SyntaxError(this.errorMessage('Strict Eval Arguments'));
            }
            result.push(new ImportSpecifier(localName, importName));
            // DeclareUnboundVariable(localName, VariableMode:: kConst, kNeedsInitialization, position());
            // NamedImport * import = zone() -> New<NamedImport>(import_name, local_name, location);
            // result-> Add(import, zone());
            if (this.peek().isType(Token.RBRACE))
                break;
            this.expect(Token.COMMA);
        }
        this.expect(Token.RBRACE);
        return result;
    }
    parseExportDefault() {
        //  Supports the following productions, starting after the 'default' token:
        //    'export' 'default' HoistableDeclaration
        //    'export' 'default' ClassDeclaration
        //    'export' 'default' AssignmentExpression[In] ';'
        this.expect(Token.DEFAULT);
        // Scanner::Location default_loc = scanner() -> location();
        // ZonePtrList <const AstRawString> localNames(1, zone());
        const localNames = [];
        let result;
        switch (this.peek().token) {
            case Token.FUNCTION:
                result = this.parseHoistableDeclaration(localNames, true);
                break;
            case Token.CLASS:
                this.consume(Token.CLASS);
                result = this.parseClassDeclaration(localNames, true);
                break;
            case Token.ASYNC:
                if (this.peekAhead().isType(Token.FUNCTION) && !this.scanner.hasLineTerminatorBeforeNext()) {
                    this.consume(Token.ASYNC);
                    result = this.parseHoistableDeclaration(localNames, true);
                    break;
                }
            default: {
                // int pos = position();
                // AcceptINScope scope(this, true);
                this.setAcceptIN(true);
                result = this.parseAssignmentExpression();
                // SetFunctionName(value, ast_value_factory() -> default_string());
                // const AstRawString* local_name = ast_value_factory() -> dot_default_string();
                // localNames.Add(local_name, zone());
                // It's fine to declare this as VariableMode::kConst because the user has
                // no way of writing to it.
                // VariableProxy * proxy = DeclareBoundVariable(local_name, VariableMode:: kConst, pos);
                // proxy ->var() -> set_initializer_position(position());
                // Assignment * assignment = factory() -> NewAssignment(Token.INIT, proxy, value, kNoSourcePosition);
                // result = IgnoreCompletion( factory() -> NewExpressionStatement(assignment, kNoSourcePosition));
                this.expectSemicolon();
                this.restoreAcceptIN();
                break;
            }
        }
        // if (!result) {
        // 	DCHECK_EQ(localNames.length(), 1);
        // 	module() -> AddExport(localNames.first(), ast_value_factory() -> default_string(), default_loc, zone());
        // }
        return new ExportDefaultDeclaration(result);
    }
    parseExportStar() {
        this.consume(Token.MUL);
        if (!this.peekContextualKeyword('as')) {
            // 'export' '*' 'from' ModuleSpecifier ';'
            // Scanner::Location loc = scanner() -> location();
            this.expectContextualKeyword('from');
            // Scanner::Location specifier_loc = scanner() -> peek_location();
            const moduleSpecifier = this.parseModuleSpecifier();
            const importAssertions = this.parseImportAssertClause();
            this.expectSemicolon();
            // module() -> AddStarExport(module_specifier, import_assertions, loc,specifier_loc, zone());
            return new ExportAllDeclaration(moduleSpecifier, undefined, importAssertions);
        }
        // 'export' '*' 'as' IdentifierName 'from' ModuleSpecifier ';'
        //
        // Desugaring:
        //   export * as x from "...";
        // ~>
        //   import * as .x from "..."; export {.x as x};
        //
        // Note that the desugared internal namespace export name (.x above) will
        // never conflict with a string literal export name, as literal string export
        // names in local name positions (i.e. left of 'as' or in a clause without
        // 'as') are disallowed without a following 'from' clause.
        this.expectContextualKeyword('as');
        const exportName = this.parseExportSpecifierName();
        // Scanner::Location export_name_loc = scanner() -> location();
        // const localName = this.nextInternalNamespaceExportName();
        // Scanner::Location local_name_loc = Scanner:: Location:: invalid();
        // DeclareUnboundVariable(local_name, VariableMode:: kConst, kCreatedInitialized,pos);
        this.expectContextualKeyword('from');
        const moduleSpecifier = this.parseModuleSpecifier();
        const importAssertions = this.parseImportAssertClause();
        this.expectSemicolon();
        // const specifiers = [new ExportSpecifier(exportName as Identifier, exportName as Identifier)];
        // module() -> AddStarImport(local_name, module_specifier, import_assertions,local_name_loc, specifier_loc, zone());
        // module() -> AddExport(local_name, export_name, export_name_loc, zone());
        return new ExportAllDeclaration(moduleSpecifier, exportName, importAssertions);
    }
}
//# sourceMappingURL=parser.js.map