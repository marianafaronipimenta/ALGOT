import { useMemo, useRef, type KeyboardEvent } from 'react';
import { HighlightedLine } from './CodeBlock';
import { highlight } from './highlight';

interface Props {
  value: string;
  onChange: (v: string) => void;
  errorLine?: number;
  label: string;
  id: string;
}

/**
 * Editor leve: <textarea> transparente sobre uma camada com realce de sintaxe.
 * Tab insere 4 espaços; Shift+Tab remove; Enter mantém a indentação.
 * Esc seguido de Tab sai do editor (acessibilidade de teclado).
 */
export function CodeEditor({ value, onChange, errorLine, label, id }: Props) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const escaped = useRef(false);
  const lines = useMemo(() => highlight(value), [value]);

  const sync = () => {
    if (!ta.current) return;
    if (layer.current) {
      layer.current.scrollTop = ta.current.scrollTop;
      layer.current.scrollLeft = ta.current.scrollLeft;
    }
    if (gutter.current) gutter.current.scrollTop = ta.current.scrollTop;
  };

  const replace = (start: number, end: number, text: string, caret: number) => {
    const el = ta.current!;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = caret;
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: en } = el;
    if (e.key === 'Escape') {
      escaped.current = true;
      return;
    }
    if (e.key === 'Tab') {
      if (escaped.current) {
        escaped.current = false;
        return; // deixa o foco sair
      }
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      if (e.shiftKey) {
        const m = /^ {1,4}/.exec(value.slice(lineStart));
        if (m) replace(lineStart, lineStart + m[0].length, '', Math.max(lineStart, s - m[0].length));
      } else {
        replace(s, en, '    ', s + 4);
      }
      return;
    }
    escaped.current = false;
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const indent = /^[ \t]*/.exec(value.slice(lineStart))![0];
      const extra = value[s - 1] === '{' ? '    ' : '';
      replace(s, en, '\n' + indent + extra, s + 1 + indent.length + extra.length);
    }
  };

  return (
    <div className="editor">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="editor-gutter" ref={gutter} aria-hidden="true">
        {lines.map((_, i) => (
          <div key={i} className={errorLine === i + 1 ? 'err' : ''}>
            {i + 1}
          </div>
        ))}
      </div>
      <div className="editor-area">
        <div className="editor-layer" ref={layer} aria-hidden="true">
          {lines.map((t, i) => (
            <div key={i} className={`el${errorLine === i + 1 ? ' err' : ''}`}>
              <HighlightedLine tokens={t} />
              {'​'}
            </div>
          ))}
        </div>
        <textarea
          id={id}
          ref={ta}
          className="editor-input"
          value={value}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          wrap="off"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={sync}
          aria-describedby={`${id}-help`}
        />
      </div>
      <p id={`${id}-help`} className="sr-only">
        Tab insere quatro espaços. Para sair do editor com o teclado, pressione Esc e depois Tab.
      </p>
    </div>
  );
}
