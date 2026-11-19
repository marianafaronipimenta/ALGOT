/**
 * Parser recursivo-descendente para um subconjunto didático de C:
 * typedef, struct, ponteiros (inclusive ponteiro para ponteiro e para função),
 * funções, if/else, while, do-while, for, return, break, continue e
 * expressões com ->, ., *, &, casts e sizeof.
 *
 * Não suportado (gera erro UNSUPPORTED com explicação): arrays/indexação,
 * switch, goto, union, enum, variáveis globais, operador vírgula.
 */
import { CompileError, type Warning } from './errors';
import { tokenize, type Token } from './lexer';
import type { AssignOp, BinOp, Expr, FuncDef, Param, Stmt, VarDecl } from './ast';
import { TypeEnv, type CType, type FieldDef, type NumName } from './types';

const BASE_TYPE_KW = new Set(['int', 'char', 'long', 'short', 'unsigned', 'signed', 'double', 'float', 'void', 'size_t']);
const QUALIFIERS = new Set(['const', 'static', 'inline', 'extern']);
const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=']);
const BIN_PREC: Record<string, number> = {
  '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '<': 7, '>': 7, '<=': 7, '>=': 7,
  '+': 9, '-': 9, '*': 10, '/': 10, '%': 10,
};

export interface ParsedUnit {
  functions: FuncDef[];
  prototypes: FuncDef[];
  warnings: Warning[];
}

interface Declarator {
  name?: string;
  type: CType;
  constSelf: boolean;
  line: number;
}

export class Parser {
  private toks: Token[];
  private pos = 0;
  warnings: Warning[] = [];

  constructor(
    src: string,
    public types: TypeEnv,
  ) {
    this.toks = tokenize(src);
  }

  // ---------- utilitários ----------
  private peek(o = 0): Token {
    return this.toks[Math.min(this.pos + o, this.toks.length - 1)];
  }
  private next(): Token {
    const t = this.toks[this.pos];
    if (this.pos < this.toks.length - 1) this.pos++;
    return t;
  }
  private is(text: string, o = 0): boolean {
    const t = this.peek(o);
    return (t.kind === 'punct' || t.kind === 'keyword') && t.text === text;
  }
  private accept(text: string): boolean {
    if (this.is(text)) {
      this.next();
      return true;
    }
    return false;
  }
  private expect(text: string, hint?: string): Token {
    if (!this.is(text)) {
      const t = this.peek();
      const found = t.kind === 'eof' ? 'o fim do código' : `'${t.text}'`;
      throw new CompileError('SYNTAX', t.line, `Esperava '${text}' mas encontrei ${found}.${hint ? ' ' + hint : ''}`);
    }
    return this.next();
  }
  private expectIdent(what: string): Token {
    const t = this.peek();
    if (t.kind !== 'ident') {
      throw new CompileError('SYNTAX', t.line, `Esperava ${what} mas encontrei '${t.text}'.`);
    }
    return this.next();
  }

  isTypeStart(o = 0): boolean {
    const t = this.peek(o);
    if (t.kind === 'keyword') return BASE_TYPE_KW.has(t.text) || QUALIFIERS.has(t.text) || t.text === 'struct';
    return t.kind === 'ident' && this.types.typedefs.has(t.text);
  }

