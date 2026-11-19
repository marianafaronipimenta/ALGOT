/**
 * Códigos de erro do simulador. As explicações didáticas longas ficam em
 * src/content/errorCatalog.ts (conteúdo separado do motor).
 */
export type ErrorCode =
  | 'SYNTAX'
  | 'UNSUPPORTED'
  | 'UNDECLARED'
  | 'REDECLARED'
  | 'UNKNOWN_TYPE'
  | 'NULL_DEREF'
  | 'WILD_POINTER'
  | 'UNINIT_READ'
  | 'USE_AFTER_FREE'
  | 'DOUBLE_FREE'
  | 'INVALID_FREE'
  | 'VOID_DEREF'
  | 'ARROW_ON_STRUCT'
  | 'DOT_ON_POINTER'
  | 'UNKNOWN_FIELD'
  | 'INCOMPLETE_TYPE'
  | 'TYPE_MISMATCH'
  | 'INCOMPATIBLE_PTR'
  | 'NOT_LVALUE'
  | 'CONST_ASSIGN'
  | 'MISSING_RETURN'
  | 'RETURN_VALUE_IN_VOID'
  | 'ARG_COUNT'
  | 'NOT_A_FUNCTION'
  | 'MISSING_FUNCTION'
  | 'INFINITE_LOOP'
  | 'STACK_OVERFLOW'
  | 'DIV_BY_ZERO'
  | 'ABORT';

export class CompileError extends Error {
  constructor(
    public code: ErrorCode,
    public line: number,
    message: string,
  ) {
    super(message);
  }
}

export class CRuntimeError extends Error {
  constructor(
    public code: ErrorCode,
    public line: number,
    message: string,
  ) {
    super(message);
  }
}

export type WarningCode = 'ASSIGN_IN_CONDITION' | 'UNUSED_RESULT';

export interface Warning {
  code: WarningCode;
  line: number;
  message: string;
}
