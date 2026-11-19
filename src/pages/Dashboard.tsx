import { CodeBlock } from '../components/CodeBlock';
import { Icon } from '../components/Icon';
import { RichText } from '../components/RichText';
import { EXERCISES } from '../content/exercises';
import { LESSONS } from '../content/lessons';
import { MODULES } from '../content/modules';
import { QUICK_REF } from '../content/quickref';
import { Link } from '../state/router';
import { LEVELS, computeLevel, stats, useProgress } from '../state/progress';

function HeroBlueprint() {
  return (
    <svg className="hero-art" viewBox="0 0 420 220" aria-hidden="true">
      <g className="ha-grid">
        {Array.from({ length: 22 }, (_, i) => (
          <line key={`v${i}`} x1={i * 20} y1={0} x2={i * 20} y2={220} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 20} x2={420} y2={i * 20} />
        ))}
      </g>
      <g className="ha-box">
        <rect x="18" y="86" width="70" height="44" rx="5" />
        <text x="28" y="102">list</text>
        <text x="28" y="120" className="t2">upo_list_t</text>
      </g>
      <path className="ha-arrow" d="M88 108 C 110 108, 112 108, 128 108" />
      {[0, 1, 2].map((i) => (
        <g key={i} className="ha-box node" transform={`translate(${130 + i * 96} ${i === 1 ? 60 : 86})`}>
          <rect width="76" height="52" rx="5" />
          <line x1="0" y1="26" x2="76" y2="26" />
          <text x="8" y="17">{['4', '8', '15'][i]}</text>
          <text x="8" y="43" className="t2">
            next
          </text>
          <circle cx="64" cy="39" r="3" />
        </g>
      ))}
      <path className="ha-arrow" d="M194 125 C 210 125, 212 112, 224 100" />
      <path className="ha-arrow" d="M290 99 C 306 99, 308 112, 320 112" />
      <text x="342" y="172" className="ha-null">
        NULL
      </text>
      <path className="ha-arrow dashed" d="M386 125 C 392 140, 380 160, 372 164" />
      <text x="18" y="200" className="ha-addr">
        0x00001130 · 0x00001800 · 0x00001804
      </text>
    </svg>
  );
}