  // ---------- tipos ----------
  private parseDeclSpec(): { base: CType; constBase: boolean } {
    let constBase = false;
    let numWords: string[] = [];
    let base: CType | null = null;
    const startLine = this.peek().line;

    for (;;) {
      const t = this.peek();
      if (t.kind === 'keyword' && QUALIFIERS.has(t.text)) {
        if (t.text === 'const') constBase = true;
        this.next();
      } else if (t.kind === 'keyword' && BASE_TYPE_KW.has(t.text)) {
        numWords.push(t.text);
        this.next();
      } else if (t.kind === 'keyword' && t.text === 'struct' && !base && numWords.length === 0) {
        this.next();
        const nameTok = this.expectIdent('o nome da struct');
        const name = nameTok.text;
        this.types.declareStruct(name);
        if (this.is('{')) this.parseStructBody(name);
        base = { k: 'struct', name };
      } else if (t.kind === 'ident' && !base && numWords.length === 0 && this.types.typedefs.has(t.text)) {
        this.next();
        base = this.types.typedefs.get(t.text)!;
      } else if (t.kind === 'keyword' && (t.text === 'union' || t.text === 'enum')) {
        throw new CompileError('UNSUPPORTED', t.line, `'${t.text}' não é suportado pelo simulador do ALGOLAB nesta fase.`);
      } else {
        break;
      }
    }

    if (!base) {
      if (numWords.length === 0) {
        const t = this.peek();
        throw new CompileError('UNKNOWN_TYPE', t.line, `Tipo desconhecido: '${t.text}'. Verifique se o nome do tipo está escrito exatamente como no header.`);
      }
      base = this.numFromWords(numWords, startLine);
    }
    numWords = [];
    return { base, constBase };
  }

  private numFromWords(words: string[], line: number): CType {
    if (words.includes('void')) {
      if (words.length > 1) throw new CompileError('SYNTAX', line, 'void não pode ser combinado com outros tipos.');
      return { k: 'void' };
    }
    let name: NumName = 'int';
    if (words.includes('size_t')) name = 'size_t';
    else if (words.includes('double')) name = 'double';
    else if (words.includes('float')) name = 'float';
    else if (words.includes('char')) name = 'char';
    else if (words.includes('long')) name = 'long';
    else if (words.includes('short')) name = 'short';
    else if (words.includes('unsigned')) name = 'unsigned';
    return { k: 'num', name };
  }

  private parseStructBody(name: string) {
    this.expect('{');
    const fields: FieldDef[] = [];
    while (!this.is('}')) {
      const { base } = this.parseDeclSpec();
      do {
        const d = this.parseDeclarator(base, false, true);
        if (fields.some((f) => f.name === d.name)) {
          throw new CompileError('REDECLARED', d.line, `Campo '${d.name}' declarado duas vezes em struct ${name}.`);
        }
        fields.push({ name: d.name!, type: d.type });
      } while (this.accept(','));
      this.expect(';', 'Cada campo da struct termina com ponto e vírgula.');
    }
    this.expect('}');
    this.types.defineStruct(name, fields);
  }

  /** Lê `* const * nome` ou `(*nome)(params)`; `abstract` = sem nome (casts, sizeof, parâmetros). */
  private parseDeclarator(base: CType, constBase: boolean, requireName: boolean): Declarator {
    let type = base;
    let stars = 0;
    let lastStarConst = false;
    const line = this.peek().line;
    while (this.is('*')) {
      this.next();
      stars++;
      lastStarConst = false;
      type = { k: 'ptr', to: type };
      while (this.is('const')) {
        this.next();
        lastStarConst = true;
      }
    }

    let name: string | undefined;
    // Ponteiro para função: ret (*nome)(params)
    if (this.is('(') && this.is('*', 1)) {
      this.next();
      this.next();
      if (this.peek().kind === 'ident') name = this.next().text;
      this.expect(')');
      const params = this.parseParamList();
      type = { k: 'ptr', to: { k: 'fn', ret: type, params: params.map((p) => p.type) } };
      return { name, type, constSelf: false, line };
    }

    if (this.peek().kind === 'ident') {
      name = this.next().text;
    } else if (requireName) {
      const t = this.peek();
      throw new CompileError('SYNTAX', t.line, `Esperava um nome de variável/campo mas encontrei '${t.text}'.`);
    }

    if (this.is('[')) {
      throw new CompileError(
        'UNSUPPORTED',
        this.peek().line,
        'Arrays ([ ]) não são suportados pelo simulador nesta fase. Os exercícios atuais usam apenas ponteiros e structs.',
      );
    }
    const constSelf = stars === 0 ? constBase : lastStarConst;
    return { name, type, constSelf, line };
  }

