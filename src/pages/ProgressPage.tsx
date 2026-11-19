import { Icon } from '../components/Icon';
import { EXERCISES } from '../content/exercises';
import { LESSONS } from '../content/lessons';
import { TRANSLATOR_EXAMPLES } from '../content/translator';
import type { Level } from '../content/types';
import { Link } from '../state/router';
import { LEVELS, computeLevel, stats, useProgress } from '../state/progress';

export function ProgressPage() {
  const { state, reset, exercise } = useProgress();
  const s = stats(state);
  const lvl = computeLevel(state);
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Módulo 06</p>
        <h1>Progresso</h1>
        <p className="lead">Tudo o que você concluiu, salvo neste navegador (sem conta, sem servidor). Limpar os dados do navegador apaga o progresso.</p>
      </header>

      <section className="section">
        <h2 className="section-title">
          <span className="st-num">//</span> Nível atual
        </h2>
        <ol className="level-track">
          {([1, 2, 3, 4] as Level[]).map((l) => (
            <li key={l} className={l < lvl.level ? 'done' : l === lvl.level ? 'current' : ''}>
              <span className="lvl-badge" data-level={l}>
                N{l}
              </span>
              <strong>{LEVELS[l].name}</strong>
              <span className="muted small">{LEVELS[l].description}</span>
            </li>
          ))}
        </ol>
        <p>
          <strong>Próximo passo:</strong> {lvl.goal}
        </p>
        <p className="muted small">
          Critério: N1 → N2 ao responder todos os aquecimentos de rastreamento; N2 → N3 ao resolver os exercícios de nível 2; N3 → N4 ao resolver todos os de
          nível 3.
        </p>
      </section>

      <div className="two-col section">
        <section className="panel">
          <h2 className="panel-title">
            <Icon name="book" /> Lições ({s.lessonsDone}/{s.lessonsTotal})
          </h2>
          <ul className="check-list">
            {LESSONS.map((l) => {
              const p = state.lessons[l.id];
              const q = p ? Object.values(p.quiz).filter(Boolean).length : 0;
              return (
                <li key={l.id} className={p?.completed ? 'done' : ''}>
                  <Icon name={p?.completed ? 'check' : 'book'} size={16} />
                  <Link to={`/c-lab/licao/${l.id}`}>
                    {l.number}. {l.title}
                  </Link>
                  <span className="muted small">
                    {q}/{l.quiz.length} perguntas
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="panel">
          <h2 className="panel-title">
            <Icon name="code" /> Exercícios ({s.exercisesSolved}/{s.exercisesTotal})
          </h2>
          <ul className="check-list">
            {EXERCISES.map((e) => {
              const p = exercise(e.id);
              return (
                <li key={e.id} className={p.solved ? 'done' : ''}>
                  <Icon name={p.solved ? 'check' : 'code'} size={16} />
                  <Link to={`/c-lab/trainer/${e.id}`}>{e.title}</Link>
                  <span className="muted small">
                    N1 {p.traceSolved ? '✓' : '·'} · {p.attempts} tentativa(s) · melhor {p.bestPassed}/{e.tests.length} · dicas {p.hintsShown}/{e.hints.length}
                    {p.solvedInExamMode ? ' · modo exame ✓' : ''}
                  </span>
                </li>
              );
            })}
          </ul>
          <h3 className="panel-sub">Code Translator</h3>
          <p className="muted small">
            {s.translatorSeen}/{TRANSLATOR_EXAMPLES.length} exemplos abertos
          </p>
        </section>
      </div>

      <section className="section">
        <button
          type="button"
          className="btn danger small"
          onClick={() => {
            if (window.confirm('Apagar todo o progresso salvo neste navegador? Isso não pode ser desfeito.')) reset();
          }}
        >
          Apagar progresso
        </button>
      </section>
    </div>
  );
}
