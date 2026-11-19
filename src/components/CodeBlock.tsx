import { useMemo } from 'react';
import { highlight, type HlToken } from './highlight';

export interface CodeBlockProps {
  code: string;
  filename?: string;
  /** Linhas (1-based) realçadas. */
  highlighted?: Set<number>;
  /** Linhas que têm anotação (mostra um marcador clicável). */
  annotated?: Set<number>;
  errorLine?: number;
  onLineClick?: (line: number) => void;
  /** Classe de realce extra por identificador (Code Translator). */
  tokenClass?: (t: HlToken) => string | undefined;
  compact?: boolean;
  ariaLabel?: string;
}

export function HighlightedLine({ tokens, tokenClass }: { tokens: HlToken[]; tokenClass?: (t: HlToken) => string | undefined }) {
  return (
    <>
      {tokens.map((t, i) => {
        const extra = tokenClass?.(t);
        return (
          <span key={i} className={`tk-${t.cls}${extra ? ' ' + extra : ''}`}>
            {t.text}
          </span>
        );
      })}
    </>
  );
}

export function CodeBlock({ code, filename, highlighted, annotated, errorLine, onLineClick, tokenClass, compact, ariaLabel }: CodeBlockProps) {
  const lines = useMemo(() => highlight(code), [code]);
  return (
    <figure className={`codeblock${compact ? ' compact' : ''}`} aria-label={ariaLabel ?? filename ?? 'código C'}>
      {filename && (
        <figcaption className="codeblock-head">
          <span className="dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="fname">{filename}</span>
          <span className="lang">C</span>
        </figcaption>
      )}
      <div className="codeblock-body" role="list">
        {lines.map((toks, i) => {
          const n = i + 1;
          const cls = ['cl', highlighted?.has(n) ? 'hl' : '', errorLine === n ? 'err' : '', onLineClick && annotated?.has(n) ? 'clickable' : '']
            .filter(Boolean)
            .join(' ');
          const content = (
            <>
              <span className="ln" aria-hidden="true">
                {n}
              </span>
              <span className="mark" aria-hidden="true">
                {annotated?.has(n) ? '●' : ''}
              </span>
              <code className="src">
                <HighlightedLine tokens={toks} tokenClass={tokenClass} />
                {toks.length === 0 ? ' ' : ''}
              </code>
            </>
          );
          return onLineClick && annotated?.has(n) ? (
            <button type="button" key={i} role="listitem" className={cls} onClick={() => onLineClick(n)} aria-label={`Linha ${n}: ver explicação`}>
              {content}
            </button>
          ) : (
            <div key={i} role="listitem" className={cls}>
              {content}
            </div>
          );
        })}
      </div>
    </figure>
  );
}