  private parseParamList(): Param[] {
    this.expect('(');
    const params: Param[] = [];
    if (this.is('void') && this.is(')', 1)) {
      this.next();
    }
    if (!this.is(')')) {
      do {
        if (!this.isTypeStart()) {
          const t = this.peek();
          throw new CompileError('UNKNOWN_TYPE', t.line, `Esperava o tipo de um parâmetro mas encontrei '${t.text}'.`);
        }
        const { base, constBase } = this.parseDeclSpec();
        const d = this.parseDeclarator(base, constBase, false);
        params.push({ name: d.name ?? '', type: d.type, isConst: d.constSelf });
      } while (this.accept(','));
    }
    this.expect(')');
    return params;
  }

  private parseTypeName(): CType {
    const { base, constBase } = this.parseDeclSpec();
    return this.parseDeclarator(base, constBase, false).type;
  }

  // ---------- nível superior ----------
  parseUnit(): ParsedUnit {
    const functions: FuncDef[] = [];
    const prototypes: FuncDef[] = [];
    while (this.peek().kind !== 'eof') {
      const t = this.peek();
      if (this.accept(';')) continue;
      if (t.kind === 'keyword' && t.text === 'typedef') {
        this.next();
        const { base, constBase } = this.parseDeclSpec();
        do {
          const d = this.parseDeclarator(base, constBase, true);
          this.types.typedefs.set(d.name!, { ...d.type, alias: d.name } as CType);
        } while (this.accept(','));
        this.expect(';', 'Um typedef termina com ponto e vírgula.');
        continue;
      }
      if (!this.isTypeStart()) {
        throw new CompileError(
          'SYNTAX',
          t.line,
          `Esperava uma definição de função ou de tipo, mas encontrei '${t.text}'. Todo código precisa estar dentro de uma função.`,
        );
      }
      const { base, constBase } = this.parseDeclSpec();
      if (this.accept(';')) continue; // struct X { ... }; ou struct X;
      const d = this.parseDeclarator(base, constBase, true);
      if (!this.is('(')) {
        throw new CompileError('UNSUPPORTED', d.line, 'Variáveis globais não são suportadas pelo simulador. Declare variáveis dentro das funções.');
      }
      const params = this.parseParamList();
      const fn: FuncDef = { name: d.name!, ret: d.type, params, line: d.line, endLine: d.line };
      if (this.is('{')) {
        fn.body = this.parseBlock();
        fn.endLine = this.toks[this.pos - 1].line;
        functions.push(fn);
      } else {
        this.expect(';', 'Depois da assinatura de uma função vem o corpo { ... } ou ; (protótipo).');
        prototypes.push(fn);
      }
    }
    return { functions, prototypes, warnings: this.warnings };
  }

  // ---------- comandos ----------
  private parseBlock(): Stmt & { k: 'block' } {
    const line = this.expect('{').line;
    const body: Stmt[] = [];
    while (!this.is('}')) {
      if (this.peek().kind === 'eof') {
        throw new CompileError('SYNTAX', line, "Bloco aberto com '{' nunca foi fechado com '}'. Confira o pareamento das chaves.");
      }
      body.push(this.parseStmt());
    }
    this.next();
    return { k: 'block', body, line };
  }

  private checkCondition(c: Expr) {
    if (c.k === 'assign' && c.op === '=') {
      this.warnings.push({
        code: 'ASSIGN_IN_CONDITION',
        line: c.line,
        message: "Atribuição '=' usada como condição. Você quis comparar com '=='?",
      });
    }
  }

  private parseDeclStmt(): Stmt {
    const line = this.peek().line;
    const { base, constBase } = this.parseDeclSpec();
    const decls: VarDecl[] = [];
    if (this.is(';')) {
      this.next();
      return { k: 'empty', line };
    }
    do {
      const d = this.parseDeclarator(base, constBase, true);
      if (d.type.k === 'void') throw new CompileError('TYPE_MISMATCH', d.line, `A variável '${d.name}' não pode ter tipo void (talvez quisesse void*).`);
      const decl: VarDecl = { name: d.name!, type: d.type, isConst: d.constSelf, line: d.line };
      if (this.accept('=')) decl.init = this.parseAssign();
      decls.push(decl);
    } while (this.accept(','));
    this.expect(';', 'Declarações terminam com ponto e vírgula.');
    return { k: 'decl', decls, line };
  }

