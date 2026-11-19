/**
 * Interpretador do subconjunto de C do ALGOLAB.
 *
 * MODELO DE MEMÓRIA (simplificado e didático):
 *  - Toda posição de memória é uma `Cell` (variável local, campo de struct, bloco do malloc).
 *  - Um ponteiro é uma referência a uma Cell (ou null = NULL). Por isso ponteiro para
 *    ponteiro, &variavel e &node->next funcionam naturalmente.
 *  - Valores não inicializados são marcados ('uninit') e lê-los gera erro.
 *  - Blocos liberados com free() são marcados e acessá-los gera erro (dangling pointer).
 *
 * Isto NÃO é um compilador C real: não há endereços numéricos, aritmética de ponteiros,
 * arrays, nem comportamento indefinido "silencioso". Erros que em C real poderiam passar
 * despercebidos (ou causar Segmentation fault) aqui são detectados e explicados.
 */
import type { Expr, FuncDef, Stmt } from './ast';
import { CRuntimeError, type ErrorCode } from './errors';
import {
  TypeEnv,
  T_INT,
  T_VOIDPTR,
  T_CHARPTR,
  T_SIZE,
  expandedTypeString,
  isFloat,
  nominalSize,
  pointerAssignable,
  sameType,
  typeToString,
  type CType,
} from './types';

export interface Cell {
  id: number;
  value: Value;
  type: CType;
  /** Nome legível para mensagens (ex.: "node->next"). */
  name: string;
  isConst?: boolean;
  /** Alocada com malloc/calloc pelo código do aluno. */
  heap?: boolean;
  /** Criada pelo ambiente de teste (não pelo aluno). */
  harness?: boolean;
  freed?: boolean;
}

export type Value =
  | { t: 'num'; v: number; ty: CType; sizeOf?: CType }
  | { t: 'ptr'; cell: Cell | null; ty: CType; fn?: string; str?: string }
  | { t: 'struct'; sname: string; fields: Map<string, Cell>; ty: CType }
  | { t: 'uninit' }
  | { t: 'void' };

export type NativeFn = (m: Machine, args: Value[], line: number) => Value;

type Completion = 'normal' | 'break' | 'continue' | { ret: Value };

export interface MachineOptions {
  maxSteps?: number;
  maxDepth?: number;
}

const VOID: Value = { t: 'void' };

export function exprToString(e: Expr): string {
  switch (e.k) {
    case 'num':
      return String(e.v);
    case 'str':
      return JSON.stringify(e.v);
    case 'id':
      return e.name;
    case 'null':
      return 'NULL';
    case 'bin':
    case 'logic':
      return `${exprToString(e.l)} ${e.op} ${exprToString(e.r)}`;
    case 'assign':
      return `${exprToString(e.l)} ${e.op} ${exprToString(e.r)}`;
    case 'unary':
      return `${e.op}${exprToString(e.e)}`;
    case 'deref':
      return `*${wrap(e.e)}`;
    case 'addr':
      return `&${wrap(e.e)}`;
    case 'incdec':
      return e.prefix ? `${e.op}${exprToString(e.e)}` : `${exprToString(e.e)}${e.op}`;
    case 'cond':
      return `${exprToString(e.c)} ? ${exprToString(e.a)} : ${exprToString(e.b)}`;
    case 'call':
      return `${exprToString(e.callee)}(${e.args.map(exprToString).join(', ')})`;
    case 'arrow':
      return `${wrap(e.e)}->${e.field}`;
    case 'dot':
      return `${wrap(e.e)}.${e.field}`;
    case 'cast':
      return `(${typeToString(e.type)}) ${wrap(e.e)}`;
    case 'sizeof':
      return e.type ? `sizeof(${typeToString(e.type)})` : `sizeof ${exprToString(e.e!)}`;
  }
}
function wrap(e: Expr): string {
  const s = exprToString(e);
  return e.k === 'id' || e.k === 'arrow' || e.k === 'dot' || e.k === 'call' ? s : `(${s})`;
}

export class Machine {
  private nextId = 1;
  private scopes: Map<string, Cell>[] = [];
  private depth = 0;
  steps = 0;
  output: string[] = [];
  heapCells: Cell[] = [];
  readonly maxSteps: number;
  readonly maxDepth: number;
  private loopLine = 0;
  private currentFn: FuncDef[] = [];

  constructor(
    public types: TypeEnv,
    public functions: Map<string, FuncDef>,
    public natives: Map<string, NativeFn> = defaultNatives(),
    opts: MachineOptions = {},
  ) {
    this.maxSteps = opts.maxSteps ?? 50_000;
    this.maxDepth = opts.maxDepth ?? 300;
  }

