import { useEffect, useMemo, useState } from 'react';
import { CodeBlock } from '../components/CodeBlock';
import { Diagram } from '../components/Diagram';
import { Icon } from '../components/Icon';
import { QuizItem } from '../components/Quiz';
import { RichText } from '../components/RichText';
import { LESSONS, getLesson } from '../content/lessons';
import { Link } from '../state/router';
import { useProgress } from '../state/progress';
import { NotFound } from './NotFound';

export function LessonPage({ id }: { id: string }) {
  const lesson = getLesson(id);
  const { lesson: lp, answerQuiz, completeLesson } = useProgress();
  const [activeNote, setActiveNote] = useState<number | null>(null);
  useEffect(() => setActiveNote(null), [id]);

  const annotated = useMemo(() => {
    const s = new Set<number>();
    lesson?.example.lineNotes.forEach((n) => s.add(n.from));
    return s;
  }, [lesson]);

  if (!lesson) return <NotFound />;
  const progress = lp(lesson.id);
  const idx = LESSONS.indexOf(lesson);
  const prev = LESSONS[idx - 1];
  const next = LESSONS[idx + 1];
  const allCorrect = lesson.quiz.every((_, i) => progress.quiz[i]);

  const highlighted = new Set<number>();
  if (activeNote !== null) {
    const n = lesson.example.lineNotes[activeNote];
    for (let l = n.from; l <= (n.to ?? n.from); l++) highlighted.add(l);
  }

  return (
    <article className="page lesson">
      <nav className="crumbs" aria-label="Você está em">
        <Link to="/c-lab">C Programming Lab</Link> <span aria-hidden="true">/</span> <span>Lição {lesson.number}</span>
      </nav>
      <header className="page-head">
        <p className="eyebrow">
          Lição {String(lesson.number).padStart(2, '0')} de {LESSONS.length}
          {progress.completed && (
            <span className="badge ok">
              <Icon name="check" size={14} /> concluída
            </span>
          )}
        </p>
        <h1>{lesson.title}</h1>
        <p className="lead">{lesson.subtitle}</p>
        <ul className="terms" aria-label="Termos em italiano usados nos slides">
          {lesson.terms.map((t) => (
            <li key={t.it}>
              <span lang="it">{t.it}</span>
              <span className="arrow" aria-hidden="true">
                →
              </span>
              <span>{t.pt}</span>
            </li>
          ))}
        </ul>
      </header>

      <section className="prose section" aria-label="Explicação">
        {lesson.intro.map((p, i) => (
          <p key={i}>
            <RichText text={p} />
          </p>
        ))}
      </section>

      <section className="section" aria-labelledby="ex-title">
        <h2 id="ex-title" className="section-title">
          <span className="st-num">//</span> Exemplo comentado
        </h2>
        <p className="muted small">Clique em uma linha marcada com ● (ou em uma explicação) para ligar código e comentário.</p>
        <div className="example-grid">
          <CodeBlock
            code={lesson.example.code}
            filename={lesson.example.filename}
            annotated={annotated}
            highlighted={highlighted}
            onLineClick={(line) => {
              const i = lesson.example.lineNotes.findIndex((n) => n.from === line);
              setActiveNote(i >= 0 ? i : null);
            }}
          />
          <ol className="line-notes">
            {lesson.example.lineNotes.map((n, i) => (
              <li key={i}>
                <button type="button" className={`line-note${activeNote === i ? ' active' : ''}`} aria-pressed={activeNote === i} onClick={() => setActiveNote(activeNote === i ? null : i)}>
                  <span className="ln-ref">
                    {n.to ? `L${n.from}–${n.to}` : `L${n.from}`}
                  </span>
                  <span>
                    <RichText text={n.text} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {lesson.diagrams?.map((d, i) => (
        <section key={i} className="section">
          <Diagram spec={d} />
        </section>
      ))}

      {lesson.tables?.map((t) => (
        <section key={t.title} className="section">
          <h2 className="section-title">
            <span className="st-num">//</span> {t.title}
          </h2>
          <div className="table-wrap">
            <table className="ref-table">
              <thead>
                <tr>
                  {t.headers.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.map((r) => (
                  <tr key={r[0]}>
                    {r.map((c, j) => (j === 0 || j === 2 ? <td key={j}><code className="ic">{c}</code></td> : <td key={j}>{c}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="two-col section">
        <section className="panel" aria-labelledby="kp">
          <h2 id="kp" className="panel-title">
            <Icon name="check" /> Para lembrar
          </h2>
          <ul className="bullets">
            {lesson.keyPoints.map((k) => (
              <li key={k}>
                <RichText text={k} />
              </li>
            ))}
          </ul>
        </section>
        <section className="panel warn" aria-labelledby="pf">
          <h2 id="pf" className="panel-title">
            <Icon name="bulb" /> Armadilhas comuns
          </h2>
          <ul className="bullets">
            {lesson.pitfalls.map((k) => (
              <li key={k}>
                <RichText text={k} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="section" aria-labelledby="quiz-title">
        <h2 id="quiz-title" className="section-title">
          <span className="st-num">//</span> Verifique sua compreensão
        </h2>
        <div className="quiz">
          {lesson.quiz.map((q, i) => (
            <QuizItem key={`${lesson.id}-${i}`} index={i} {...q} solvedBefore={!!progress.quiz[i]} onAnswer={(ok) => answerQuiz(lesson.id, i, ok)} />
          ))}
        </div>
        <div className="complete-bar">
          {progress.completed ? (
            <>
              <span className="badge ok">
                <Icon name="check" size={14} /> Lição concluída
              </span>
              <button type="button" className="btn ghost small" onClick={() => completeLesson(lesson.id, false)}>
                Desmarcar
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn primary" disabled={!allCorrect} onClick={() => completeLesson(lesson.id, true)}>
                <Icon name="check" /> Marcar como concluída
              </button>
              {!allCorrect && <span className="muted small">Acerte as {lesson.quiz.length} perguntas para concluir.</span>}
            </>
          )}
        </div>
      </section>

      <p className="sources small muted">Material do curso relacionado: {lesson.sources.join(' · ')}</p>

      <nav className="pager" aria-label="Navegação entre lições">
        {prev ? (
          <Link to={`/c-lab/licao/${prev.id}`} className="btn ghost">
            ← Lição {prev.number}: {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/c-lab/licao/${next.id}`} className="btn ghost">
            Lição {next.number}: {next.title} →
          </Link>
        ) : (
          <Link to="/c-lab/trainer" className="btn ghost">
            Praticar no Function Trainer →
          </Link>
        )}
      </nav>
    </article>
  );
}
