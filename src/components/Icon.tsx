/** Ícones técnicos em SVG inline (traço), sem dependências. */
export type IconName = 'c' | 'ds' | 'algo' | 'cx' | 'exam' | 'prog' | 'home' | 'book' | 'swap' | 'code' | 'check' | 'lock' | 'menu' | 'arrow' | 'bulb' | 'play' | 'x' | 'clock';

const PATHS: Record<IconName, string> = {
  c: 'M15 7.5A5 5 0 1 0 15 16.5M4 4h16v16H4z',
  ds: 'M5 5h5v5H5zM14 14h5v5h-5zM10 7.5h4.5v6.5',
  algo: 'M4 18h3V9H4zM10.5 18h3V5h-3zM17 18h3v-6h-3z',
  cx: 'M4 20V4M4 20h16M6 17c4 0 6-3 8-7s3-5 6-5',
  exam: 'M7 3h10v18H7zM10 8h4M10 12h4M10 16h2',
  prog: 'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l7-7',
  home: 'M4 11l8-7 8 7v9H4zM10 20v-6h4v6',
  book: 'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v14',
  swap: 'M4 8h13l-3-3M20 16H7l3 3',
  code: 'M9 7l-5 5 5 5M15 7l5 5-5 5',
  check: 'M5 12l4 4 10-10',
  lock: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
  menu: 'M4 7h16M4 12h16M4 17h16',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11v1h6v-1a6 6 0 0 0-3-11',
  play: 'M7 5l12 7-12 7z',
  x: 'M6 6l12 12M18 6L6 18',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2',
};

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={`icon${className ? ' ' + className : ''}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
