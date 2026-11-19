import { useEffect, useState, type ReactNode } from 'react';
import { MODULES } from '../content/modules';
import { Link } from '../state/router';
import { computeLevel, stats, useProgress } from '../state/progress';
import { Icon } from './Icon';

export function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" className="logo-mark">
      <rect x="1" y="1" width="32" height="32" rx="7" className="lm-bg" />
      <path d="M8 25 L17 8 L26 25" className="lm-a" />
      <path d="M11.5 19h11" className="lm-bar" />
      <circle cx="17" cy="19" r="2.6" className="lm-dot" />
    </svg>
  );
}

function NavItem({ to, active, icon, children, upcoming }: { to: string; active: boolean; icon: Parameters<typeof Icon>[0]['name']; children: ReactNode; upcoming?: boolean }) {
  return (
    <Link to={to} className={`nav-item${active ? ' active' : ''}${upcoming ? ' upcoming' : ''}`} aria-current={active ? 'page' : undefined}>
      <Icon name={icon} />
      <span className="nav-label">{children}</span>
      {upcoming && <span className="soon">em breve</span>}
    </Link>
  );
}

export function Layout({ route, children }: { route: string[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { state } = useProgress();
  const s = stats(state);
  const lvl = computeLevel(state);
  const path = '/' + route.join('/');
  useEffect(() => setOpen(false), [path]);

  const isActive = (r: string) => (r === '/' ? path === '/' : path === r || path.startsWith(r + '/'));

  return (
    <div className="shell">
      <a href="#main" className="skip">
        Pular para o conteúdo
      </a>
      <header className="topbar">
        <button type="button" className="icon-btn menu-btn" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? 'x' : 'menu'} size={22} />
        </button>
        <Link to="/" className="brand-inline">
          <Logo />
          <span>ALGOLAB</span>
        </Link>
      </header>

      <aside id="sidebar" className={`sidebar${open ? ' open' : ''}`} aria-label="Navegação principal">
        <Link to="/" className="brand">
          <Logo />
          <span className="brand-text">
            <span className="brand-name">ALGOLAB</span>
            <span className="brand-sub">Algoritmi 1 · UPO</span>
          </span>
        </Link>

        <nav className="nav">
          <NavItem to="/" active={isActive('/')} icon="home">
            Painel
          </NavItem>
          <div className="nav-group">Módulos</div>
          {MODULES.map((m) => (
            <NavItem key={m.id} to={m.route} active={isActive(m.route)} icon={m.icon} upcoming={m.status === 'upcoming'}>
              <span className="nav-num">{String(m.number).padStart(2, '0')}</span> {m.title}
            </NavItem>
          ))}
          {isActive('/c-lab') && (
            <div className="subnav" aria-label="C Programming Lab">
              <Link to="/c-lab" className={path === '/c-lab' || path.startsWith('/c-lab/licao') ? 'active' : ''}>
                Lições
              </Link>
              <Link to="/c-lab/translator" className={path.startsWith('/c-lab/translator') ? 'active' : ''}>
                Code Translator
              </Link>
              <Link to="/c-lab/trainer" className={path.startsWith('/c-lab/trainer') ? 'active' : ''}>
                Function Trainer
              </Link>
            </div>
          )}
        </nav>

        <div className="side-status" aria-label="Resumo do progresso">
          <div className="ss-row">
            <span>Lições</span>
            <strong>
              {s.lessonsDone}/{s.lessonsTotal}
            </strong>
          </div>
          <div className="meter" aria-hidden="true">
            <i style={{ width: `${(s.lessonsDone / s.lessonsTotal) * 100}%` }} />
          </div>
          <div className="ss-row">
            <span>Exercícios</span>
            <strong>
              {s.exercisesSolved}/{s.exercisesTotal}
            </strong>
          </div>
          <div className="ss-level">
            Nível {lvl.level} · {lvl.name}
          </div>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
