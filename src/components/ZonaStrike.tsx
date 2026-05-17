'use client';

import type { ZonaStrike } from '@/lib/types';

interface Props {
  onZonaClick: (zona: ZonaStrike) => void;
  /** Marcadores a mostrar sobre la zona (turnos del bateador actual) */
  marcadores?: { zona: ZonaStrike; tipo: 'ball' | 'strike' | 'contact' }[];
  /** Modo heat map: overlay de color por zona */
  heatMap?: Partial<Record<ZonaStrike, number>>;  // 0-1 intensidad
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

export default function ZonaStrikeComponent({ onZonaClick, marcadores = [], heatMap }: Props) {
  const hmColores: Partial<Record<ZonaStrike, string>> = {};
  if (heatMap) {
    for (const [z, v] of Object.entries(heatMap)) {
      hmColores[Number(z) as ZonaStrike] = heatColor(v as number);
    }
  }

  return (
    <div className="zona-container zona-strike">
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
            onClick={() => onZonaClick(z)}
            style={hmColores[z] ? { background: hmColores[z] } : undefined}
            role="button"
            aria-label={`Zona ${z}`}
          />
        ))}

        {/* ── Cuadrado interior con los 4 cuadrantes ── */}
        <div className="zona-inner">
          {/* Orden visual: 3 (top-left), 4 (top-right), 1 (bottom-left), 2 (bottom-right) */}
          {([3, 4, 1, 2] as const).map((z) => (
            <div
              key={z}
              className="zona-cuadrante"
              onClick={() => onZonaClick(z)}
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
          const pos = ZONA_OFFSET[m.zona];
          // Pequeño offset para evitar superposición si hay varios en la misma zona
          const jitter = i * 4;
          return (
            <div
              key={i}
              className={`pitch-marker ${m.tipo}`}
              style={{
                top: `calc(${pos.top} + ${jitter % 8}px)`,
                left: `calc(${pos.left} + ${(jitter * 1.5) % 10}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
