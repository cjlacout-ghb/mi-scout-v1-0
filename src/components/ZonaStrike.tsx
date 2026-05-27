'use client';

import type { ZonaStrike, Coordenadas } from '@/lib/types';

interface Props {
  onZonaClick: (zona: ZonaStrike, coordenadas?: Coordenadas) => void;
  /** Marcadores a mostrar sobre la zona (turnos del bateador actual) */
  marcadores?: { zona: ZonaStrike; tipo: 'ball' | 'strike' | 'contact'; coordenadas?: Coordenadas; resultado?: string; tipoPitch?: string; calidad?: string }[];
  /** Modo heat map: overlay de color por zona */
  heatMap?: Partial<Record<ZonaStrike, number>>;  // 0-1 intensidad
  /** Lado de bateo del bateador actual (D=Derecho, Z=Zurdo, S=Switch) */
  ladoBateo?: 'D' | 'Z' | 'S';
  /** Vista de la zona: catcher o pitcher */
  perspectiva?: 'catcher' | 'pitcher';
}

// Mapeo de resultado → tipo de marcador
export type TipoMarcador = 'ball' | 'strike' | 'contact';

// Posiciones relativas de los marcadores por zona (% dentro del área clicada)
// Para visualización: los ponemos en posiciones fijas pero ligeramente aleatorias visualmente
const ZONA_OFFSET: Record<ZonaStrike, { top: string; left: string }> = {
  1: { top: '75%', left: '35%' },
  2: { top: '75%', left: '65%' },
  3: { top: '30%', left: '35%' },
  4: { top: '30%', left: '65%' },
  5: { top: '90%', left: '10%' },
  6: { top: '90%', left: '90%' },
  7: { top: '10%', left: '10%' },
  8: { top: '10%', left: '90%' },
};

function heatColor(intensity: number): string {
  // 0 = frío (#1A3A5C) → 0.5 = neutro → 1 = caliente (#E74C3C)
  if (intensity <= 0) return 'transparent';
  const stops = [
    [0.0,  [26,  58,  92 ]],  // cold
    [0.25, [41,  128, 185]],  // cool
    [0.5,  [61,  90,  110]],  // neutral
    [0.75, [243, 156, 18 ]],  // warm
    [1.0,  [231, 76,  60 ]],  // hot
  ] as [number, number[]][];

  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (intensity >= stops[i][0] && intensity <= stops[i + 1][0]) {
      lo = stops[i]; hi = stops[i + 1]; break;
    }
  }
  const t = (intensity - lo[0]) / (hi[0] - lo[0]);
  const r = Math.round(lo[1][0] + t * (hi[1][0] - lo[1][0]));
  const g = Math.round(lo[1][1] + t * (hi[1][1] - lo[1][1]));
  const b = Math.round(lo[1][2] + t * (hi[1][2] - lo[1][2]));
  return `rgba(${r},${g},${b},0.65)`;
}

