/** Utilitários para montar dados de teste dentro do simulador. */
import type { Cell, Machine, Value } from '../../engine/interpreter';
import type { TestOutcome } from '../../engine/runner';
import type { CType } from '../../engine/types';

const nodeType = (sname: string): CType => ({ k: 'ptr', to: { k: 'struct', name: sname } });

export interface BuiltList {
  handle: Value;
  container: Cell | null;
  nodes: Cell[];
  /** Fotografia da ligação original (para detectar alterações). */
  snapshot: () => string;
}

/**
 * Lista do ADT didático: struct upo_list_s { upo_list_node_t *head; } e
 * struct upo_list_node_s { int value; upo_list_node_t *next; }.
 * `values === null` cria um handle NULL.
 */
export function buildList(m: Machine, values: number[] | null): BuiltList {
  const handleType: CType = { k: 'ptr', to: { k: 'struct', name: 'upo_list_s' }, alias: 'upo_list_t' };
  if (values === null) {
    return { handle: m.nullPtr(handleType), container: null, nodes: [], snapshot: () => 'NULL' };
  }
  const nodes: Cell[] = [];
  let next: Value = m.nullPtr(nodeType('upo_list_node_s'));
  for (let i = values.length - 1; i >= 0; i--) {
    const n = m.makeStruct('upo_list_node_s', { value: m.num(values[i]), next }, `nó[${i}]`);
    nodes.unshift(n);
    next = m.ptrTo(n, nodeType('upo_list_node_s'));
  }
  const container = m.makeStruct('upo_list_s', { head: next }, 'lista');
  const snapshot = () => describeChain(m, container, 'head', nodes);
  return { handle: m.ptrTo(container, handleType), container, nodes, snapshot };
}

function describeChain(m: Machine, container: Cell, headField: string, nodes: Cell[]): string {
  const parts: string[] = [];
  let p = m.field(container, headField).value;
  let guard = 0;
  while (p.t === 'ptr' && p.cell && guard++ < 1000) {
    const idx = nodes.indexOf(p.cell);
    const vf = m.field(p.cell, nodes.length && p.cell.value.t === 'struct' && p.cell.value.fields.has('value') ? 'value' : 'data').value;
    parts.push(`#${idx}:${vf.t === 'num' ? vf.v : vf.t === 'ptr' ? 'ptr' : '?'}`);
    p = m.field(p.cell, 'next').value;
  }
  const extra = container.value.t === 'struct' && container.value.fields.has('size') ? `|size=${numOf(m.field(container, 'size').value)}` : '';
  return parts.join('->') + extra;
}

function numOf(v: Value): string {
  return v.t === 'num' ? String(v.v) : v.t;
}

/** Pilha do Stack ADT: struct upo_stack_s { upo_stack_node_t *top; size_t size; }. */
export function buildStack(m: Machine, values: number[] | null, sizeOverride?: number) {
  const handleType: CType = { k: 'ptr', to: { k: 'struct', name: 'upo_stack_s' }, alias: 'upo_stack_t' };
  if (values === null) return { handle: m.nullPtr(handleType), container: null as Cell | null, nodes: [] as Cell[], snapshot: () => 'NULL' };
  const nodes: Cell[] = [];
  let next: Value = m.nullPtr(nodeType('upo_stack_node_s'));
  // values[0] é o topo
  for (let i = values.length - 1; i >= 0; i--) {
    const data = m.newCell({ k: 'num', name: 'int' }, `dado${i}`, { harness: true });
    data.value = m.num(values[i]);
    const n = m.makeStruct('upo_stack_node_s', { data: m.ptrTo(data), next }, `nó[${i}]`);
    nodes.unshift(n);
    next = m.ptrTo(n, nodeType('upo_stack_node_s'));
  }
  const container = m.makeStruct(
    'upo_stack_s',
    { top: next, size: m.num(sizeOverride ?? values.length, { k: 'num', name: 'size_t' }) },
    'pilha',
  );
  return { handle: m.ptrTo(container, handleType), container, nodes, snapshot: () => describeChain(m, container, 'top', nodes) };
}

export function expectNumber(result: Value, expected: number, extra?: (actual: number) => string | undefined): TestOutcome {
  if (result.t !== 'num') {
    return { pass: false, expected: String(expected), actual: result.t === 'ptr' ? 'um ponteiro' : String(result.t), message: 'A função deveria devolver um número.' };
  }
  const pass = result.v === expected;
  return { pass, expected: String(expected), actual: String(result.v), message: pass ? undefined : extra?.(result.v) };
}

export function describeNodePtr(result: Value, nodes: Cell[], label = 'nó'): string {
  if (result.t !== 'ptr') return result.t === 'num' ? `o número ${result.v}` : String(result.t);
  if (!result.cell) return 'NULL';
  const i = nodes.indexOf(result.cell);
  if (i < 0) return 'um ponteiro que não é um nó desta lista';
  const v = result.cell.value.t === 'struct' ? result.cell.value.fields.get('value')?.value : undefined;
  return `ponteiro para o ${label} #${i}${v && v.t === 'num' ? ` (value = ${v.v})` : ''}`;
}

/** Combina a verificação principal com a verificação "a estrutura não foi alterada". */
export function withUnchanged(outcome: TestOutcome, before: string, after: string, what: string): TestOutcome {
  if (before === after) return outcome;
  return {
    pass: false,
    expected: outcome.expected,
    actual: outcome.actual,
    message: `${outcome.pass ? 'O valor retornado está certo, mas ' : ''}sua função modificou ${what}. Antes: [${before || 'vazia'}]  Depois: [${after || 'vazia'}]. Uma função de consulta deve só LER a estrutura: use um ponteiro auxiliar para percorrer.`,
  };
}
