import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { HighlightedLine } from '../components/CodeBlock';
import { Diagram } from '../components/Diagram';
import { highlight, type HlToken } from '../components/highlight';
import { Icon } from '../components/Icon';
import { RichText } from '../components/RichText';
import { TRANSLATOR_EXAMPLES } from '../content/translator';
import { Link, navigate } from '../state/router';
import { useProgress } from '../state/progress';

type View = 'all' | 'upo' | 'generic';

export function TranslatorPage({ id }: { id?: string }) {
  const ex = TRANSLATOR_EXAMPLES.find((e) => e.id === id) ?? TRANSLATOR_EXAMPLES[0];
  const { markTranslatorSeen, state } = useProgress();
  const [sel, setSel] = useState<number | null>(null);
  const [view, setView] = useState<View>('all');
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  useEffect(() => {
    markTranslatorSeen(ex.id);
    setSel(null);
  }, [ex.id]);

  /** identificador -> índice da cor do par renomeado */
  const renameIndex = useMemo(() => {
    const m = new Map<string, number>();
    ex.renames.forEach((r, i) => {
      m.set(r.upo.replace(/^struct\s+/, ''), i);
      m.set(r.generic.replace(/^struct\s+/, ''), i);
    });
    return m;
  }, [ex]);
  const tokenClass = (t: HlToken) => {
    const i = renameIndex.get(t.text);
    return i === undefined ? undefined : `rn rn-${i % 6}`;
  };

  const lines = useMemo(
    () => ex.rows.map((r) => ({ upo: highlight(r.upo)[0] ?? [], generic: highlight(r.generic)[0] ?? [] })),
    [ex],
  );

  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, i: number) => {
    const move = (j: number) => {
      if (j < 0 || j >= ex.rows.length) return;
      rowRefs.current[j]?.focus();
      setSel(j);
    };
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(i + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(i - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSel(sel === i ? null : i);
    }
  };

  return (
    <div className="page translator">
      <nav className="crumbs" aria-label="Você está em">
        <Link to="/c-lab">C Programming Lab</Link> <span aria-hidden="true">/</span> <span>Code Translator</span>
      </nav>
      <header className="page-head">
        <p className="eyebrow">Ferramenta</p>
        <h1>Code Translator</h1>
        <p className="lead">
          Três áreas sincronizadas: <strong>A</strong> o código com as convenções de nomes do curso, <strong>B</strong> exatamente a mesma lógica com nomes
          mais intuitivos, <strong>C</strong> a explicação de cada linha. Só os nomes mudam; a semântica é idêntica.
        </p>
      </header>

      <div className="notice">
        <Icon name="bulb" />
        <p>
          Código <strong>ilustrativo</strong>, escrito para o ALGOLAB no estilo de nomes do curso (as structs seguem os slides). Não é código original do toolkit
          do professor: no exame, confira sempre o header real.
        </p>
      </div>

      <div className="tabs" role="tablist" aria-label="Exemplos">
        {TRANSLATOR_EXAMPLES.map((e) => (
          <button
            key={e.id}
            type="button"
            role="tab"
            aria-selected={e.id === ex.id}
            className={`tab${e.id === ex.id ? ' active' : ''}`}
            onClick={() => navigate(`/c-lab/translator/${e.id}`)}
          >
            {e.title}
            {state.translatorSeen.includes(e.id) && e.id !== ex.id && <span className="seen" aria-label="(visto)">✓</span>}
          </button>
        ))}
      </div>

      <section className="section" aria-labelledby="tx-title">
        <h2 id="tx-title" className="section-title">
          <span className="st-num">//</span> {ex.title}
        </h2>
        <p className="muted">{ex.summary}</p>

        <div className="renames" aria-label="Nomes traduzidos">
          {ex.renames.map((r, i) => (
            <div key={r.upo} className={`rename rn-${i % 6}`}>
              <code>{r.upo}</code>
              <Icon name="swap" size={14} />
              <code>{r.generic}</code>
              <span className="rk">{r.kind}</span>
            </div>
          ))}
        </div>

        <div className="view-toggle" role="group" aria-label="Colunas visíveis">
          <span className="muted small">Mostrar:</span>
          {(
            [
              ['all', 'A + B + C'],
              ['upo', 'A + C'],
              ['generic', 'B + C'],
            ] as [View, string][]
          ).map(([v, label]) => (
            <button key={v} type="button" className={`chip${view === v ? ' active' : ''}`} aria-pressed={view === v} onClick={() => setView(v)}>
              {label}
            </button>
          ))}
        </div>

        <div className={`tx-wrap view-${view}`}>
          <table className="tx-table">
            <caption className="sr-only">
              {ex.title}: cada linha mostra o código UPO, a versão genérica e a explicação. Use as setas para navegar.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="c-ln">
                  #
                </th>
                <th scope="col" className="c-upo">
                  <span className="colkey">A</span> Estilo do professor (UPO)
                </th>
                <th scope="col" className="c-gen">
                  <span className="colkey">B</span> Nomes genéricos
                </th>
                <th scope="col" className="c-note">
                  <span className="colkey">C</span> Explicação
                </th>
              </tr>
            </thead>
            <tbody>
              {ex.rows.map((r, i) => {
                const blank = !r.upo && !r.generic;
                return (
                  <tr
                    key={i}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    tabIndex={blank ? -1 : 0}
                    className={`${sel === i ? 'sel' : ''}${blank ? ' blank' : ''}${r.note ? ' has-note' : ''}`}
                    onClick={() => !blank && setSel(sel === i ? null : i)}
                    onKeyDown={(e) => onRowKey(e, i)}
                    aria-selected={sel === i}
                  >
                    <td className="c-ln">{i + 1}</td>
                    <td className="c-upo">
                      <code>
                        <HighlightedLine tokens={lines[i].upo} tokenClass={tokenClass} />
                      </code>
                    </td>
                    <td className="c-gen">
                      <code>
                        <HighlightedLine tokens={lines[i].generic} tokenClass={tokenClass} />
                      </code>
                    </td>
                    <td className="c-note">{r.note && <RichText text={r.note} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {ex.diagram && (
        <section className="section">
          <Diagram spec={ex.diagram} />
        </section>
      )}

      <div className="section">
        <section className="panel" aria-labelledby="tk">
          <h2 id="tk" className="panel-title">
            <Icon name="check" /> O que levar deste exemplo
          </h2>
          <ul className="bullets">
            {ex.takeaways.map((t) => (
              <li key={t}>
                <RichText text={t} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