  private parseStmt(): Stmt {
    const t = this.peek();
    const line = t.line;
    if (this.is('{')) return this.parseBlock();
    if (this.accept(';')) return { k: 'empty', line };
    if (t.kind === 'keyword') {
      switch (t.text) {
        case 'if': {
          this.next();
          this.expect('(', "A condição do if vai entre parênteses: if (condição).");
          const c = this.parseExpr();
          this.expect(')');
          this.checkCondition(c);
          const th = this.parseStmt();
          const el = this.accept('else') ? this.parseStmt() : undefined;
          return { k: 'if', c, t: th, f: el, line };
        }
        case 'while': {
          this.next();
          this.expect('(', 'A condição do while vai entre parênteses.');
          const c = this.parseExpr();
          this.expect(')');
          this.checkCondition(c);
          return { k: 'while', c, body: this.parseStmt(), line };
        }
        case 'do': {
          this.next();
          const body = this.parseStmt();
          this.expect('while');
          this.expect('(');
          const c = this.parseExpr();
          this.expect(')');
          this.expect(';', 'do { ... } while (cond); termina com ponto e vírgula.');
          return { k: 'dowhile', c, body, line };
        }
        case 'for': {
          this.next();
          this.expect('(');
          let init: Stmt | undefined;
          if (this.accept(';')) init = undefined;
          else if (this.isTypeStart()) init = this.parseDeclStmt();
          else {
            init = { k: 'expr', e: this.parseExpr(), line };
            this.expect(';');
          }
          const c = this.is(';') ? undefined : this.parseExpr();
          if (c) this.checkCondition(c);
          this.expect(';', 'O for tem três partes separadas por ponto e vírgula: for (início; condição; passo).');
          const step = this.is(')') ? undefined : this.parseExpr();
          this.expect(')');
          return { k: 'for', init, c, step, body: this.parseStmt(), line };
        }
        case 'return': {
          this.next();
          if (this.accept(';')) return { k: 'return', line };
          const e = this.parseExpr();
          this.expect(';', 'return termina com ponto e vírgula.');
          return { k: 'return', e, line };
        }
        case 'break':
          this.next();
          this.expect(';');
          return { k: 'break', line };
        case 'continue':
          this.next();
          this.expect(';');
          return { k: 'continue', line };
        case 'else':
          throw new CompileError('SYNTAX', line, "'else' sem 'if' correspondente. Verifique as chaves antes do else.");
        case 'switch':
        case 'goto':
        case 'case':
        case 'default':
          throw new CompileError('UNSUPPORTED', line, `'${t.text}' não é suportado pelo simulador nesta fase. Use if/else.`);
        case 'typedef':
          throw new CompileError('UNSUPPORTED', line, 'typedef dentro de função não é suportado pelo simulador.');
      }
    }
    if (this.isTypeStart()) return this.parseDeclStmt();
    const e = this.parseExpr();
    this.expect(';', 'Cada instrução termina com ponto e vírgula.');
    return { k: 'expr', e, line };
  }

  // ---------- expressões ----------
  parseExpr(): Expr {
    const e = this.parseAssign();
    if (this.is(',')) {
      throw new CompileError('UNSUPPORTED', this.peek().line, 'O operador vírgula não é suportado pelo simulador. Separe em instruções distintas.');
    }
    return e;
  }

  private parseAssign(): Expr {
    const l = this.parseCond();
    const t = this.peek();
    if (t.kind === 'punct' && ASSIGN_OPS.has(t.text)) {
      this.next();
      const r = this.parseAssign();
      return { k: 'assign', op: t.text as AssignOp, l, r, line: t.line };
    }
    return l;
  }

  private parseCond(): Expr {
    const c = this.parseBin(1);
    if (this.is('?')) {
      const line = this.next().line;
      const a = this.parseExpr();
      this.expect(':', "Operador ternário: cond ? a : b.");
      const b = this.parseCond();
      return { k: 'cond', c, a, b, line };
    }
    return c;
  }

