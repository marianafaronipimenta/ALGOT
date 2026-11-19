/**
 * Lexer para o subconjunto de C suportado pelo simulador do ALGOLAB.
 * Comentários e diretivas de pré-processador (#include, ...) são ignorados.
 */
import { CompileError } from './errors';

export type TokenKind = 'ident' | 'keyword' | 'num' | 'char' | 'string' | 'punct' | 'eof';

export interface Token {
  kind: TokenKind;
  text: string;
  line: number;
  col: number;
  /** Valor numérico para literais `num` e `char`. */
  value?: number;
}

export const KEYWORDS = new Set([
  'int', 'char', 'long', 'short', 'unsigned', 'signed', 'double', 'float', 'void', 'size_t',
  'struct', 'typedef', 'const', 'static', 'inline', 'extern',
  'if', 'else', 'while', 'for', 'do', 'return', 'break', 'continue',
  'sizeof', 'NULL', 'switch', 'case', 'default', 'goto', 'union', 'enum',
]);

const PUNCTS = [
  '->', '++', '--', '==', '!=', '<=', '>=', '&&', '||', '+=', '-=', '*=', '/=', '%=',
  '+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '^', '~', '?', ':',
  ';', ',', '.', '(', ')', '{', '}', '[', ']',
];

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;
  let atLineStart = true;

  const advance = (n: number) => {
    for (let k = 0; k < n; k++) {
      if (src[i] === '\n') {
        line++;
        col = 1;
        atLineStart = true;
      } else {
        col++;
      }
      i++;
    }
  };

  while (i < src.length) {
    const c = src[i];

    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
      advance(1);
      continue;
    }
    // Diretiva de pré-processador: ignora a linha inteira.
    if (c === '#' && atLineStart) {
      while (i < src.length && src[i] !== '\n') advance(1);
      continue;
    }
    atLineStart = false;

    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') advance(1);
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const startLine = line;
      advance(2);
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) advance(1);
      if (i >= src.length) {
        throw new CompileError('SYNTAX', startLine, 'Comentário /* ... */ aberto e nunca fechado com */.');
      }
      advance(2);
      continue;
    }

    const startLine = line;
    const startCol = col;

    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const text = src.slice(i, j);
      tokens.push({ kind: KEYWORDS.has(text) ? 'keyword' : 'ident', text, line: startLine, col: startCol });
      advance(j - i);
      continue;
    }

    if (/[0-9]/.test(c)) {
      const m = /^(0[xX][0-9a-fA-F]+|[0-9]+(\.[0-9]+)?)([uUlLfF]*)/.exec(src.slice(i));
      const text = m ? m[0] : c;
      const numText = m ? m[1] : c;
      const value = numText.startsWith('0x') || numText.startsWith('0X') ? parseInt(numText, 16) : Number(numText);
      tokens.push({ kind: 'num', text, line: startLine, col: startCol, value });
      advance(text.length);
      continue;
    }

    if (c === "'") {
      const m = /^'(\\.|[^'\\])'/.exec(src.slice(i));
      if (!m) throw new CompileError('SYNTAX', startLine, "Literal de caractere mal formado (use, por exemplo, 'a').");
      const body = m[1];
      const escapes: Record<string, number> = { n: 10, t: 9, '0': 0, '\\': 92, "'": 39, '"': 34 };
      const value = body.startsWith('\\') ? (escapes[body[1]] ?? body.charCodeAt(1)) : body.charCodeAt(0);
      tokens.push({ kind: 'char', text: m[0], line: startLine, col: startCol, value });
      advance(m[0].length);
      continue;
    }

    if (c === '"') {
      let j = i + 1;
      let out = '';
      while (j < src.length && src[j] !== '"') {
        if (src[j] === '\n') throw new CompileError('SYNTAX', startLine, 'String sem aspas de fechamento (").');
        if (src[j] === '\\' && j + 1 < src.length) {
          const e = src[j + 1];
          out += e === 'n' ? '\n' : e === 't' ? '\t' : e;
          j += 2;
        } else {
          out += src[j];
          j++;
        }
      }
      if (j >= src.length) throw new CompileError('SYNTAX', startLine, 'String sem aspas de fechamento (").');
      tokens.push({ kind: 'string', text: out, line: startLine, col: startCol });
      advance(j + 1 - i);
      continue;
    }

    const p = PUNCTS.find((op) => src.startsWith(op, i));
    if (p) {
      tokens.push({ kind: 'punct', text: p, line: startLine, col: startCol });
      advance(p.length);
      continue;
    }

    throw new CompileError('SYNTAX', startLine, `Caractere inesperado: '${c}'.`);
  }

  tokens.push({ kind: 'eof', text: '<fim do código>', line, col });
  return tokens;
}