export function Dashboard() {
  const { state } = useProgress();
  const s = stats(state);
  const lvl = computeLevel(state);
  const nextLesson = LESSONS.find((l) => !state.lessons[l.id]?.completed);
  const nextExercise = EXERCISES.find((e) => !state.exercises[e.id]?.solved);
  const started = s.lessonsDone > 0 || s.attempts > 0 || s.tracesSolved > 0;
  const startTarget = nextLesson ? `/c-lab/licao/${nextLesson.id}` : nextExercise ? `/c-lab/trainer/${nextExercise.id}` : '/c-lab';

  return (
    <div className="page dashboard">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">Università del Piemonte Orientale · DISIT Vercelli</p>
          <h1 className="hero-title">
            ALGO<span>LAB</span>
          </h1>
          <p className="hero-sub">Algoritmi 1 — C Programming &amp; Data Structures</p>
          <p className="hero-lead">
            Um laboratório para aprender a <strong>ler</strong> código C desconhecido e <strong>implementar a função que falta</strong>, do jeito que o exame
            prático pede: o header é dado, você escreve o corpo.
          </p>
          <div className="hero-actions">
            <Link to={startTarget} className="btn primary">
              <Icon name="play" /> {started ? 'Continuar estudando' : 'Começar a estudar'}
            </Link>
            <Link to="/c-lab/translator" className="btn ghost">
              <Icon name="swap" /> Abrir o Code Translator
            </Link>
          </div>
        </div>
        <HeroBlueprint />
      </section>

      <section aria-labelledby="ov-title" className="section">
        <h2 id="ov-title" className="section-title">
          <span className="st-num">//</span> Visão geral do progresso
        </h2>
        <div className="stat-grid">
          <div className="stat">
            <span className="stat-label">Lições concluídas</span>
            <span className="stat-value">
              {s.lessonsDone}
              <small>/{s.lessonsTotal}</small>
            </span>
            <div className="meter" aria-hidden="true">
              <i style={{ width: `${(s.lessonsDone / s.lessonsTotal) * 100}%` }} />
            </div>
          </div>
          <div className="stat">
            <span className="stat-label">Exercícios resolvidos</span>
            <span className="stat-value">
              {s.exercisesSolved}
              <small>/{s.exercisesTotal}</small>
            </span>
            <div className="meter" aria-hidden="true">
              <i style={{ width: `${(s.exercisesSolved / s.exercisesTotal) * 100}%` }} />
            </div>
          </div>
          <div className="stat level">
            <span className="stat-label">Nível atual</span>
            <span className="stat-value">
              {lvl.level}
              <small>/4</small>
            </span>
            <span className="stat-note">
              <strong>{LEVELS[lvl.level].name}.</strong> Próximo passo: {lvl.goal}
            </span>
          </div>
        </div>
        {!started && <p className="muted small">Tudo começa em zero: o progresso é salvo apenas neste navegador.</p>}
      </section>

      <div className="two-col">
        <section aria-labelledby="cont-title" className="section">
          <h2 id="cont-title" className="section-title">
            <span className="st-num">//</span> Continuar aprendendo
          </h2>
          <div className="continue-card">
            <div className="cc-head">
              <Icon name="c" size={22} />
              <div>
                <div className="cc-mod">01 · C Programming Lab</div>
                <div className="cc-title">{nextLesson ? `Lição ${nextLesson.number}: ${nextLesson.title}` : 'Todas as lições concluídas'}</div>
              </div>
            </div>
            <p className="muted">{nextLesson ? nextLesson.subtitle : 'Hora de praticar no Function Trainer.'}</p>
            <ol className="mini-path" aria-label="Trilha de lições">
              {LESSONS.map((l) => (
                <li key={l.id} className={state.lessons[l.id]?.completed ? 'done' : l.id === nextLesson?.id ? 'current' : ''} title={l.title}>
                  <Link to={`/c-lab/licao/${l.id}`} aria-label={`Lição ${l.number}: ${l.title}${state.lessons[l.id]?.completed ? ' (concluída)' : ''}`}>
                    {l.number}
                  </Link>
                </li>
              ))}
            </ol>
            <div className="cc-actions">
              <Link to={nextLesson ? `/c-lab/licao/${nextLesson.id}` : '/c-lab/trainer'} className="btn primary small">
                {nextLesson ? 'Abrir lição' : 'Abrir o Trainer'} <Icon name="arrow" />
              </Link>
              {nextExercise && (
                <Link to={`/c-lab/trainer/${nextExercise.id}`} className="btn ghost small">
                  Exercício: {nextExercise.title}
                </Link>
              )}
            </div>
          </div>
        </section>

        <section aria-labelledby="path-title" className="section">
          <h2 id="path-title" className="section-title">
            <span className="st-num">//</span> Trilha de aprendizagem
          </h2>
          <ol className="module-path">
            {MODULES.map((m) => (
              <li key={m.id} className={`mp-item ${m.status}`}>
                <Link to={m.route} className="mp-link">
                  <span className="mp-num">{String(m.number).padStart(2, '0')}</span>
                  <Icon name={m.icon} size={20} />
                  <span className="mp-text">
                    <span className="mp-title">{m.title}</span>
                    <span className="mp-desc">{m.description}</span>
                  </span>
                  <span className={`badge ${m.status === 'active' ? 'ok' : 'soon'}`}>{m.status === 'active' ? 'disponível' : 'em breve'}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="qr-title" className="section">
        <h2 id="qr-title" className="section-title">
          <span className="st-num">//</span> Referência rápida de C
        </h2>
        <div className="qr-grid">
          {QUICK_REF.map((q) => (
            <article key={q.title} className="qr-card">
              <h3>{q.title}</h3>
              <CodeBlock code={q.code} compact />
              <p>
                <RichText text={q.note} />
              </p>
              <Link to={`/c-lab/licao/${q.lesson}`} className="qr-link">
                Ver na lição <Icon name="arrow" size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="page-foot">
        Conteúdo baseado nos slides do laboratório de Algoritmi 1 (Anna Sapienza, UPO). Exemplos e exercícios são ilustrativos, escritos para o ALGOLAB;
        não são código original nem questões de exame do professor.
      </footer>
    </div>
  );
}
