import { Icon } from '../components/Icon';
import { EXERCISES } from '../content/exercises';
import { LESSONS } from '../content/lessons';
import { TRANSLATOR_EXAMPLES } from '../content/translator';
import { Link } from '../state/router';
import { useProgress } from '../state/progress';

export function CLabHome() {
  const { state } = useProgress();
  const firstOpen = LESSONS.find((l) => !state.lessons[l.id]?.completed);
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Módulo 01</p>
        <h1>C Programming Lab</h1>
        <p className="lead">
          Oito lições curtas sobre o C que aparece no código do curso, do básico de funções até handles opacos e as convenções <code className="ic">upo_</code>.
          Cada lição tem exemplo comentado linha a linha, diagrama de memória quando ajuda, e uma checagem rápida de compreensão.
        </p>
      </header>

      <section className="section" aria-labelledby="lp">
        <h2 id="lp" className="section-title">
          <span className="st-num">//</span> Trilha de lições
        </h2>
        <ol className="lesson-list">
          {LESSONS.map((l) => {
            const p = state.lessons[l.id];
            const answered = p ? Object.values(p.quiz).filter(Boolean).length : 0;
            return (
              <li key={l.id} className={`lesson-card${p?.completed ? ' done' : ''}${firstOpen?.id === l.id ? ' current' : ''}`}>
                <Link to={`/c-lab/licao/${l.id}`}>
                  <span className="lc-num">{String(l.number).padStart(2, '0')}</span>
                  <span className="lc-body">
                    <span className="lc-title">{l.title}</span>
                    <span className="lc-sub">{l.subtitle}</span>
                  </span>
                  <span className="lc-status">
                    {p?.completed ? (
                      <span className="badge ok">
                        <Icon name="check" size={14} /> concluída
                      </span>
                    ) : answered > 0 ? (
                      <span className="badge">
                        {answered}/{l.quiz.length} perguntas
                      </span>
                    ) : firstOpen?.id === l.id ? (
                      <span className="badge accent">próxima</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="two-col">
        <Link to="/c-lab/translator" className="feature-card">
          <Icon name="swap" size={26} />
          <h2>Code Translator</h2>
          <p>
            Código no estilo do professor (<code className="ic">upo_bst_node_t</code>, <code className="ic">upo_bst_t</code>, <code className="ic">_impl</code>) lado a lado
            com a mesma lógica em nomes genéricos, e uma explicação para cada linha.
          </p>
          <span className="fc-meta">{TRANSLATOR_EXAMPLES.length} exemplos</span>
        </Link>
        <Link to="/c-lab/trainer" className="feature-card">
          <Icon name="code" size={26} />
          <h2>Function Implementation Trainer</h2>
          <p>Leia a assinatura e a struct, escreva a função que falta e rode testes. Dicas progressivas e explicação dos erros de ponteiro e memória.</p>
          <span className="fc-meta">
            {EXERCISES.length} exercícios introdutórios · {EXERCISES.filter((e) => state.exercises[e.id]?.solved).length} resolvidos
          </span>
        </Link>
      </div>
    </div>
  );
}