  // ---------------- construção de dados (usada pelos testes) ----------------
  num(v: number, ty: CType = T_INT): Value {
    return { t: 'num', v, ty };
  }
  nullPtr(ty: CType = T_VOIDPTR): Value {
    return { t: 'ptr', cell: null, ty };
  }
  ptrTo(cell: Cell, ty?: CType): Value {
    return { t: 'ptr', cell, ty: ty ?? { k: 'ptr', to: cell.type } };
  }
  /** Cria uma célula com valor inicial "fresco" do tipo (structs com campos não inicializados). */
  newCell(type: CType, name: string, opts: { heap?: boolean; harness?: boolean; zero?: boolean } = {}): Cell {
    const cell: Cell = { id: this.nextId++, value: { t: 'uninit' }, type, name, heap: opts.heap, harness: opts.harness };
    cell.value = this.freshValue(type, name, !!opts.zero, opts.harness);
    return cell;
  }
  private freshValue(type: CType, name: string, zero: boolean, harness?: boolean): Value {
    if (type.k === 'struct') {
      const defs = this.types.fields(type.name);
      if (!defs) throw new CRuntimeError('INCOMPLETE_TYPE', 0, `struct ${type.name} é um tipo incompleto aqui: seus campos não são conhecidos.`);
      const fields = new Map<string, Cell>();
      for (const f of defs) {
        const c: Cell = { id: this.nextId++, value: { t: 'uninit' }, type: f.type, name: `${name}.${f.name}`, harness };
        c.value = this.freshValue(f.type, c.name, zero, harness);
        fields.set(f.name, c);
      }
      return { t: 'struct', sname: type.name, fields, ty: type };
    }
    if (!zero) return { t: 'uninit' };
    if (type.k === 'ptr') return { t: 'ptr', cell: null, ty: type };
    if (type.k === 'num') return { t: 'num', v: 0, ty: type };
    return { t: 'uninit' };
  }
  /** Cria uma struct no "heap" do teste e devolve a célula. */
  makeStruct(sname: string, values: Record<string, Value>, label?: string): Cell {
    const type: CType = { k: 'struct', name: sname };
    const cell = this.newCell(type, label ?? sname, { harness: true, heap: true });
    const sv = cell.value as Extract<Value, { t: 'struct' }>;
    for (const [k, v] of Object.entries(values)) {
      const fc = sv.fields.get(k);
      if (!fc) throw new Error(`Campo ${k} inexistente em ${sname}`);
      fc.value = v.t === 'ptr' ? { ...v, ty: fc.type } : v;
    }
    return cell;
  }
  field(cell: Cell, name: string): Cell {
    if (cell.value.t !== 'struct') throw new Error('não é struct');
    const f = cell.value.fields.get(name);
    if (!f) throw new Error(`campo ${name} inexistente`);
    return f;
  }

  // ---------------- chamada de função ----------------
  call(name: string, args: Value[], line = 0): Value {
    const fn = this.functions.get(name);
    if (fn?.body) return this.callUser(fn, args, line);
    const native = this.natives.get(name);
    if (native) return native(this, args, line);
    if (fn) {
      throw new CRuntimeError('MISSING_FUNCTION', line, `A função '${name}' foi declarada mas não tem implementação disponível no simulador.`);
    }
    throw new CRuntimeError('UNDECLARED', line, `Função '${name}' não declarada.`);
  }

  private callUser(fn: FuncDef, args: Value[], line: number): Value {
    if (args.length !== fn.params.length) {
      throw new CRuntimeError(
        'ARG_COUNT',
        line,
        `'${fn.name}' espera ${fn.params.length} argumento(s), mas recebeu ${args.length}.`,
      );
    }
    if (++this.depth > this.maxDepth) {
      throw new CRuntimeError(
        'STACK_OVERFLOW',
        line || fn.line,
        `Recursão profunda demais em '${fn.name}' (mais de ${this.maxDepth} chamadas aninhadas). Falta um caso base, ou a chamada recursiva não se aproxima dele?`,
      );
    }
    const savedScopes = this.scopes;
    this.scopes = [new Map()];
    this.currentFn.push(fn);
    try {
      fn.params.forEach((p, i) => {
        const cell: Cell = { id: this.nextId++, value: { t: 'uninit' }, type: p.type, name: p.name, isConst: p.isConst };
        cell.value = this.convert(args[i], p.type, `o parâmetro '${p.name}' de ${fn.name}`, line || fn.line);
        if (p.name) this.scopes[0].set(p.name, cell);
      });
      const c = this.execBlock(fn.body!.body, false);
      if (typeof c === 'object') {
        const rv = c.ret;
        if (fn.ret.k === 'void') return VOID;
        return rv;
      }
      if (fn.ret.k !== 'void') {
        throw new CRuntimeError(
          'MISSING_RETURN',
          fn.endLine,
          `A função '${fn.name}' deve retornar ${typeToString(fn.ret)}, mas a execução chegou ao fim sem passar por um 'return'.`,
        );
      }
      return VOID;
    } finally {
      this.currentFn.pop();
      this.scopes = savedScopes;
      this.depth--;
    }
  }


  // ---------------- comandos ----------------
  private tick(line: number) {
    if (++this.steps > this.maxSteps) {
      const where = this.loopLine || line;
      throw new CRuntimeError(
        'INFINITE_LOOP',
        where,
        `A execução passou de ${this.maxSteps} passos: provavelmente um laço infinito (perto da linha ${where}).`,
      );
    }
  }

