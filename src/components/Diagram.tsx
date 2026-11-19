import type { Diagram as DiagramSpec, DiagramBox } from '../content/types';
import { RichText } from './RichText';

const W = 172;
const HEAD = 26;
const ROW = 26;
const GAP_X = 64;
const GAP_Y = 44;
const LABEL = 18;
const PAD = 14;

function boxHeight(b: DiagramBox) {
  return HEAD + Math.max(1, b.fields.length) * ROW;
}

function BoxDiagram({ spec }: { spec: Extract<DiagramSpec, { kind: 'boxes' }> }) {
  const rows = new Map<number, number>();
  for (const b of spec.boxes) rows.set(b.row ?? 0, Math.max(rows.get(b.row ?? 0) ?? 0, boxHeight(b)));
  const rowIdx = [...rows.keys()].sort((a, b) => a - b);
  const rowTop = new Map<number, number>();
  let y = PAD;
  for (const r of rowIdx) {
    rowTop.set(r, y + LABEL);
    y += LABEL + rows.get(r)! + GAP_Y;
  }
  const height = y - GAP_Y + PAD;
  const cols = Math.max(...spec.boxes.map((b) => b.col)) + 1;
  const width = PAD * 2 + cols * W + (cols - 1) * GAP_X;
  const pos = new Map(spec.boxes.map((b) => [b.id, { x: PAD + b.col * (W + GAP_X), y: rowTop.get(b.row ?? 0)!, b }]));

  const arrows: { d: string; key: string }[] = [];
  for (const b of spec.boxes) {
    const p = pos.get(b.id)!;
    b.fields.forEach((f, i) => {
      if (!f.to || f.to === 'NULL') return;
      const t = pos.get(f.to);
      if (!t) return;
      const sx = p.x + W - 10;
      const sy = p.y + HEAD + i * ROW + ROW / 2;
      let d: string;
      if (t.y > p.y + 4) {
        // destino em linha abaixo: entra pelo topo
        const ex = t.x + W / 2;
        const ey = t.y - 2;
        d = `M ${sx} ${sy} C ${sx + 40} ${sy}, ${ex} ${ey - 40}, ${ex} ${ey}`;
      } else if (t.x > p.x) {
        const ex = t.x - 2;
        const ey = t.y + HEAD / 2 + 2;
        d = `M ${sx} ${sy} C ${sx + 38} ${sy}, ${ex - 38} ${ey}, ${ex} ${ey}`;
      } else {
        // destino à esquerda/acima: contorna por cima
        const ex = t.x + W / 2;
        const ey = t.y - 2;
        d = `M ${sx} ${sy} C ${sx + 50} ${sy - 60}, ${ex} ${ey - 60}, ${ex} ${ey}`;
      }
      arrows.push({ d, key: `${b.id}-${i}` });
    });
  }

  const description = spec.boxes
    .map((b) => {
      const fs = b.fields
        .map((f) => {
          const name = f.name || 'valor';
          if (f.to === 'NULL') return `${name} = NULL`;
          if (f.to) {
            const t = spec.boxes.find((x) => x.id === f.to);
            return `${name} aponta para ${t?.label ?? t?.type ?? f.to}`;
          }
          return `${name} = ${f.value ?? ''}`;
        })
        .join('; ');
      return `${b.label ? b.label + ' ' : ''}(${b.type}): ${fs}.`;
    })
    .join(' ');

  return (
    <div className="diagram-scroll">
      <svg
        className="boxdiagram"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ maxWidth: width, minWidth: Math.round(width * 0.75) }}
        role="img"
        aria-label={`${spec.title}. ${description}`}
      >
        <defs>
          <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="arrowhead" />
          </marker>
        </defs>
        {spec.boxes.map((b) => {
          const p = pos.get(b.id)!;
          const h = boxHeight(b);
          return (
            <g key={b.id} className={`dbox v-${b.variant ?? 'var'}`}>
              {b.label && (
                <text x={p.x + 2} y={p.y - 6} className="dlabel">
                  {b.label}
                </text>
              )}
              <rect x={p.x} y={p.y} width={W} height={h} rx={6} className="dframe" />
              <rect x={p.x} y={p.y} width={W} height={HEAD} rx={6} className="dhead" />
              <rect x={p.x} y={p.y + HEAD - 6} width={W} height={6} className="dhead" />
              <text x={p.x + 10} y={p.y + 17} className="dtype">
                {b.type}
              </text>
              {b.fields.map((f, i) => {
                const fy = p.y + HEAD + i * ROW;
                const isNull = f.to === 'NULL';
                const isPtr = !!f.to && !isNull;
                return (
                  <g key={i}>
                    {i > 0 && <line x1={p.x} x2={p.x + W} y1={fy} y2={fy} className="dsep" />}
                    {f.name && (
                      <text x={p.x + 10} y={fy + 17} className="dfield">
                        {f.name}
                      </text>
                    )}
                    {f.name && <line x1={p.x + W * 0.56} x2={p.x + W * 0.56} y1={fy + 4} y2={fy + ROW - 4} className="dsep" />}
                    {isNull && (
                      <text x={p.x + W - 10} y={fy + 17} textAnchor="end" className="dnull">
                        NULL
                      </text>
                    )}
                    {isPtr && <circle cx={p.x + W - 10} cy={fy + ROW / 2} r={3.5} className="ddot" />}
                    {!f.to && f.value !== undefined && (
                      <text x={f.name ? p.x + W - 10 : p.x + W / 2} y={fy + 17} textAnchor={f.name ? 'end' : 'middle'} className="dvalue">
                        {f.value}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
        {arrows.map((a) => (
          <path key={a.key} d={a.d} className="darrow" markerEnd="url(#arrowhead)" />
        ))}
      </svg>
    </div>
  );
}

function MemoryTable({ spec }: { spec: Extract<DiagramSpec, { kind: 'memory' }> }) {
  return (
    <div className="memtable-wrap">
      <table className="memtable">
        <thead>
          <tr>
            <th scope="col">Variável</th>
            <th scope="col">Endereço</th>
            <th scope="col">Conteúdo</th>
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((r) => (
            <tr key={r.name} className={r.highlight ? 'hl' : ''}>
              <th scope="row">{r.name}</th>
              <td className="addr">{r.addr}</td>
              <td className="val">
                {r.value}
                {r.pointsTo && <span className="points"> → aponta para {r.pointsTo}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Diagram({ spec }: { spec: DiagramSpec }) {
  return (
    <figure className="diagram">
      <div className="diagram-title">
        <span className="tag">diagrama</span> {spec.title}
      </div>
      {spec.kind === 'boxes' ? <BoxDiagram spec={spec} /> : <MemoryTable spec={spec} />}
      {spec.caption && (
        <figcaption>
          <RichText text={spec.caption} />
        </figcaption>
      )}
    </figure>
  );
}
