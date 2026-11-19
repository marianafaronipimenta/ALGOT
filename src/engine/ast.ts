import type { CType } from './types';

export type BinOp = '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '<' | '>' | '<=' | '>=' | '&' | '|' | '^';
export type AssignOp = '=' | '+=' | '-=' | '*=' | '/=' | '%=';

export type Expr =
  | { k: 'num'; v: number; isFloat: boolean; line: number }
  | { k: 'str'; v: string; line: number }
  | { k: 'id'; name: string; line: number }
  | { k: 'null'; line: number }
  | { k: 'bin'; op: BinOp; l: Expr; r: Expr; line: number }
  | { k: 'logic'; op: '&&' | '||'; l: Expr; r: Expr; line: number }
  | { k: 'assign'; op: AssignOp; l: Expr; r: Expr; line: number }
  | { k: 'unary'; op: '!' | '-' | '+' | '~'; e: Expr; line: number }
  | { k: 'deref'; e: Expr; line: number }
  | { k: 'addr'; e: Expr; line: number }
  | { k: 'incdec'; op: '++' | '--'; prefix: boolean; e: Expr; line: number }
  | { k: 'cond'; c: Expr; a: Expr; b: Expr; line: number }
  | { k: 'call'; callee: Expr; args: Expr[]; line: number }
  | { k: 'arrow'; e: Expr; field: string; line: number }
  | { k: 'dot'; e: Expr; field: string; line: number }
  | { k: 'cast'; type: CType; e: Expr; line: number }
  | { k: 'sizeof'; type?: CType; e?: Expr; line: number };

export interface VarDecl {
  name: string;
  type: CType;
  /** const no nível do próprio objeto (não pode ser reatribuído). */
  isConst: boolean;
  init?: Expr;
  line: number;
}

export type Stmt =
  | { k: 'block'; body: Stmt[]; line: number }
  | { k: 'decl'; decls: VarDecl[]; line: number }
  | { k: 'expr'; e: Expr; line: number }
  | { k: 'if'; c: Expr; t: Stmt; f?: Stmt; line: number }
  | { k: 'while'; c: Expr; body: Stmt; line: number }
  | { k: 'dowhile'; c: Expr; body: Stmt; line: number }
  | { k: 'for'; init?: Stmt; c?: Expr; step?: Expr; body: Stmt; line: number }
  | { k: 'return'; e?: Expr; line: number }
  | { k: 'break'; line: number }
  | { k: 'continue'; line: number }
  | { k: 'empty'; line: number };

export interface Param {
  name: string;
  type: CType;
  isConst: boolean;
}

export interface FuncDef {
  name: string;
  ret: CType;
  params: Param[];
  body?: Stmt & { k: 'block' };
  line: number;
  endLine: number;
}