  private lookup(name: string): Cell | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const c = this.scopes[i].get(name);
      if (c) return c;
    }
    return undefined;
  }

  private execBlock(body: Stmt[], newScope = true): Completion {
    if (newScope) this.scopes.push(new Map());
    try {
      for (const s of body) {
        const c = this.exec(s);
        if (c !== 'normal') return c;
      }
      return 'normal';
    } finally {
      if (newScope) this.scopes.pop();
    }
  }

  exec(s: Stmt): Completion {
    this.tick(s.line);
    switch (s.k) {
      case 'block':
        return this.execBlock(s.body);
      case 'empty':
        return 'normal';
      case 'decl': {
        const scope = this.scopes[this.scopes.length - 1];
        for (const d of s.decls) {
          if (scope.has(d.name)) {
            throw new CRuntimeError('REDECLARED', d.line, `A variável '${d.name}' já foi declarada neste bloco.`);
          }
          const cell = this.newCell(d.type, d.name);
          if (d.init) cell.value = this.convert(this.rvalue(d.init), d.type, `'${d.name}'`, d.line, d.init);
          cell.isConst = d.isConst;
          scope.set(d.name, cell);
        }
        return 'normal';
      }
      case 'expr':
        this.eval(s.e);
        return 'normal';
      case 'if':
        if (this.truthy(this.rvalue(s.c), s.c)) return this.exec(s.t);
        if (s.f) return this.exec(s.f);
        return 'normal';
      case 'while': {
        const saved = this.loopLine;
        this.loopLine = s.line;
        try {
          while (this.truthy(this.rvalue(s.c), s.c)) {
            this.tick(s.line);
            const c = this.exec(s.body);
            if (c === 'break') break;
            if (typeof c === 'object') return c;
          }
        } finally {
          this.loopLine = saved;
        }
        return 'normal';
      }
      case 'dowhile': {
        const saved = this.loopLine;
        this.loopLine = s.line;
        try {
          do {
            this.tick(s.line);
            const c = this.exec(s.body);
            if (c === 'break') break;
            if (typeof c === 'object') return c;
          } while (this.truthy(this.rvalue(s.c), s.c));
        } finally {
          this.loopLine = saved;
        }
        return 'normal';
      }
      case 'for': {
        const saved = this.loopLine;
        this.scopes.push(new Map());
        try {
          if (s.init) this.exec(s.init);
          this.loopLine = s.line;
          while (!s.c || this.truthy(this.rvalue(s.c), s.c)) {
            this.tick(s.line);
            const c = this.exec(s.body);
            if (c === 'break') break;
            if (typeof c === 'object') return c;
            if (s.step) this.eval(s.step);
          }
        } finally {
          this.scopes.pop();
          this.loopLine = saved;
        }
        return 'normal';
      }
      case 'return': {
        const fn = this.currentFn[this.currentFn.length - 1];
        if (!s.e) {
          if (fn && fn.ret.k !== 'void') {
            throw new CRuntimeError('MISSING_RETURN', s.line, `'return;' sem valor, mas '${fn.name}' deve retornar ${typeToString(fn.ret)}.`);
          }
          return { ret: VOID };
        }
        const v = this.rvalue(s.e);
        if (!fn) return { ret: v };
        if (fn.ret.k === 'void') {
          if (v.t === 'void') return { ret: VOID };
          throw new CRuntimeError('RETURN_VALUE_IN_VOID', s.line, `'${fn.name}' é void (não retorna nada), mas o return tenta devolver '${exprToString(s.e)}'.`);
        }
        return { ret: this.convert(v, fn.ret, `o valor de retorno de '${fn.name}'`, s.line, s.e) };
      }
      case 'break':
        return 'break';
      case 'continue':
        return 'continue';
    }
  }

  // ---------------- conversões ----------------
  /** Converte `v` para o tipo `target` como numa atribuição C, detectando misturas perigosas. */
  convert(v: Value, target: CType, what: string, line: number, src?: Expr): Value {
    const srcDesc = src ? `'${exprToString(src)}'` : 'o valor';
    if (v.t === 'uninit') throw new CRuntimeError('UNINIT_READ', line, `${srcDesc} não está inicializado.`);
    if (v.t === 'void') throw new CRuntimeError('TYPE_MISMATCH', line, `${srcDesc} não produz valor (é uma chamada de função void).`);
    switch (target.k) {
      case 'num':
        if (v.t === 'num') return { t: 'num', v: isFloat(target) ? v.v : this.wrapInt(Math.trunc(v.v), target), ty: target };
        if (v.t === 'ptr') {
          throw new CRuntimeError(
            'TYPE_MISMATCH',
            line,
            `${what} é do tipo ${typeToString(target)} (um número), mas ${srcDesc} é um ponteiro (${typeToString(v.ty)}). O gcc emitiria "makes integer from pointer without a cast".`,
          );
        }
        throw new CRuntimeError('TYPE_MISMATCH', line, `${what} é ${typeToString(target)}, mas ${srcDesc} é uma struct inteira.`);
      case 'ptr':
        if (v.t === 'ptr') {
          if (v.fn) {
            if (target.to.k === 'fn' || target.to.k === 'void') return { ...v, ty: target };
            throw new CRuntimeError('INCOMPATIBLE_PTR', line, `${srcDesc} é uma função, mas ${what} é ${typeToString(target)}.`);
          }
          if (!pointerAssignable(target, v.ty)) {
            throw new CRuntimeError(
              'INCOMPATIBLE_PTR',
              line,
              `Tipos de ponteiro incompatíveis: ${what} é ${typeToString(target)} (= ${expandedTypeString(target)}), mas ${srcDesc} é ${typeToString(v.ty)} (= ${expandedTypeString(v.ty)}).`,
            );
          }
          return { ...v, ty: target };
        }
        if (v.t === 'num') {
          if (v.v === 0) return { t: 'ptr', cell: null, ty: target };
          throw new CRuntimeError('TYPE_MISMATCH', line, `${what} é um ponteiro (${typeToString(target)}), mas ${srcDesc} é o número ${v.v}. Só 0/NULL pode virar ponteiro sem cast.`);
        }
        throw new CRuntimeError('TYPE_MISMATCH', line, `${what} é um ponteiro (${typeToString(target)}), mas ${srcDesc} é uma struct inteira. Talvez faltou o & (endereço)?`);
      case 'struct':
        if (v.t === 'struct' && v.sname === target.name) return this.copyStruct(v);
        throw new CRuntimeError(
          'TYPE_MISMATCH',
          line,
          `${what} é uma struct (${typeToString(target)}), mas ${srcDesc} é ${v.t === 'ptr' ? `um ponteiro (${typeToString(v.ty)}). Para copiar o conteúdo, use *${src ? exprToString(src) : 'ptr'}` : 'de outro tipo'}.`,
        );
      default:
        throw new CRuntimeError('TYPE_MISMATCH', line, `Não é possível atribuir a algo do tipo ${typeToString(target)}.`);
    }
  }

  private wrapInt(v: number, t: CType): number {
    if (t.k === 'num' && (t.name === 'size_t' || t.name === 'unsigned') && v < 0) {
      return t.name === 'size_t' ? 2 ** 64 + v : 2 ** 32 + v;
    }
    return v;
  }

  private copyStruct(v: Extract<Value, { t: 'struct' }>): Value {
    const fields = new Map<string, Cell>();
    v.fields.forEach((c, k) => {
      fields.set(k, { ...c, id: this.nextId++, value: c.value.t === 'struct' ? this.copyStruct(c.value) : c.value });
    });
    return { t: 'struct', sname: v.sname, fields, ty: v.ty };
  }

  truthy(v: Value, e: Expr): boolean {
    if (v.t === 'num') return v.v !== 0;
    if (v.t === 'ptr') return v.cell !== null || !!v.fn || v.str !== undefined;
    if (v.t === 'uninit') throw new CRuntimeError('UNINIT_READ', e.line, `'${exprToString(e)}' é usado numa condição sem ter sido inicializado.`);
    throw new CRuntimeError('TYPE_MISMATCH', e.line, `'${exprToString(e)}' não pode ser usado como condição (é ${v.t === 'struct' ? 'uma struct inteira' : 'void'}).`);
  }

  // ---------------- expressões ----------------
  /** Lê o valor armazenado numa célula, verificando inicialização e free(). */
  readCell(cell: Cell, e: Expr): Value {
    if (cell.freed) {
      throw new CRuntimeError('USE_AFTER_FREE', e.line, `'${exprToString(e)}' acessa memória que já foi liberada com free() (dangling pointer).`);
    }
    const v = cell.value;
    if (v.t === 'uninit') {
      if (cell.type.k === 'ptr') {
        throw new CRuntimeError(
          'WILD_POINTER',
          e.line,
          `O ponteiro '${exprToString(e)}' foi usado sem ter recebido um endereço (wild pointer). Inicialize-o, por exemplo com NULL ou com o endereço de um nó.`,
        );
      }
      throw new CRuntimeError('UNINIT_READ', e.line, `'${exprToString(e)}' foi lido antes de receber um valor. Em C, variáveis locais NÃO começam em 0.`);
    }
    if (v.t === 'ptr') return { ...v, ty: cell.type };
    return v;
  }

  rvalue(e: Expr): Value {
    const v = this.eval(e);
    return v;
  }

  /** Avalia uma expressão como lvalue (algo que tem endereço). */
  lvalue(e: Expr): Cell {
    switch (e.k) {
      case 'id': {
        const c = this.lookup(e.name);
        if (c) return c;
        if (this.functions.has(e.name)) throw new CRuntimeError('NOT_LVALUE', e.line, `'${e.name}' é uma função, não uma variável.`);
        throw this.undeclared(e.name, e.line);
      }
      case 'deref':
        return this.derefPtr(this.rvalue(e.e), e.e, e.line);
      case 'arrow': {
        const base = this.rvalue(e.e);
        return this.arrowField(base, e);
      }
      case 'dot': {
        const v = e.e.k === 'call' ? this.rvalue(e.e) : this.readCellValueForDot(e.e);
        return this.dotField(v, e);
      }
      default:
        throw new CRuntimeError('NOT_LVALUE', e.line, `'${exprToString(e)}' não é uma posição de memória (lvalue): não dá para atribuir a ela nem pegar seu endereço.`);
    }
  }

  private readCellValueForDot(e: Expr): Value {
    const c = this.lvalue(e);
    if (c.freed) throw new CRuntimeError('USE_AFTER_FREE', e.line, `'${exprToString(e)}' acessa memória já liberada.`);
    if (c.value.t === 'ptr' || (c.value.t === 'uninit' && c.type.k === 'ptr')) return { t: 'ptr', cell: null, ty: c.type };
    return c.value;
  }

  private undeclared(name: string, line: number): CRuntimeError {
    const suggestions: string[] = [];
    for (const s of this.scopes) s.forEach((_, k) => suggestions.push(k));
    const hint = suggestions.length ? ` Variáveis visíveis aqui: ${suggestions.join(', ')}.` : '';
    return new CRuntimeError('UNDECLARED', line, `'${name}' não foi declarado.${hint}`);
  }

  derefPtr(p: Value, src: Expr, line: number): Cell {
    const d = exprToString(src);
    if (p.t !== 'ptr') {
      throw new CRuntimeError('TYPE_MISMATCH', line, `Usou * em '${d}', mas '${d}' não é um ponteiro (${p.t === 'num' ? 'é um número' : 'é uma struct'}).`);
    }
    if (p.ty.k === 'ptr' && p.ty.to.k === 'void') {
      throw new CRuntimeError('VOID_DEREF', line, `'${d}' é void*: o compilador não sabe o tamanho nem o tipo do que está lá. Faça um cast primeiro, ex.: *((int*) ${d}).`);
    }
    if (!p.cell) {
      throw new CRuntimeError('NULL_DEREF', line, `'${d}' vale NULL, então *${d} tenta ler um endereço inválido (em C real: Segmentation fault).`);
    }
    if (p.cell.freed) {
      throw new CRuntimeError('USE_AFTER_FREE', line, `'${d}' aponta para memória já liberada com free() (dangling pointer).`);
    }
    return p.cell;
  }

  private arrowField(base: Value, e: Extract<Expr, { k: 'arrow' }>): Cell {
    const d = exprToString(e.e);
    if (base.t === 'struct') {
      throw new CRuntimeError('ARROW_ON_STRUCT', e.line, `'${d}' é uma struct (não um ponteiro). Para structs use o ponto: ${d}.${e.field}`);
    }
    if (base.t !== 'ptr') {
      throw new CRuntimeError('TYPE_MISMATCH', e.line, `'${d}' não é um ponteiro para struct; não dá para usar '->'.`);
    }
    const pt = base.ty.k === 'ptr' ? base.ty.to : base.ty;
    if (pt.k === 'void') {
      throw new CRuntimeError('VOID_DEREF', e.line, `'${d}' é void*: não dá para usar '->' sem antes converter para um ponteiro para struct.`);
    }
    if (pt.k === 'ptr') {
      throw new CRuntimeError(
        'TYPE_MISMATCH',
        e.line,
        `'${d}' é um ponteiro para ponteiro (${typeToString(base.ty)}). Primeiro desreferencie uma vez: (*${d})->${e.field}`,
      );
    }
    if (pt.k !== 'struct') {
      throw new CRuntimeError('TYPE_MISMATCH', e.line, `'${d}' aponta para ${typeToString(pt)}, que não é uma struct; '->' não se aplica.`);
    }
    if (!this.types.fields(pt.name)) {
      throw new CRuntimeError('INCOMPLETE_TYPE', e.line, `struct ${pt.name} é um tipo incompleto neste arquivo: seus campos estão escondidos (information hiding). Use as funções da API.`);
    }
    if (!base.cell) {
      throw new CRuntimeError(
        'NULL_DEREF',
        e.line,
        `'${d}' vale NULL, então '${d}->${e.field}' tenta acessar um campo de um nó que não existe (em C real: Segmentation fault).`,
      );
    }
    if (base.cell.freed) {
      throw new CRuntimeError('USE_AFTER_FREE', e.line, `'${d}' aponta para memória já liberada com free(); '${d}->${e.field}' é um acesso inválido.`);
    }
    return this.fieldOf(base.cell.value, pt.name, e.field, `${d}->${e.field}`, e.line);
  }

  private dotField(v: Value, e: Extract<Expr, { k: 'dot' }>): Cell {
    const d = exprToString(e.e);
    if (v.t === 'ptr') {
      const handle = v.ty.alias ? ` (${v.ty.alias} é um typedef de ponteiro: ${expandedTypeString(v.ty)})` : '';
      throw new CRuntimeError('DOT_ON_POINTER', e.line, `'${d}' é um ponteiro${handle}. Para acessar o campo através de um ponteiro use a seta: ${d}->${e.field}`);
    }
    if (v.t !== 'struct') throw new CRuntimeError('TYPE_MISMATCH', e.line, `'${d}' não é uma struct; '.' não se aplica.`);
    return this.fieldOf(v, v.sname, e.field, `${d}.${e.field}`, e.line);
  }

  private fieldOf(v: Value, sname: string, field: string, desc: string, line: number): Cell {
    if (v.t !== 'struct') throw new CRuntimeError('TYPE_MISMATCH', line, `'${desc}': o alvo não contém uma struct.`);
    const c = v.fields.get(field);
    if (!c) {
      const available = [...v.fields.keys()].join(', ');
      throw new CRuntimeError('UNKNOWN_FIELD', line, `struct ${sname} não tem campo '${field}'. Campos disponíveis: ${available}.`);
    }
    return c;
  }

  private assignTo(cell: Cell, v: Value, e: Expr, line: number) {
    if (cell.isConst) {
      throw new CRuntimeError('CONST_ASSIGN', line, `'${exprToString(e)}' é const e não pode ser modificado.`);
    }
    if (cell.freed) throw new CRuntimeError('USE_AFTER_FREE', line, `'${exprToString(e)}' está em memória já liberada.`);
    cell.value = this.convert(v, cell.type, `'${exprToString(e)}'`, line);
  }

  /** Tipo estático aproximado de uma expressão (usado por sizeof). */
  typeOf(e: Expr): CType {
    switch (e.k) {
      case 'id': {
        const c = this.lookup(e.name);
        if (!c) throw this.undeclared(e.name, e.line);
        return c.type;
      }
      case 'num':
        return e.isFloat ? { k: 'num', name: 'double' } : T_INT;
      case 'deref': {
        const t = this.typeOf(e.e);
        if (t.k !== 'ptr') throw new CRuntimeError('TYPE_MISMATCH', e.line, `sizeof: '${exprToString(e.e)}' não é ponteiro.`);
        return t.to;
      }
      case 'arrow': {
        const t = this.typeOf(e.e);
        if (t.k !== 'ptr' || t.to.k !== 'struct') throw new CRuntimeError('TYPE_MISMATCH', e.line, `sizeof: '${exprToString(e.e)}' não é ponteiro para struct.`);
        const f = this.types.fields(t.to.name)?.find((x) => x.name === e.field);
        if (!f) throw new CRuntimeError('UNKNOWN_FIELD', e.line, `struct ${t.to.name} não tem campo '${e.field}'.`);
        return f.type;
      }
      case 'cast':
        return e.type;
      default:
        throw new CRuntimeError('UNSUPPORTED', e.line, 'sizeof com esta expressão não é suportado pelo simulador; use sizeof(Tipo).');
    }
  }

  eval(e: Expr): Value {
    switch (e.k) {
      case 'num':
        return { t: 'num', v: e.v, ty: e.isFloat ? { k: 'num', name: 'double' } : T_INT };
      case 'str':
        return { t: 'ptr', cell: null, ty: T_CHARPTR, str: e.v };
      case 'null':
        return { t: 'ptr', cell: null, ty: T_VOIDPTR };
      case 'id': {
        const c = this.lookup(e.name);
        if (c) return this.readCell(c, e);
        if (this.functions.has(e.name) || this.natives.has(e.name)) {
          return { t: 'ptr', cell: null, fn: e.name, ty: T_VOIDPTR };
        }
        if (e.name === 'stderr' || e.name === 'stdout') return { t: 'num', v: e.name === 'stderr' ? 2 : 1, ty: T_INT };
        if (e.name === 'true' || e.name === 'false') return { t: 'num', v: e.name === 'true' ? 1 : 0, ty: T_INT };
        throw this.undeclared(e.name, e.line);
      }
      case 'deref':
      case 'arrow':
      case 'dot':
        return this.readCell(this.lvalue(e), e);
      case 'addr': {
        if (e.e.k === 'id' && !this.lookup(e.e.name) && this.functions.has(e.e.name)) {
          return { t: 'ptr', cell: null, fn: e.e.name, ty: T_VOIDPTR };
        }
        const c = this.lvalue(e.e);
        return { t: 'ptr', cell: c, ty: { k: 'ptr', to: c.type } };
      }
      case 'cast': {
        const v = this.rvalue(e.e);
        if (e.type.k === 'void') return VOID;
        if (e.type.k === 'ptr') {
          if (v.t === 'ptr') return { ...v, ty: e.type };
          if (v.t === 'num' && v.v === 0) return { t: 'ptr', cell: null, ty: e.type };
        }
        if (e.type.k === 'num' && v.t === 'num') return { t: 'num', v: isFloat(e.type) ? v.v : Math.trunc(v.v), ty: e.type };
        if (e.type.k === 'num' && v.t === 'ptr') {
          throw new CRuntimeError('UNSUPPORTED', e.line, 'Converter ponteiro em número não é suportado pelo simulador (não há endereços numéricos).');
        }
        throw new CRuntimeError('TYPE_MISMATCH', e.line, `Cast inválido de '${exprToString(e.e)}' para ${typeToString(e.type)}.`);
      }
      case 'sizeof': {
        const t = e.type ?? this.typeOf(e.e!);
        return { t: 'num', v: nominalSize(t, this.types), ty: T_SIZE, sizeOf: t };
      }
      case 'unary': {
        const v = this.rvalue(e.e);
        if (e.op === '!') return { t: 'num', v: this.truthy(v, e.e) ? 0 : 1, ty: T_INT };
        const n = this.asNum(v, e.e, e.op);
        const r = e.op === '-' ? -n.v : e.op === '~' ? ~n.v : n.v;
        return { t: 'num', v: r, ty: n.ty };
      }
      case 'logic': {
        const l = this.truthy(this.rvalue(e.l), e.l);
        if (e.op === '&&') return { t: 'num', v: l && this.truthy(this.rvalue(e.r), e.r) ? 1 : 0, ty: T_INT };
        return { t: 'num', v: l || this.truthy(this.rvalue(e.r), e.r) ? 1 : 0, ty: T_INT };
      }
      case 'bin':
        return this.binary(e.op, this.rvalue(e.l), this.rvalue(e.r), e);
      case 'cond':
        return this.truthy(this.rvalue(e.c), e.c) ? this.rvalue(e.a) : this.rvalue(e.b);
      case 'assign': {
        const cell = this.lvalue(e.l);
        let v = this.rvalue(e.r);
        if (e.op !== '=') {
          const cur = this.readCell(cell, e.l);
          v = this.binary(e.op.slice(0, 1) as '+', cur, v, e);
        }
        if (cell.isConst) throw new CRuntimeError('CONST_ASSIGN', e.line, `'${exprToString(e.l)}' é const e não pode ser modificado.`);
        if (cell.freed) throw new CRuntimeError('USE_AFTER_FREE', e.line, `'${exprToString(e.l)}' está em memória já liberada.`);
        cell.value = this.convert(v, cell.type, `'${exprToString(e.l)}'`, e.line, e.op === '=' ? e.r : undefined);
        return cell.value;
      }
      case 'incdec': {
        const cell = this.lvalue(e.e);
        const cur = this.readCell(cell, e.e);
        if (cur.t !== 'num') {
          throw new CRuntimeError(
            'UNSUPPORTED',
            e.line,
            `'${exprToString(e)}': aritmética de ponteiros não é suportada pelo simulador. Para avançar numa lista use ${exprToString(e.e)} = ${exprToString(e.e)}->next.`,
          );
        }
        const nv: Value = { t: 'num', v: cur.v + (e.op === '++' ? 1 : -1), ty: cur.ty };
        this.assignTo(cell, nv, e.e, e.line);
        return e.prefix ? cell.value : cur;
      }
      case 'call':
        return this.evalCall(e);
    }
  }

  private asNum(v: Value, e: Expr, op: string): Extract<Value, { t: 'num' }> {
    if (v.t === 'num') return v;
    if (v.t === 'ptr') {
      throw new CRuntimeError('UNSUPPORTED', e.line, `Operador '${op}' com o ponteiro '${exprToString(e)}': aritmética de ponteiros não é suportada pelo simulador.`);
    }
    if (v.t === 'uninit') throw new CRuntimeError('UNINIT_READ', e.line, `'${exprToString(e)}' não está inicializado.`);
    throw new CRuntimeError('TYPE_MISMATCH', e.line, `'${exprToString(e)}' não é um número.`);
  }

  private binary(op: string, l: Value, r: Value, e: Expr): Value {
    const le = 'l' in e ? (e as { l: Expr }).l : e;
    const re = 'r' in e ? (e as { r: Expr }).r : e;
    if (op === '==' || op === '!=') {
      let eq: boolean;
      if (l.t === 'ptr' || r.t === 'ptr') {
        eq = this.ptrEquals(l, r, le, re, e.line);
      } else {
        eq = this.asNum(l, le, op).v === this.asNum(r, re, op).v;
      }
      return { t: 'num', v: (op === '==') === eq ? 1 : 0, ty: T_INT };
    }
    const a = this.asNum(l, le, op);
    const b = this.asNum(r, re, op);
    const fl = isFloat(a.ty) || isFloat(b.ty);
    const ty = fl ? ({ k: 'num', name: 'double' } as CType) : a.ty.k === 'num' && a.ty.name === 'size_t' ? a.ty : b.ty;
    let v: number;
    switch (op) {
      case '+': v = a.v + b.v; break;
      case '-': v = a.v - b.v; break;
      case '*': v = a.v * b.v; break;
      case '/':
      case '%':
        if (b.v === 0) throw new CRuntimeError('DIV_BY_ZERO', e.line, `Divisão por zero em '${exprToString(e)}'.`);
        v = op === '/' ? (fl ? a.v / b.v : Math.trunc(a.v / b.v)) : a.v % b.v;
        break;
      case '<': return { t: 'num', v: a.v < b.v ? 1 : 0, ty: T_INT };
      case '>': return { t: 'num', v: a.v > b.v ? 1 : 0, ty: T_INT };
      case '<=': return { t: 'num', v: a.v <= b.v ? 1 : 0, ty: T_INT };
      case '>=': return { t: 'num', v: a.v >= b.v ? 1 : 0, ty: T_INT };
      case '&': v = a.v & b.v; break;
      case '|': v = a.v | b.v; break;
      case '^': v = a.v ^ b.v; break;
      default:
        throw new CRuntimeError('UNSUPPORTED', e.line, `Operador '${op}' não suportado.`);
    }
    return { t: 'num', v: fl ? v : this.wrapInt(v, ty), ty };
  }

  private ptrEquals(l: Value, r: Value, le: Expr, re: Expr, line: number): boolean {
    const norm = (v: Value, ex: Expr): { cell: Cell | null; fn?: string; ty?: CType } => {
      if (v.t === 'ptr') return { cell: v.cell, fn: v.fn, ty: v.ty };
      if (v.t === 'num' && v.v === 0) return { cell: null };
      if (v.t === 'uninit') throw new CRuntimeError('UNINIT_READ', line, `'${exprToString(ex)}' não está inicializado.`);
      throw new CRuntimeError('TYPE_MISMATCH', line, `Comparando ponteiro com '${exprToString(ex)}', que não é ponteiro nem NULL.`);
    };
    const a = norm(l, le);
    const b = norm(r, re);
    if (a.ty && b.ty && a.ty.k === 'ptr' && b.ty.k === 'ptr' && !a.fn && !b.fn && !pointerAssignable(a.ty, b.ty)) {
      throw new CRuntimeError(
        'INCOMPATIBLE_PTR',
        line,
        `Comparando ponteiros de tipos diferentes: '${exprToString(le)}' é ${typeToString(a.ty)} e '${exprToString(re)}' é ${typeToString(b.ty)}.`,
      );
    }
    return a.cell === b.cell && a.fn === b.fn;
  }

  private evalCall(e: Extract<Expr, { k: 'call' }>): Value {
    let name: string | undefined;
    if (e.callee.k === 'id' && !this.lookup(e.callee.name)) {
      name = e.callee.name;
    } else {
      const f = this.rvalue(e.callee);
      if (f.t !== 'ptr' || !f.fn) {
        if (f.t === 'ptr' && f.cell === null) throw new CRuntimeError('NULL_DEREF', e.line, `'${exprToString(e.callee)}' é um ponteiro para função NULL.`);
        throw new CRuntimeError('NOT_A_FUNCTION', e.line, `'${exprToString(e.callee)}' não é uma função.`);
      }
      name = f.fn;
    }
    const args = e.args.map((a) => this.rvalue(a));
    const fn = this.functions.get(name);
    if (fn?.body) return this.callUser(fn, args, e.line);
    if (fn && fn.params.length !== args.length && !this.natives.has(name)) {
      throw new CRuntimeError('ARG_COUNT', e.line, `'${name}' espera ${fn.params.length} argumento(s), mas recebeu ${args.length}.`);
    }
    if (fn && this.natives.has(name)) {
      // Função da API do exercício com implementação "nativa" fornecida pelo ambiente.
      const conv = args.map((a, i) => (fn.params[i] ? this.convert(a, fn.params[i].type, `o argumento ${i + 1} de ${name}`, e.line, e.args[i]) : a));
      return this.natives.get(name)!(this, conv, e.line);
    }
    return this.call(name, args, e.line);
  }

  /** Chamada a partir do ambiente de teste (empilha o FuncDef para checar returns). */
  invoke(name: string, args: Value[]): Value {
    const fn = this.functions.get(name);
    if (!fn?.body) throw new CRuntimeError('MISSING_FUNCTION', 0, `A função '${name}' não foi encontrada no seu código.`);
    return this.callUser(fn, args, 0);
  }
}

