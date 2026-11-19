import { useEffect, useMemo, useRef, useState } from 'react';
import { CodeBlock } from '../components/CodeBlock';
import { CodeEditor } from '../components/CodeEditor';
import { Diagram } from '../components/Diagram';
import { ErrorCard } from '../components/ErrorCard';
import { Icon } from '../components/Icon';
import { QuizItem } from '../components/Quiz';
import { RichText } from '../components/RichText';
import { WARNING_CATALOG } from '../content/errorCatalog';
import { EXERCISES, getExercise } from '../content/exercises';
import { SimulatedBackend, type ExecutionBackend, type RunReport } from '../engine/runner';
import { Link } from '../state/router';
import { LEVELS, useProgress } from '../state/progress';
import { NotFound } from './NotFound';

const backend: ExecutionBackend = new SimulatedBackend();

function useElapsed(running: boolean, start: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [running]);
  if (!start) return '00:00';
  const s = Math.max(0, Math.floor((now - start) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function ExercisePage({ id }: { id: string }) {
  const ex = getExercise(id);
  const { exercise, updateExercise } = useProgress();
  const saved = ex ? exercise(ex.id) : null;
  const [code, setCode] = useState(() => saved?.draft ?? ex?.starterCode ?? '');
  const [report, setReport] = useState<RunReport | null>(null);
  const [running, setRunning] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const [examStart, setExamStart] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const elapsed = useElapsed(examMode, examStart);

  // troca de exercício: recarrega rascunho
  useEffect(() => {
    if (!ex) return;
    setCode(exercise(ex.id).draft ?? ex.starterCode);
    setReport(null);
    setShowSolution(false);
    setExamMode(false);
    setExamStart(null);
  }, [id]);

  // salva rascunho (com atraso)
  useEffect(() => {
    if (!ex) return;
    const t = window.setTimeout(() => updateExercise(ex.id, (p) => (p.draft === code ? p : { ...p, draft: code })), 500);
    return () => window.clearTimeout(t);
  }, [code, ex?.id]);

  const errorLine = useMemo(() => {
    if (!report) return undefined;
    if (report.compileError) return report.compileError.line || undefined;
    return report.results.find((r) => r.error && r.error.line > 0)?.error?.line;
  }, [report]);

  if (!ex || !saved) return <NotFound />;
  const p = saved;
  const passed = report?.results.filter((r) => r.pass).length ?? 0;
  const total = ex.tests.length;
  const idx = EXERCISES.indexOf(ex);
  const nextEx = EXERCISES[idx + 1];

  const submit = async () => {
    setRunning(true);
    const r = await backend.run(ex, code);
    setReport(r);
    setRunning(false);
    const ok = r.compiled && r.results.every((t) => t.pass);
    const n = r.results.filter((t) => t.pass).length;
    updateExercise(ex.id, (prev) => ({
      ...prev,
      attempts: prev.attempts + 1,
      bestPassed: Math.max(prev.bestPassed, n),
      total: ex.tests.length,
      solved: prev.solved || ok,
      solvedInExamMode: prev.solvedInExamMode || (ok && examMode),
    }));
    requestAnimationFrame(() => resultsRef.current?.focus());
  };

  const toggleExam = () => {
    if (!examMode) {
      setExamMode(true);
      setExamStart(Date.now());
      setShowSolution(false);
    } else {
      setExamMode(false);
      setExamStart(null);
    }
  };

  const hintsShown = p.hintsShown;
  const annotatedSolution = new Set(ex.solutionNotes.map((n) => n.from));

  return (
    <article className={`page exercise${examMode ? ' exam' : ''}`}>
      <nav className="crumbs" aria-label="Você está em">
        <Link to="/c-lab">C Programming Lab</Link> <span aria-hidden="true">/</span> <Link to="/c-lab/trainer">Function Trainer</Link>{' '}
        <span aria-hidden="true">/</span> <span>{ex.title}</span>
      </nav>

      <header className="page-head ex-head">
        <div>
          <p className="eyebrow">
            <span className="lvl-badge" data-level={examMode ? 4 : ex.level}>
              N{examMode ? 4 : ex.level}
            </span>
            {examMode ? LEVELS[4].name : LEVELS[ex.level].name}
            {p.solved && (
              <span className="badge ok">
                <Icon name="check" size={14} /> resolvido
              </span>
            )}
          </p>
          <h1>{ex.title}</h1>
          <p className="lead">{ex.summary}</p>
        </div>
        <div className="exam-toggle">
          <button type="button" className={`btn ${examMode ? 'danger' : 'ghost'}`} aria-pressed={examMode} onClick={toggleExam}>
            <Icon name="clock" /> {examMode ? 'Sair do modo exame' : 'Ativar modo exame (N4)'}
          </button>
          {examMode && (
            <span className="timer" aria-live="off" aria-label={`Tempo decorrido ${elapsed}`}>
              {elapsed}
            </span>
          )}
        </div>
      </header>

      {examMode && (
        <div className="notice exam-notice">
          <Icon name="lock" />
          <p>
            <strong>Modo exame:</strong> sem aquecimento, sem dicas e sem explicações didáticas dos erros (só a mensagem, como um compilador). A solução fica
            disponível depois de você enviar.
          </p>
        </div>
      )}

      <div className="two-col section brief">
        <section className="panel" aria-labelledby="task">
          <h2 id="task" className="panel-title">
            <Icon name="book" /> Tarefa
          </h2>
          <div className="prose">
            {ex.task.map((t, i) => (
              <p key={i}>
                <RichText text={t} />
              </p>
            ))}
          </div>
          <div className="signature">
            <span className="sig-label">Assinatura (não altere)</span>
            <CodeBlock code={ex.signature} compact />
          </div>
        </section>
        <section className="panel" aria-labelledby="structs">
          <h2 id="structs" className="panel-title">
            <Icon name="ds" /> Estruturas de dados
          </h2>
          <CodeBlock code={ex.header} filename="header (dado)" compact />
        </section>
      </div>

      {ex.diagram && (
        <section className="section">
          <Diagram spec={ex.diagram} />
        </section>
      )}

      {!examMode && (
        <section className="section trace" aria-labelledby="trace-title">
          <h2 id="trace-title" className="section-title">
            <span className="lvl-badge" data-level={1}>
              N1
            </span>{' '}
            Aquecimento: entender e rastrear
            {p.traceSolved && (
              <span className="badge ok">
                <Icon name="check" size={14} /> feito
              </span>
            )}
          </h2>
          <QuizItem
            key={ex.id}
            prompt={ex.trace.prompt}
            code={ex.trace.code}
            options={ex.trace.options}
            correct={ex.trace.correct}
            explanation={ex.trace.explanation}
            solvedBefore={p.traceSolved}
            onAnswer={(ok) => ok && updateExercise(ex.id, (prev) => ({ ...prev, traceSolved: true }))}
          />
        </section>
      )}

      <section className="section workbench" aria-labelledby="wb-title">
        <h2 id="wb-title" className="section-title">
          <span className="st-num">//</span> Sua implementação
        </h2>
        <div className="wb-grid">
          <div className="wb-editor">
            <div className="editor-head">
              <span className="fname">{ex.id.startsWith('stack') ? 'src/stack.c' : 'src/list.c'}</span>
              <span className="muted small">Escreva só a função. Os includes e as structs já existem.</span>
            </div>
            <CodeEditor id={`editor-${ex.id}`} label={`Editor de código para ${ex.title}`} value={code} onChange={setCode} errorLine={errorLine} />
            <div className="editor-actions">
              <button type="button" className="btn primary" onClick={submit} disabled={running}>
                <Icon name="play" /> {running ? 'Executando…' : 'Executar testes'}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  if (code === ex.starterCode || window.confirm('Descartar seu código e voltar ao esqueleto original?')) {
                    setCode(ex.starterCode);
                    setReport(null);
                  }
                }}
              >
                Restaurar esqueleto
              </button>
              <span className="muted small">{p.attempts > 0 ? `${p.attempts} tentativa(s) · melhor: ${p.bestPassed}/${total}` : 'Nenhuma tentativa ainda'}</span>
            </div>
          </div>

          <div className="wb-results" ref={resultsRef} tabIndex={-1} aria-live="polite" aria-labelledby="res-title">
            <h3 id="res-title" className="results-title">
              Resultados
              <span className="backend-tag" title={backend.label}>
                simulado
              </span>
            </h3>
            {!report && <p className="muted">Clique em “Executar testes”. Seu código será analisado e executado com {total} cenários de teste.</p>}
            {report && (
              <>
                {report.compiled ? (
                  <div className={`summary ${passed === total ? 'ok' : 'bad'}`}>
                    <strong>
                      {passed}/{total}
                    </strong>{' '}
                    testes passaram
                    {passed === total && <span> · Função correta para todos os cenários testados.</span>}
                  </div>
                ) : (
                  <div className="summary bad">O código não pôde ser executado.</div>
                )}
                {report.compileError && <ErrorCard error={report.compileError} compile examMode={examMode} tip={ex.errorTips?.[report.compileError.code]} />}
                {report.warnings.map((w, i) => (
                  <div key={i} className="warning-card">
                    <strong>Aviso, linha {w.line}:</strong> {w.message}
                    {!examMode && <span className="muted"> {WARNING_CATALOG[w.code]?.meaning}</span>}
                  </div>
                ))}
                <ol className="test-list">
                  {report.results.map((t, ti) => (
                    <li key={t.id} className={`test ${t.pass ? 'pass' : 'fail'}`}>
                      <div className="t-head">
                        <span className="t-icon" aria-hidden="true">
                          {t.pass ? '✓' : '✗'}
                        </span>
                        <span className="t-title">{t.title}</span>
                        <span className="sr-only">{t.pass ? 'passou' : 'falhou'}</span>
                      </div>
                      <div className="t-scn mono">{t.scenario}</div>
                      {!t.error && (
                        <div className="t-io mono">
                          <span>esperado: {t.expected}</span>
                          <span>obtido: {t.actual}</span>
                        </div>
                      )}
                      {!t.pass && t.message && !examMode && (
                        <p className="t-msg">
                          <RichText text={t.message} />
                        </p>
                      )}
                      {t.error && (
                        <ErrorCard
                          error={t.error}
                          examMode={examMode}
                          tip={ex.errorTips?.[t.error.code]}
                          brief={report.results.slice(0, ti).some((o) => o.error?.code === t.error!.code)}
                        />
                      )}
                      {t.output.length > 0 && (
                        <pre className="console" aria-label="Saída do printf">
                          {t.output.join('')}
                        </pre>
                      )}
                    </li>
                  ))}
                </ol>
                <p className="muted small">
                  Executado pelo {backend.label}. Não é uma compilação real com gcc; o objetivo é verificar a lógica e explicar erros de ponteiro.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {!examMode && (
        <section className="section" aria-labelledby="hints-title">
          <h2 id="hints-title" className="section-title">
            <Icon name="bulb" /> Dicas progressivas
          </h2>
          <p className="muted small">Uma de cada vez, da mais geral para a mais específica. Tente o máximo possível antes de abrir a próxima.</p>
          <ol className="hints">
            {ex.hints.slice(0, hintsShown).map((h, i) => (
              <li key={i} className="hint">
                <span className="hint-n">Dica {i + 1}</span>
                <RichText text={h} />
              </li>
            ))}
          </ol>
          {hintsShown < ex.hints.length ? (
            <button type="button" className="btn ghost small" onClick={() => updateExercise(ex.id, (prev) => ({ ...prev, hintsShown: Math.min(ex.hints.length, prev.hintsShown + 1) }))}>
              Mostrar dica {hintsShown + 1} de {ex.hints.length}
            </button>
          ) : (
            <p className="muted small">Todas as dicas foram mostradas.</p>
          )}
        </section>
      )}

      <section className="section" aria-labelledby="sol-title">
        <h2 id="sol-title" className="section-title">
          <Icon name={p.attempts > 0 ? 'check' : 'lock'} /> Solução comentada
        </h2>
        {p.attempts === 0 || (examMode && !report) ? (
          <p className="muted">
            <Icon name="lock" size={14} /> Disponível depois que você enviar pelo menos uma tentativa. Errar faz parte: o importante é tentar antes de ver.
          </p>
        ) : showSolution ? (
          <div className="example-grid">
            <CodeBlock code={ex.solution} filename="solução de referência" annotated={annotatedSolution} />
            <ol className="line-notes static">
              {ex.solutionNotes.map((n, i) => (
                <li key={i} className="line-note">
                  <span className="ln-ref">{n.to ? `L${n.from}–${n.to}` : `L${n.from}`}</span>
                  <span>
                    <RichText text={n.text} />
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <button type="button" className="btn ghost" onClick={() => setShowSolution(true)}>
            Ver solução e explicação
          </button>
        )}
      </section>

      <nav className="pager" aria-label="Navegação entre exercícios">
        <Link to="/c-lab/trainer" className="btn ghost">
          ← Todos os exercícios
        </Link>
        {nextEx && (
          <Link to={`/c-lab/trainer/${nextEx.id}`} className="btn ghost">
            Próximo: {nextEx.title} →
          </Link>
        )}
      </nav>
    </article>
  );
}
