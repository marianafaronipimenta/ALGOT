/** Realce de sintaxe C simples (sem dependências), dividido por linhas. */

export type TokClass = 'kw' | 'type' | 'fn' | 'num' | 'str' | 'com' | 'pre' | 'id' | 'op' | 'ws' | 'upo';

export interface HlToken {
  cls: TokClass;
  text: string;
}

const KW = new Set([
  'if', 'else', 'while', 'for', 'do', 'return', 'break', 'continue', 'switch', 'case', 'default', 'goto',
  'typedef', 'struct', 'union', 'enum', 'const', 'static', 'extern', 'inline', 'sizeof', 'NULL', 'void',
  'int', 'char', 'long', 'short', 'unsigned', 'signed', 'double', 'float', 'size_t', 'time_t',
]);

const RE = /(\/\*[\s\S]*?(?:\*\/|(?![\s\S]))|\/\/[^\n]*)|(^[ \t]*#[^\n]*)|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(\b0[xX][0-9a-fA-F]+\b|\b\d+(?:\.\d+)?[uUlLfF]*\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_0-9"'])/gm;

export function highlight(code: string): HlToken[][] {
  const flat: HlToken[] = [];
  RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(code))) {
    const [all, com, pre, str, num, id, ws] = m;
    let cls: TokClass;
    if (com) cls = 'com';
    else if (pre) cls = 'pre';
    else if (str) cls = 'str';
    else if (num) cls = 'num';
    else if (id) {
      if (KW.has(id)) cls = 'kw';
      else if (/_t$/.test(id) || /^[A-Z][a-zA-Z]+$/.test(id)) cls = 'type';
      else if (/^\s*\(/.test(code.slice(RE.lastIndex))) cls = 'fn';
      else if (id.startsWith('upo_')) cls = 'upo';
      else cls = 'id';
    } else if (ws) cls = 'ws';
    else cls = 'op';
    flat.push({ cls, text: all });
  }
  // divide por linhas
  const lines: HlToken[][] = [[]];
  for (const t of flat) {
    const parts = t.text.split('\n');
    parts.forEach((p, i) => {
      if (i > 0) lines.push([]);
      if (p) lines[lines.length - 1].push({ cls: t.cls, text: p });
    });
  }
  return lines;
}
