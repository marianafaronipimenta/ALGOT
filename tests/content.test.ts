import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/content/lessons';
import { EXERCISES } from '../src/content/exercises';
import { TRANSLATOR_EXAMPLES } from '../src/content/translator';
import type { Diagram } from '../src/content/types';
import { highlight } from '../src/components/highlight';

function checkDiagram(d: Diagram) {
  if (d.kind !== 'boxes') return;
  const ids = new Set(d.boxes.map((b) => b.id));
  expect(ids.size).toBe(d.boxes.length);
  for (const b of d.boxes) for (const f of b.fields) if (f.to && f.to !== 'NULL') expect(ids.has(f.to), `${d.title}: ${f.to}`).toBe(true);
}

describe('lessons', () => {
  it('has the eight required lessons in order', () => {
    expect(LESSONS.map((l) => l.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(8);
  });
  for (const l of LESSONS) {
    it(`${l.id}: line notes, quiz and diagrams are consistent`, () => {
      const n = l.example.code.split('\n').length;
      for (const note of l.example.lineNotes) {
        expect(note.from).toBeGreaterThanOrEqual(1);
        expect(note.to ?? note.from).toBeLessThanOrEqual(n);
        expect(l.example.code.split('\n')[note.from - 1].trim().length, `${l.id} L${note.from} is blank`).toBeGreaterThan(0);
      }
      expect(l.quiz.length).toBeGreaterThan(0);
      for (const q of l.quiz) expect(q.correct).toBeLessThan(q.options.length);
      l.diagrams?.forEach(checkDiagram);
    });
  }
});

describe('exercises', () => {
  it('has the three introductory exercises', () => {
    expect(EXERCISES.map((e) => e.id)).toEqual(['stack-is-empty', 'list-count', 'list-find']);
  });
  for (const e of EXERCISES) {
    it(`${e.id}: metadata is consistent`, () => {
      expect(e.trace.correct).toBeLessThan(e.trace.options.length);
      expect(e.hints.length).toBeGreaterThanOrEqual(3);
      const n = e.solution.trimEnd().split('\n').length;
      for (const note of e.solutionNotes) expect(note.to ?? note.from).toBeLessThanOrEqual(n);
      expect(e.starterCode).toContain(e.signature.replace(/;$/, ''));
      if (e.diagram) checkDiagram(e.diagram);
    });
  }
});

describe('translator', () => {
  for (const t of TRANSLATOR_EXAMPLES) {
    it(`${t.id}: rows and renames are consistent`, () => {
      expect(t.rows.length).toBeGreaterThan(3);
      for (const r of t.rows) {
        // a linha genérica só existe quando a UPO existe (e vice-versa)
        expect(!!r.upo).toBe(!!r.generic);
      }
      // cada nome UPO renomeado aparece de fato no código do exemplo
      const all = t.rows.map((r) => r.upo).join('\n');
      for (const rn of t.renames) expect(all, rn.upo).toContain(rn.upo.replace(/^struct\s+/, ''));
      if (t.diagram) checkDiagram(t.diagram);
    });
  }
});

describe('highlighter', () => {
  it('keeps multi-line comments together and preserves text', () => {
    const src = 'int a; /* um\n dois */ int b;';
    const lines = highlight(src);
    expect(lines.length).toBe(2);
    expect(lines.map((l) => l.map((t) => t.text).join('')).join('\n')).toBe(src);
    expect(lines[1][0].cls).toBe('com');
  });
});