  private parseBin(minPrec: number): Expr {
    let l = this.parseUnary();
    for (;;) {
      const t = this.peek();
      const prec = t.kind === 'punct' ? BIN_PREC[t.text] : undefined;
      if (prec === undefined || prec < minPrec) return l;
      this.next();
      const r = this.parseBin(prec + 1);
      if (t.text === '&&' || t.text === '||') l = { k: 'logic', op: t.text, l, r, line: t.line };
      else l = { k: 'bin', op: t.text as BinOp, l, r, line: t.line };
    }
  }

  private parseUnary(): Expr {
    const t = this.peek();
    const line = t.line;
    if (t.kind === 'punct') {
      switch (t.text) {
        case '!':
        case '-':
        case '+':
        case '~':
          this.next();
          return { k: 'unary', op: t.text, e: this.parseUnary(), line };
        case '*':
          this.next();
          return { k: 'deref', e: this.parseUnary(), line };
        case '&':
          this.next();
          return { k: 'addr', e: this.parseUnary(), line };
        case '++':
        case '--':
          this.next();
          return { k: 'incdec', op: t.text, prefix: true, e: this.parseUnary(), line };
        case '(':
          if (this.isTypeStart(1)) {
            this.next();
            const type = this.parseTypeName();
            this.expect(')');
            return { k: 'cast', type, e: this.parseUnary(), line };
          }
      }
    }
    if (t.kind === 'keyword' && t.text === 'sizeof') {
      this.next();
      if (this.is('(') && this.isTypeStart(1)) {
        this.next();
        const type = this.parseTypeName();
        this.expect(')');
        return { k: 'sizeof', type, line };
      }
      return { k: 'sizeof', e: this.parseUnary(), line };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let e = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (this.is('(')) {
        this.next();
        const args: Expr[] = [];
        if (!this.is(')')) {
          do args.push(this.parseAssign());
          while (this.accept(','));
        }
        this.expect(')', 'Feche a lista de argumentos da chamada.');
        e = { k: 'call', callee: e, args, line: t.line };
      } else if (this.is('->')) {
        this.next();
        const f = this.expectIdent("o nome de um campo depois de '->'");
        e = { k: 'arrow', e, field: f.text, line: t.line };
      } else if (this.is('.')) {
        this.next();
        const f = this.expectIdent("o nome de um campo depois de '.'");
        e = { k: 'dot', e, field: f.text, line: t.line };
      } else if (this.is('++') || this.is('--')) {
        this.next();
        e = { k: 'incdec', op: t.text as '++' | '--', prefix: false, e, line: t.line };
      } else if (this.is('[')) {
        throw new CompileError('UNSUPPORTED', t.line, 'Indexação com [ ] não é suportada pelo simulador nesta fase.');
      } else {
        return e;
      }
    }
  }

  private parsePrimary(): Expr {
    const t = this.next();
    const line = t.line;
    switch (t.kind) {
      case 'num':
        return { k: 'num', v: t.value!, isFloat: /\./.test(t.text), line };
      case 'char':
        return { k: 'num', v: t.value!, isFloat: false, line };
      case 'string':
        return { k: 'str', v: t.text, line };
      case 'ident':
        return { k: 'id', name: t.text, line };
      case 'keyword':
        if (t.text === 'NULL') return { k: 'null', line };
        if (BASE_TYPE_KW.has(t.text) || t.text === 'struct') {
          throw new CompileError('SYNTAX', line, `O tipo '${t.text}' apareceu onde se esperava um valor. Declarações devem estar no início de uma instrução.`);
        }
        throw new CompileError('SYNTAX', line, `Palavra-chave '${t.text}' inesperada aqui.`);
      case 'punct':
        if (t.text === '(') {
          const e = this.parseExpr();
          this.expect(')', 'Parêntese aberto e não fechado.');
          return e;
        }
        throw new CompileError('SYNTAX', line, t.text === '}' || t.text === ')' ? `'${t.text}' inesperado: talvez falte uma expressão ou haja um fechamento a mais.` : `Símbolo '${t.text}' inesperado.`);
      case 'eof':
        throw new CompileError('SYNTAX', line, 'O código terminou no meio de uma expressão. Falta fechar algo?');
    }
  }
}
