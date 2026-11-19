/**
 * Compilação (parse + verificações) e execução de testes.
 *
 * A interface `ExecutionBackend` isola a UI do motor: hoje existe só o
 * `SimulatedBackend` (interpretador TypeScript no navegador). Um backend real
 * (ex.: servidor com gcc + valgrind, ou clang compilado para WebAssembly) pode
 * implementar a mesma interface no futuro sem mudar os componentes.
 */
import type { FuncDef } from './ast';
import { CompileError, CRuntimeError, type ErrorCode, type Warning } from './errors';
import { Machine, defaultNatives, type NativeFn } from './interpreter';
import { Parser } from './parser';
import { TypeEnv, sameType, typeToString } from './types';

export interface EngineError {
  code: ErrorCode;
  line: number;
  message: string;
}

export type CompileResult =
  | { ok: true; types: TypeEnv; functions: Map<string, FuncDef>; warnings: Warning[] }
  | { ok: false; error: EngineError; warnings: Warning[] };

export interface CompileOptions {
  /** Funções que o aluno precisa implementar. */
  required: string[];
}

/** Faz o parse do header do exercício (tipos/protótipos) e do código do aluno. */
export function compile(header: string, student: string, opts: CompileOptions): CompileResult {
  const types = new TypeEnv();
  let headerProtos: FuncDef[] = [];
  try {
    const hp = new Parser(header, types).parseUnit();
    headerProtos = [...hp.prototypes, ...hp.functions];
  } catch (e) {
    // Erro no header é um bug do conteúdo, não do aluno.
    const err = e as CompileError;
    return { ok: false, error: { code: err.code ?? 'SYNTAX', line: 0, message: `[header do exercício] ${err.message}` }, warnings: [] };
  }

  const studentTypes = types.clone();
  let parsed;
  const parser = new Parser(student, studentTypes);
  try {
    parsed = parser.parseUnit();
  } catch (e) {
    if (e instanceof CompileError) return { ok: false, error: { code: e.code, line: e.line, message: e.message }, warnings: parser.warnings };
    throw e;
  }

  const functions = new Map<string, FuncDef>();
  for (const p of headerProtos) functions.set(p.name, p);
  for (const p of parsed.prototypes) if (!functions.has(p.name)) functions.set(p.name, p);

  const defined = new Set<string>();
  for (const f of parsed.functions) {
    if (defined.has(f.name)) {
      return { ok: false, error: { code: 'REDECLARED', line: f.line, message: `A função '${f.name}' foi definida duas vezes.` }, warnings: parsed.warnings };
    }
    defined.add(f.name);
    const proto = headerProtos.find((p) => p.name === f.name);
    if (proto) {
      const sameParams =
        proto.params.length === f.params.length && proto.params.every((p, i) => sameType(p.type, f.params[i].type));
      if (!sameType(proto.ret, f.ret) || !sameParams) {
        const sig = (fn: FuncDef) => `${typeToString(fn.ret)} ${fn.name}(${fn.params.map((p) => typeToString(p.type)).join(', ')})`;
        return {
          ok: false,
          error: {
            code: 'TYPE_MISMATCH',
            line: f.line,
            message: `A assinatura de '${f.name}' não confere com o header. Esperado: ${sig(proto)}. Encontrado: ${sig(f)}. No exame a assinatura é dada: não a altere.`,
          },
          warnings: parsed.warnings,
        };
      }
    }
    functions.set(f.name, f);
  }

  for (const r of opts.required) {
    if (!defined.has(r)) {
      return {
        ok: false,
        error: { code: 'MISSING_FUNCTION', line: 1, message: `Não encontrei a definição da função '${r}'. Não apague a assinatura da função.` },
        warnings: parsed.warnings,
      };
    }
  }
  return { ok: true, types: studentTypes, functions, warnings: parsed.warnings };
}

// ---------------- testes ----------------

export interface TestOutcome {
  pass: boolean;
  expected: string;
  actual: string;
  /** Explicação adicional quando falha (em português). */
  message?: string;
}

export interface TestCaseDef {
  id: string;
  title: string;
  /** Descrição do cenário, em linguagem simples. */
  scenario: string;
  /** Executa: constrói os dados com `m`, chama a função do aluno e verifica. */
  run(m: Machine): TestOutcome;
}

export interface TestResult extends TestOutcome {
  id: string;
  title: string;
  scenario: string;
  error?: EngineError;
  output: string[];
  steps: number;
}

export interface RunReport {
  backend: 'simulated';
  compiled: boolean;
  compileError?: EngineError;
  warnings: Warning[];
  results: TestResult[];
}

export interface RunnableExercise {
  header: string;
  requiredFunctions: string[];
  tests: TestCaseDef[];
  natives?: Record<string, NativeFn>;
}

export interface ExecutionBackend {
  readonly kind: 'simulated' | 'real';
  readonly label: string;
  run(ex: RunnableExercise, code: string): Promise<RunReport>;
}

export function runSimulated(ex: RunnableExercise, code: string): RunReport {
  const c = compile(ex.header, code, { required: ex.requiredFunctions });
  if (!c.ok) return { backend: 'simulated', compiled: false, compileError: c.error, warnings: c.warnings, results: [] };
  const results: TestResult[] = ex.tests.map((t) => {
    const natives = defaultNatives();
    if (ex.natives) for (const [k, v] of Object.entries(ex.natives)) natives.set(k, v);
    const m = new Machine(c.types, c.functions, natives);
    try {
      const outcome = t.run(m);
      return { id: t.id, title: t.title, scenario: t.scenario, ...outcome, output: m.output, steps: m.steps };
    } catch (e) {
      if (e instanceof CRuntimeError) {
        return {
          id: t.id,
          title: t.title,
          scenario: t.scenario,
          pass: false,
          expected: '—',
          actual: 'erro de execução',
          error: { code: e.code, line: e.line, message: e.message },
          output: m.output,
          steps: m.steps,
        };
      }
      throw e;
    }
  });
  return { backend: 'simulated', compiled: true, warnings: c.warnings, results };
}

export class SimulatedBackend implements ExecutionBackend {
  readonly kind = 'simulated' as const;
  readonly label = 'Simulador ALGOLAB (subconjunto de C interpretado no navegador)';
  async run(ex: RunnableExercise, code: string): Promise<RunReport> {
    return runSimulated(ex, code);
  }
}