// ---------------- funções nativas (biblioteca padrão mínima) ----------------
function formatPrintf(m: Machine, args: Value[], line: number): string {
  const fmt = args[0];
  if (!fmt || fmt.t !== 'ptr' || fmt.str === undefined) {
    throw new CRuntimeError('TYPE_MISMATCH', line, 'O primeiro argumento de printf deve ser uma string literal com o formato.');
  }
  let ai = 1;
  return fmt.str.replace(/%(-?\d*)(l|ll|z|h)?([diucspfgx%])/g, (_all, _w, _len, conv: string) => {
    if (conv === '%') return '%';
    const a = args[ai++];
    if (!a) throw new CRuntimeError('ARG_COUNT', line, 'printf: faltam argumentos para o formato.');
    if (conv === 's') return a.t === 'ptr' && a.str !== undefined ? a.str : '(?)';
    if (conv === 'p') return a.t === 'ptr' ? (a.cell ? `0x${(0x1000 + a.cell.id * 16).toString(16)}` : '(nil)') : '(?)';
    if (a.t !== 'num') {
      if (a.t === 'uninit') throw new CRuntimeError('UNINIT_READ', line, 'printf recebeu um valor não inicializado.');
      throw new CRuntimeError('TYPE_MISMATCH', line, `printf: %${conv} espera um número, mas recebeu um ponteiro.`);
    }
    if (conv === 'c') return String.fromCharCode(a.v);
    if (conv === 'x') return Math.trunc(a.v).toString(16);
    if (conv === 'f') return a.v.toFixed(6);
    if (conv === 'g') return String(a.v);
    return String(Math.trunc(a.v));
  });
  void m;
}

