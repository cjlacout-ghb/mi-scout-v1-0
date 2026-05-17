'use client';

import { useState } from 'react';
import { useScout } from '@/context/ScoutContext';
import { calcularEstadisticas, generarReporteMD } from '@/lib/storage';
import type { Bateador } from '@/lib/types';

function descargarMD(contenido: string, nombreArchivo: string) {
  const blob = new Blob([contenido], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export default function ReportePage() {
  const { estado } = useScout();
  const [selId, setSelId] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [modo, setModo] = useState<'individual' | 'equipo' | null>(null);

  const todos = estado.lineup;
  const partido = estado.partido;

  if (!partido) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📄</div>
        <div className="empty-state__title">Sin partido activo</div>
        <p className="empty-state__text">Iniciá un partido y registrá al menos un turno al bate para generar reportes.</p>
      </div>
    );
  }

  const generarIndividual = (b: Bateador) => {
    const stats = calcularEstadisticas(b.id, estado.turnosAlBate);
    const md = generarReporteMD(b, stats, estado.turnosAlBate, partido);
    setPreview(md);
    setModo('individual');
    setSelId(b.id);
  };

  const generarEquipo = () => {
    let md = `# Reporte de Scouting — Equipo ${partido.rival}\n\n`;
    md += `**Partido:** ${partido.descripcion}  \n`;
    md += `**Fecha:** ${new Date(partido.fecha).toLocaleDateString('es-AR')}\n\n`;
    md += `---\n\n`;

    for (const b of todos) {
      const stats = calcularEstadisticas(b.id, estado.turnosAlBate);
      if (stats.turnosAlBate === 0) continue;
      md += `## #${b.numero} ${b.apellido}, ${b.nombre}\n\n`;
      const avg = stats.promedio.toFixed(3).replace('0.', '.');
      md += `AB: ${stats.turnosAlBate} | H: ${stats.hits} | AVG: ${avg} | KS: ${stats.strikeoutsSwinging} | KL: ${stats.strikeoutsLooking} | BB: ${stats.basesPorBolas}\n\n`;
      // Zonas calientes
      const calientes = ([1,2,3,4,5,6,7,8] as const)
        .filter((z) => stats.porZona[z].hits > 0)
        .map((z) => `Zona ${z} (${stats.porZona[z].hits} H)`)
        .join(', ');
      if (calientes) md += `**Zonas calientes:** ${calientes}\n\n`;
      md += `---\n\n`;
    }

    md += `*Generado por Mi Scout v1.0*\n`;
    setPreview(md);
    setModo('equipo');
  };

  const descargar = () => {
    if (!preview) return;
    if (modo === 'equipo') {
      descargarMD(preview, `scout_${slugify(partido.rival)}_equipo.md`);
    } else {
      const b = todos.find((x) => x.id === selId);
      if (!b) return;
      descargarMD(preview, `scout_${slugify(b.apellido)}_${slugify(b.nombre || 'x')}.md`);
    }
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs text-secondary" style={{ marginBottom: 2 }}>{partido.descripcion}</p>
        <p style={{ fontWeight: 800, fontSize: '1rem' }}>vs {partido.rival}</p>
      </div>

      {/* Botones principales */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p className="section-title" style={{ marginBottom: 4 }}>Generar reporte</p>

        {/* Individual */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>👤 Reporte individual</p>
          <select
            className="input"
            value={selId}
            onChange={(e) => setSelId(e.target.value)}
          >
            <option value="">— Seleccioná un bateador —</option>
            {todos.map((b) => (
              <option key={b.id} value={b.id}>
                #{b.numero} {b.apellido}, {b.nombre}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-full"
            disabled={!selId}
            onClick={() => {
              const b = todos.find((x) => x.id === selId);
              if (b) generarIndividual(b);
            }}
            style={!selId ? { opacity: 0.5 } : undefined}
          >
            Generar reporte individual
          </button>
        </div>

        {/* Equipo */}
        <div className="card">
          <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 10 }}>👥 Reporte del equipo</p>
          <button className="btn btn-ghost btn-full" style={{ borderColor: 'var(--info)', color: 'var(--info)' }} onClick={generarEquipo}>
            Generar reporte completo — {partido.rival}
          </button>
        </div>
      </div>

      {/* Vista previa */}
      {preview && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p className="section-title">Vista previa</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={descargar}
            >
              ⬇ Descargar .md
            </button>
          </div>
          <div
            className="card"
            style={{
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '0.72rem',
              lineHeight: 1.6,
              maxHeight: 400,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: 'var(--text-secondary)',
              background: 'var(--bg-elevated)',
            }}
          >
            {preview}
          </div>

          <button
            className="btn btn-primary btn-lg btn-full"
            style={{ marginTop: 12 }}
            onClick={descargar}
          >
            ⬇ Descargar .md
          </button>
          <p className="text-xs text-secondary" style={{ textAlign: 'center', marginTop: 6 }}>
            El archivo se guardará en tu dispositivo
          </p>
        </div>
      )}
    </div>
  );
}
