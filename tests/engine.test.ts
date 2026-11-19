import { describe, expect, it } from 'vitest';
import { EXERCISES, getExercise } from '../src/content/exercises';
import { runSimulated, compile } from '../src/engine/runner';
import { Machine } from '../src/engine/interpreter';

const ex = (id: string) => getExercise(id)!;
const run = (id: string, code: string) => runSimulated(ex(id), code);
const allPass = (id: string, code: string) => {
  const r = run(id, code);
  return r.compiled && r.results.every((t) => t.pass);
};
const errorCodes = (id: string, code: string) => {
  const r = run(id, code);
  if (!r.compiled) return [r.compileError!.code];
  return r.results.filter((t) => t.error).map((t) => t.error!.code);
};

describe('reference solutions', () => {
  for (const e of EXERCISES) {
    it(`${e.id}: solution passes all tests`, () => {
      const r = runSimulated(e, e.solution);
      expect(r.compileError).toBeUndefined();
      for (const t of r.results) expect(t.pass, `${t.id}: ${t.error?.message ?? t.message ?? ''}`).toBe(true);
    });
    it(`${e.id}: starter code compiles but does not pass everything`, () => {
      const r = runSimulated(e, e.starterCode);
      expect(r.compiled).toBe(true);
      expect(r.results.every((t) => t.pass)).toBe(false);
    });
  }
});

describe('stack is_empty', () => {
  it('accepts size-based answer', () => {
    expect(allPass('stack-is-empty', `int upo_stack_is_empty(const upo_stack_t stack) { if (stack == NULL) return 1; return stack->size == 0; }`)).toBe(true);
  });
  it('flags returning a pointer as int (common mistake)', () => {
    const codes = errorCodes('stack-is-empty', `int upo_stack_is_empty(const upo_stack_t stack) { stack->top = NULL; return stack; }`);
    expect(codes).toContain('TYPE_MISMATCH');
  });
  it('flags NULL dereference when NULL check is removed', () => {
    const codes = errorCodes('stack-is-empty', `int upo_stack_is_empty(const upo_stack_t stack) { return stack->top == NULL; }`);
    expect(codes).toContain('NULL_DEREF');
  });
  it('flags . on a handle', () => {
    const codes = errorCodes('stack-is-empty', `int upo_stack_is_empty(const upo_stack_t stack) { if (stack == NULL) return 1; return stack.top == NULL; }`);
    expect(codes).toContain('DOT_ON_POINTER');
  });
  it('flags modifying the stack', () => {
    const r = run('stack-is-empty', `int upo_stack_is_empty(const upo_stack_t stack) { if (stack == NULL) return 1; stack->size = 0; return 0; }`);
    const t = r.results.find((x) => x.id === 'one')!;
    expect(t.pass).toBe(false);
    expect(t.message).toMatch(/modificou/);
  });
  it('warns about = in condition', () => {
    const r = run('stack-is-empty', `int upo_stack_is_empty(const upo_stack_t stack) { if (stack = NULL) return 1; return 0; }`);
    expect(r.warnings.some((w) => w.code === 'ASSIGN_IN_CONDITION')).toBe(true);
  });
  it('rejects changed signatures', () => {
    const r = run('stack-is-empty', `int upo_stack_is_empty(upo_stack_node_t *stack) { return 1; }`);
    expect(r.compileError?.code).toBe('TYPE_MISMATCH');
  });
  it('detects the skeleton abort()', () => {
    const codes = errorCodes('stack-is-empty', `int upo_stack_is_empty(const upo_stack_t stack) { fprintf(stderr, "To be implemented!\\n"); abort(); }`);
    expect(codes).toContain('ABORT');
  });
});

describe('list count', () => {
  it('detects infinite loop (forgot to advance)', () => {
    const codes = errorCodes('list-count', `size_t upo_list_count(const upo_list_t list) {
      if (list == NULL) return 0;
      size_t n = 0; upo_list_node_t *node = list->head;
      while (node != NULL) { n++; }
      return n; }`);
    expect(codes).toContain('INFINITE_LOOP');
  });
  it('detects uninitialised counter', () => {
    const codes = errorCodes('list-count', `size_t upo_list_count(const upo_list_t list) {
      if (list == NULL) return 0;
      size_t n; upo_list_node_t *node = list->head;
      while (node != NULL) { n++; node = node->next; }
      return n; }`);
    expect(codes).toContain('UNINIT_READ');
  });
  it('detects handle/node type confusion', () => {
    const codes = errorCodes('list-count', `size_t upo_list_count(const upo_list_t list) {
      size_t n = 0; upo_list_t node = list->head;
      return n; }`);
    expect(codes).toContain('INCOMPATIBLE_PTR');
  });
  it('detects destroying the list by advancing head', () => {
    const r = run('list-count', `size_t upo_list_count(const upo_list_t list) {
      if (list == NULL) return 0;
      size_t n = 0;
      while (list->head != NULL) { n++; list->head = list->head->next; }
      return n; }`);
    const t = r.results.find((x) => x.id === 'three')!;
    expect(t.pass).toBe(false);
    expect(t.message).toMatch(/modificou/);
  });
  it('accepts a for loop and a recursive _impl helper', () => {
    expect(
      allPass('list-count', `size_t upo_list_count(const upo_list_t list) {
        size_t n = 0;
        if (list == NULL) return 0;
        for (upo_list_node_t *p = list->head; p != NULL; p = p->next) n += 1;
        return n; }`),
    ).toBe(true);
    expect(
      allPass('list-count', `static size_t upo_list_count_impl(const upo_list_node_t *node) {
        if (node == NULL) return 0;
        return 1 + upo_list_count_impl(node->next);
      }
      size_t upo_list_count(const upo_list_t list) {
        return list == NULL ? 0 : upo_list_count_impl(list->head);
      }`),
    ).toBe(true);
  });
  it('detects missing return', () => {
    const codes = errorCodes('list-count', `size_t upo_list_count(const upo_list_t list) { if (list == NULL) return 0; }`);
    expect(codes).toContain('MISSING_RETURN');
  });
  it('reports syntax errors with line numbers', () => {
    const r = run('list-count', `size_t upo_list_count(const upo_list_t list)\n{\n  size_t n = 0\n  return n;\n}`);
    expect(r.compileError?.code).toBe('SYNTAX');
    expect(r.compileError?.line).toBe(4);
  });
});

