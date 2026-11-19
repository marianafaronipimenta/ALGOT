import { Icon } from '../components/Icon';
import { getModule } from '../content/modules';
import { Link } from '../state/router';
import { NotFound } from './NotFound';

export function UpcomingModule({ id }: { id: string }) {
  const m = getModule(id);
  if (!m || m.status !== 'upcoming') return <NotFound />;
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">
          Módulo {String(m.number).padStart(2, '0')} <span className="badge soon">em breve</span>
        </p>
        <h1>{m.title}</h1>
        <p className="lead">{m.description}</p>
      </header>
      <div className="upcoming-box">
        <Icon name={m.icon} size={40} />
        <div>
          <h2>Ainda não implementado</h2>
          <p className="muted">
            Este módulo faz parte das próximas fases do ALGOLAB. Nada aqui é funcional ainda: em vez de mostrar uma tela falsa, listamos o que está planejado.
          </p>
          {m.planned && (
            <>
              <h3>Conteúdo previsto</h3>
              <ul className="bullets">
                {m.planned.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </>
          )}
          <p>
            Enquanto isso, a base para tudo isso está no{' '}
            <Link to="/c-lab" className="inline-link">
              C Programming Lab
            </Link>
            : ponteiros, structs, handles e convenções UPO.
          </p>
        </div>
      </div>
    </div>
  );
}