export default function ZonaStrikeComponent({ onZonaClick, marcadores = [], heatMap, ladoBateo, perspectiva = 'catcher' }: Props) {
  const hmColores: Partial<Record<ZonaStrike, string>> = {};
  if (heatMap) {
    for (const [z, v] of Object.entries(heatMap)) {
      hmColores[Number(z) as ZonaStrike] = heatColor(v as number);
    }
  }

  const handleClick = (e: React.MouseEvent, zona: ZonaStrike) => {
    const container = e.currentTarget.closest('.zona-outer');
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      onZonaClick(zona, { x, y });
    } else {
      onZonaClick(zona);
    }
  };

  return (
    <div className="zona-container zona-strike" style={{ position: 'relative' }}>
      {perspectiva === 'catcher' && (
        <>
          {ladoBateo === 'Z' && (
            <div style={{ position: 'absolute', top: 16, bottom: 16, right: 6, width: 8, background: '#FFB83D', borderRadius: 2 }} title="Bateador Zurdo" />
          )}
          {ladoBateo === 'D' && (
            <div style={{ position: 'absolute', top: 16, bottom: 16, left: 6, width: 8, background: '#FFB83D', borderRadius: 2 }} title="Bateador Derecho" />
          )}
        </>
      )}
      {perspectiva === 'pitcher' && (
        <>
          {ladoBateo === 'Z' && (
            <div style={{ position: 'absolute', top: 16, bottom: 16, left: 6, width: 8, background: '#FFB83D', borderRadius: 2 }} title="Bateador Zurdo (Pitcher view)" />
          )}
          {ladoBateo === 'D' && (
            <div style={{ position: 'absolute', top: 16, bottom: 16, right: 6, width: 8, background: '#FFB83D', borderRadius: 2 }} title="Bateador Derecho (Pitcher view)" />
          )}
        </>
      )}
      <div
        className="zona-outer"
        style={{ position: 'relative', background: 'var(--bg-elevated)' }}
      >
        {/* ── Etiquetas de esquinas (5, 6, 7, 8) ── */}
        <span className="zona-corner-label tl">7</span>
        <span className="zona-corner-label tr">8</span>
        <span className="zona-corner-label bl">5</span>
        <span className="zona-corner-label br">6</span>

        {/* ── Zonas esquina clicables ── */}
        {([7, 8, 5, 6] as const).map((z) => (
          <div
            key={z}
            className={`zona-esquina es${z}`}
            onClick={(e) => handleClick(e, z)}
            style={hmColores[z] ? { background: hmColores[z] } : undefined}
            role="button"
            aria-label={`Zona ${z}`}
          />
        ))}

        {/* ── Líneas divisorias extendidas al borde exterior ── */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
          {/* Línea vertical central */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '0.5px', background: 'var(--border)' }} />
          {/* Línea horizontal central */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '0.5px', background: 'var(--border)' }} />
        </div>

        {/* ── Cuadrado interior con los 4 cuadrantes ── */}
        <div className="zona-inner">
          {/* Orden visual: 3 (top-left), 4 (top-right), 1 (bottom-left), 2 (bottom-right) */}
          {([3, 4, 1, 2] as const).map((z) => (
            <div
              key={z}
              className="zona-cuadrante"
              onClick={(e) => handleClick(e, z)}
              style={hmColores[z] ? { background: hmColores[z] } : undefined}
              role="button"
              aria-label={`Zona ${z}`}
            >
              <span className="zona-cuadrante__num">{z}</span>
            </div>
          ))}
        </div>

        {/* ── Marcadores de pitch ── */}
        {marcadores.map((m, i) => {
          let topStr, leftStr;
          
          if (m.coordenadas) {
            // Coordenadas exactas proporcionadas
            topStr = `${(m.coordenadas.y * 100).toFixed(2)}%`;
            leftStr = `${(m.coordenadas.x * 100).toFixed(2)}%`;
          } else {
            // Fallback para turnos viejos sin coordenadas (usa offset estático)
            const pos = ZONA_OFFSET[m.zona] || { top: '50%', left: '50%' };
            const jitter = i * 4; // Solo aplicamos jitter a los viejos
            topStr = `calc(${pos.top} + ${jitter % 8}px)`;
            leftStr = `calc(${pos.left} + ${(jitter * 1.5) % 10}px)`;
          }

          let colorResultado = 'var(--text-primary)';
          if (m.resultado) {
            if (m.resultado === 'HIT') colorResultado = 'var(--danger)';
            else if (m.resultado === 'OUT' || m.resultado.startsWith('K')) colorResultado = 'var(--success)';
            else if (m.resultado === 'BB' || m.resultado === 'HBP') colorResultado = 'var(--info)';
          }

          return (
            <div
              key={i}
              className={`pitch-marker ${m.tipo} group`}
              style={{
                top: topStr,
                left: leftStr,
                transform: 'translate(-50%, -50%)',
                ...(m.resultado && colorResultado !== 'var(--text-primary)' ? { background: colorResultado } : {})
              }}
            >
              {m.calidad === 'hard' && (m.resultado === 'HIT' || m.resultado === 'OUT') && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '180%',
                    height: '180%',
                    borderRadius: '50%',
                    border: `2px solid ${m.resultado === 'HIT' ? 'var(--danger)' : 'var(--success)'}`,
                    pointerEvents: 'none',
                  }}
                />
              )}
              {m.resultado && (
                <div 
                  className="pitch-tooltip"
                  style={{ color: colorResultado }}
                >
                  {m.resultado}{m.tipoPitch ? `, ${m.tipoPitch.toLowerCase()}` : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
