import { Link } from '../state/router';

export function NotFound() {
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">404</p>
        <h1>Página não encontrada</h1>
        <p className="lead">Este endereço não aponta para nada (como um ponteiro NULL).</p>
      </header>
      <Link to="/" className="btn primary">
        Voltar ao painel
      </Link>
    </div>
  );
}
