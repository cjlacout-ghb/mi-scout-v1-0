'use client';

import { useState } from 'react';
import { useScout } from '@/context/ScoutContext';
import ZonaStrikeComponent from '@/components/ZonaStrike';
import { calcularEstadisticas } from '@/lib/storage';
import type { Bateador, ZonaStrike } from '@/lib/types';

function calcHeatMap(bateadorId: string, turnos: import('@/lib/types').TurnoAlBate[]): Partial<Record<ZonaStrike, number>> {
  const stats = calcularEstadisticas(bateadorId, turnos);
  const mapa: Partial<Record<ZonaStrike, number>> = {};
  let maxPitches = 0;
  for (let z = 1; z <= 8; z++) {
    maxPitches = Math.max(maxPitches, stats.porZona[z as ZonaStrike].pitches);
  }
  if (maxPitches === 0) return mapa;
  for (let z = 1; z <= 8; z++) {
    const d = stats.porZona[z as ZonaStrike];
    if (d.pitches === 0) { mapa[z as ZonaStrike] = 0; continue; }
    // Intensidad basada en tasa de contacto (hits / pitches)
    mapa[z as ZonaStrike] = d.hits / d.pitches;
  }
  return mapa;
}

export default function StatsPage() {
  const { estado } = useScout();
  const todos = [...(estado.lineupVisitante || []), ...(estado.lineupLocal || [])];
  const activos = todos.filter((b) => b.activo);

  const [selId, setSelId] = useState<string | null>(null);

  if (!estado.partido) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📊</div>
        <div className="empty-state__title">Sin partido activo</div>
        <p className="empty-state__text">Iniciá un partido para ver las estadísticas.</p>
      </div>
    );
  }

  const bateadorSel: Bateador | null =
    todos.find((b) => b.id === selId) ??
    activos[0] ??
    null;

  const stats = bateadorSel
    ? calcularEstadisticas(bateadorSel.id, estado.turnosAlBate)
    : null;

  const heatMap = bateadorSel ? calcHeatMap(bateadorSel.id, estado.turnosAlBate) : undefined;

  const avg = stats && stats.turnosAlBate > 0
    ? stats.promedio.toFixed(3).replace('0.', '.')
    : '---';

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Selector de bateador */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <label className="label">Bateador</label>
        <select
          className="input"
          value={selId ?? bateadorSel?.id ?? ''}
          onChange={(e) => setSelId(e.target.value || null)}
          style={{ fontWeight: 600 }}
        >
          {todos.map((b) => (
            <option key={b.id} value={b.id}>
              #{b.numero} {b.apellido}, {b.nombre} {!b.activo ? '(sale)' : ''}
            </option>
          ))}
        </select>
      </div>

      {!bateadorSel && (
        <div className="empty-state">
          <p className="text-secondary">Cargá bateadores en el Line-Up.</p>
        </div>
      )}

      {bateadorSel && stats && (
        <>
          {/* Stats cards */}
          <div className="stats-row" style={{ paddingTop: 12 }}>
            {[
              { label: 'AB', value: stats.turnosAlBate },
              { label: 'H',  value: stats.hits,  color: 'var(--success)' },
              { label: 'KS', value: stats.strikeoutsSwinging, color: 'var(--danger)' },
              { label: 'KL', value: stats.strikeoutsLooking,  color: 'var(--danger)' },
              { label: 'BB', value: stats.basesPorBolas, color: 'var(--info)' },
              { label: 'OUT',value: stats.outs },
              { label: 'AVG',value: avg, color: 'var(--accent)' },
            ].map(({ label, value, color }) => (
              <div className="stat-card" key={label}>
                <span className="stat-card__value" style={color ? { color } : undefined}>{value}</span>
                <span className="stat-card__label">{label}</span>
              </div>
            ))}
          </div>

          {/* Leyenda heat map */}
          <div className="heatmap-legend">
            <span className="heatmap-legend__label">FRÍO</span>
            <div className="heatmap-legend__bar" />
            <span className="heatmap-legend__label">CALIENTE</span>
          </div>

          {/* Zona heat map */}
          <ZonaStrikeComponent
            onZonaClick={() => {}}
            heatMap={heatMap}
          />

          {/* Tabla por zona */}
          <div style={{ padding: '4px 16px 16px' }}>
            <p className="section-title" style={{ marginBottom: 8 }}>Desglose por zona</p>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Zona</th>
                    <th style={{ textAlign: 'center' }}>Pitches</th>
                    <th style={{ textAlign: 'center' }}>Hits</th>
                    <th style={{ textAlign: 'center' }}>Outs</th>
                    <th style={{ textAlign: 'center' }}>% Cont.</th>
                  </tr>
                </thead>
                <tbody>
                  {([1,2,3,4,5,6,7,8] as ZonaStrike[]).map((z) => {
                    const d = stats.porZona[z];
                    const pct = d.pitches > 0 ? Math.round((d.contacto / d.pitches) * 100) : 0;
                    return (
                      <tr key={z}>
                        <td>
                          <span style={{ fontWeight: 700 }}>Zona {z}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{d.pitches}</td>
                        <td style={{ textAlign: 'center', color: d.hits > 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
                          {d.hits}
                        </td>
                        <td style={{ textAlign: 'center', color: d.outs > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                          {d.outs}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: pct > 50 ? 'var(--danger)' : pct > 25 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                          {d.pitches > 0 ? `${pct}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