describe('list find', () => {
  it('detects wrong && order (NULL dereference)', () => {
    const codes = errorCodes('list-find', `upo_list_node_t* upo_list_find(const upo_list_t list, int value) {
      if (list == NULL) return NULL;
      upo_list_node_t *node = list->head;
      while (node->value != value && node != NULL) node = node->next;
      return node; }`);
    expect(codes).toContain('NULL_DEREF');
  });
  it('accepts the && variant', () => {
    expect(
      allPass('list-find', `upo_list_node_t* upo_list_find(const upo_list_t list, int value) {
        if (list == NULL) return NULL;
        upo_list_node_t *node = list->head;
        while (node != NULL && node->value != value) node = node->next;
        return node; }`),
    ).toBe(true);
  });
  it('explains returning the last duplicate', () => {
    const r = run('list-find', `upo_list_node_t* upo_list_find(const upo_list_t list, int value) {
      upo_list_node_t *found = NULL;
      if (list == NULL) return NULL;
      for (upo_list_node_t *n = list->head; n != NULL; n = n->next) if (n->value == value) found = n;
      return found; }`);
    const t = r.results.find((x) => x.id === 'dup')!;
    expect(t.pass).toBe(false);
    expect(t.message).toMatch(/ÚLTIMO/);
  });
  it('flags wild pointer', () => {
    const codes = errorCodes('list-find', `upo_list_node_t* upo_list_find(const upo_list_t list, int value) {
      upo_list_node_t *node;
      if (list == NULL) return NULL;
      while (node != NULL) node = node->next;
      return NULL; }`);
    expect(codes).toContain('WILD_POINTER');
  });
});

describe('memory model', () => {
  const header = `typedef struct node_s node_t; struct node_s { int v; node_t *next; };`;
  const mk = (src: string) => {
    const c = compile(header, src, { required: ['f'] });
    if (!c.ok) throw new Error(c.error.message);
    return new Machine(c.types, c.functions);
  };
  it('supports malloc/free and pointer-to-pointer', () => {
    const m = mk(`void push(node_t **head, int v) {
        node_t *n = malloc(sizeof(node_t));
        n->v = v; n->next = *head; *head = n;
      }
      int f(void) {
        node_t *h = NULL; push(&h, 1); push(&h, 2);
        int r = h->v * 10 + h->next->v;
        free(h->next); free(h);
        return r; }`);
    const r = m.invoke('f', []);
    expect(r).toMatchObject({ t: 'num', v: 21 });
  });
  it('detects use after free and double free', () => {
    expect(() => mk(`int f(void) { node_t *n = malloc(sizeof(node_t)); n->v = 1; free(n); return n->v; }`).invoke('f', [])).toThrow(/liberada/);
    expect(() => mk(`int f(void) { node_t *n = malloc(sizeof(node_t)); free(n); free(n); return 0; }`).invoke('f', [])).toThrow(/double free/);
  });
  it('requires a cast to dereference void*', () => {
    expect(() => mk(`int f(void) { int x = 3; void *p = &x; return *p; }`).invoke('f', [])).toThrow(/void\*/);
    expect(mk(`int f(void) { int x = 3; void *p = &x; return *((int*) p); }`).invoke('f', [])).toMatchObject({ v: 3 });
  });
  it('emulates pass-by-reference through pointers', () => {
    const m = mk(`void set(int a1, int *a2) { *a2 = 3; a1 = 2; }
      int f(void) { int v1 = 0; int v2 = 1; set(v1, &v2); return v1 * 10 + v2; }`);
    expect(m.invoke('f', [])).toMatchObject({ v: 3 });
  });
  it('captures printf output', () => {
    const m = mk(`int f(void) { printf("n=%d %s\\n", 4, "ok"); return 0; }`);
    m.invoke('f', []);
    expect(m.output.join('')).toBe('n=4 ok\n');
  });
});