export function defaultNatives(): Map<string, NativeFn> {
  const n = new Map<string, NativeFn>();
  n.set('printf', (m, args, line) => {
    m.output.push(formatPrintf(m, args, line));
    return { t: 'num', v: 0, ty: T_INT };
  });
  n.set('fprintf', (m, args, line) => {
    m.output.push(formatPrintf(m, args.slice(1), line));
    return { t: 'num', v: 0, ty: T_INT };
  });
  n.set('perror', (m, args) => {
    const a = args[0];
    m.output.push(`${a && a.t === 'ptr' && a.str !== undefined ? a.str : ''}: erro\n`);
    return VOID;
  });
  const alloc = (m: Machine, size: Value, line: number, zero: boolean): Value => {
    if (size.t !== 'num') throw new CRuntimeError('TYPE_MISMATCH', line, 'malloc espera um tamanho em bytes (size_t).');
    if (!size.sizeOf) {
      throw new CRuntimeError('UNSUPPORTED', line, 'No simulador, escreva o tamanho como sizeof(Tipo) ou sizeof *ptr, ex.: malloc(sizeof(upo_list_node_t)).');
    }
    const cell = m.newCell(size.sizeOf, `bloco#${m.heapCells.length + 1}`, { heap: true, zero });
    m.heapCells.push(cell);
    return { t: 'ptr', cell, ty: T_VOIDPTR };
  };
  n.set('malloc', (m, args, line) => alloc(m, args[0], line, false));
  n.set('calloc', (m, args, line) => {
    if (args[0]?.t !== 'num' || args[0].v !== 1) {
      throw new CRuntimeError('UNSUPPORTED', line, 'No simulador, calloc só é suportado como calloc(1, sizeof(Tipo)).');
    }
    return alloc(m, args[1], line, true);
  });
  n.set('free', (_m, args, line) => {
    const p = args[0];
    if (!p || p.t !== 'ptr') throw new CRuntimeError('TYPE_MISMATCH', line, 'free espera um ponteiro.');
    if (!p.cell) return VOID; // free(NULL) é permitido e não faz nada
    if (p.cell.freed) throw new CRuntimeError('DOUBLE_FREE', line, 'free chamado duas vezes no mesmo bloco (double free).');
    if (!p.cell.heap) {
      throw new CRuntimeError('INVALID_FREE', line, 'free em memória que não veio de malloc/calloc (ex.: endereço de variável local).');
    }
    p.cell.freed = true;
    return VOID;
  });
  const stop: NativeFn = (_m, _a, line) => {
    throw new CRuntimeError('ABORT', line, 'O programa chamou abort()/exit() e foi encerrado.');
  };
  n.set('abort', stop);
  n.set('exit', stop);
  return n;
}

export const _internal = { sameType };
export type { ErrorCode };
