import { Icon } from '../components/Icon';
import { EXERCISES } from '../content/exercises';
import { Link } from '../state/router';
import { LEVELS, useProgress } from '../state/progress';
import type { Level } from '../content/types';

export function TrainerHome() {
  const { exercise } = useProgress();
  return (
    <div className="page">
      <nav className="crumbs" aria-label="Você está em">
        <Link to="/c-lab">C Programming Lab</Link> <span aria-hidden="true">/</span> <span>Function Trainer</span>
      </nav>
      <header className="page-head">
        <p className="eyebrow">Ferramenta</p>
        <h1>Function Implementation Trainer</h1>
        <p className="lead">
          Como no exame: a infraestrutura já existe, falta uma função. Você lê a assinatura e as structs, escreve só o corpo, e roda os testes.
        </p>
      </header>

      <div className="notice">
        <Icon name="bulb" />
        <p>
          Os testes rodam no <strong>simulador do ALGOLAB</strong>: um interpretador de um subconjunto de C, feito em TypeScript, que roda no seu navegador.
          Ele <strong>não é o gcc</strong> e não compila de verdade, mas modela ponteiros, NULL, memória não inicializada e free() para explicar erros que em C
          real virariam “Segmentation fault”. Exercícios ilustrativos, não questões do professor.
        </p>
      </div>

      <section className="section" aria-labelledby="lv">
        <h2 id="lv" className="section-title">
          <span className="st-num">//</span> Níveis de dificuldade
        </h2>
        <ol className="level-strip">
          {([1, 2, 3, 4] as Level[]).map((l) => (
            <li key={l}>
              <span className="lvl-badge" data-level={l}>
                N{l}
              </span>
              <span>
                <strong>{LEVELS[l].name}</strong>
                <span className="muted small"> {LEVELS[l].description}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="muted small">
          Cada exercício começa com um aquecimento de nível 1 (rastrear código). O nível 4 é o <strong>modo exame</strong>, que você pode ativar em qualquer
          exercício: sem dicas, com cronômetro.
        </p>
      </section>

      <section className="section" aria-labelledby="exl">
        <h2 id="exl" className="section-title">
          <span className="st-num">//</span> Exercícios
        </h2>
        <ol className="exercise-list">
          {EXERCISES.map((e, i) => {
            const p = exercise(e.id);
            return (
              <li key={e.id}>
                <Link to={`/c-lab/trainer/${e.id}`} className={`exercise-card${p.solved ? ' done' : ''}`}>
                  <span className="lvl-badge" data-level={e.level}>
                    N{e.level}
                  </span>
                  <span className="exc-body">
                    <span className="exc-title">
                      {i + 1}. {e.title}
                    </span>
                    <code className="exc-sig">{e.signature}</code>
                    <span className="exc-sum">{e.summary}</span>
                    <span className="chips">
                      {e.concepts.map((c) => (
                        <span key={c} className="chip static">
                          {c}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="exc-status">
                    {p.solved ? (
                      <span className="badge ok">
                        <Icon name="check" size={14} /> resolvido{p.solvedInExamMode ? ' (exame)' : ''}
                      </span>
                    ) : p.attempts > 0 ? (
                      <span className="badge">
                        {p.bestPassed}/{p.total} testes · {p.attempts} tentativa{p.attempts > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="badge soon">não iniciado</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
