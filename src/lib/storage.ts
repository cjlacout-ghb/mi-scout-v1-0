'use client';

import type { EstadoPartido, Bateador, TurnoAlBate, Partido } from './types';

const STORAGE_KEY = 'mi_scout_estado';

export const estadoInicial: EstadoPartido = {
  partido: null,
  lineup: [],
  turnosAlBate: [],
  bateadorActualIndex: 0,
  inningActual: 1,
  vueltasAlOrden: 0,
};

export function cargarEstado(): EstadoPartido {
  if (typeof window === 'undefined') return estadoInicial;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return estadoInicial;
    return JSON.parse(raw) as EstadoPartido;
  } catch {
    return estadoInicial;
  }
}

export function guardarEstado(estado: EstadoPartido): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

export function limpiarEstado(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// UUID simple sin dependencias externas
export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ─── Helpers de estadísticas ───────────────────────────────────────────────────
import type { EstadisticasBateador, ZonaStrike } from './types';

export function calcularEstadisticas(
  bateadorId: string,
  turnos: TurnoAlBate[]
): EstadisticasBateador {
  const misTurnos = turnos.filter((t) => t.bateadorId === bateadorId);

  const porZona = {} as EstadisticasBateador['porZona'];
  for (let z = 1; z <= 8; z++) {
    porZona[z as ZonaStrike] = { pitches: 0, hits: 0, outs: 0, contacto: 0 };
  }

  let hits = 0, dobles = 0, triples = 0, homeRuns = 0;
  let ks = 0, kl = 0, bb = 0, outs = 0;

  for (const t of misTurnos) {
    const z = t.zona;
    porZona[z].pitches++;

    switch (t.resultado) {
      case 'HIT':
        hits++;
        porZona[z].hits++;
        porZona[z].contacto++;
        if (t.detalleHit?.tipo === 'doble') dobles++;
        if (t.detalleHit?.tipo === 'triple') triples++;
        if (t.detalleHit?.tipo === 'homerun') homeRuns++;
        break;
      case 'OUT':
        outs++;
        porZona[z].outs++;
        porZona[z].contacto++;
        break;
      case 'KS': ks++; break;
      case 'KL': kl++; break;
      case 'BB/HP': bb++; break;
    }
  }

  const ab = misTurnos.length;
  const promedio = ab > 0 ? hits / ab : 0;

  return {
    bateadorId,
    turnosAlBate: ab,
    hits,
    dobles,
    triples,
    homeRuns,
    strikeoutsSwinging: ks,
    strikeoutsLooking: kl,
    basesPorBolas: bb,
    outs,
    promedio,
    porZona,
  };
}

// ─── Generador de reporte MD ───────────────────────────────────────────────────
import type { ZonaStrike as ZS } from './types';

const NOMBRE_ZONA: Record<number, string> = {
  1: 'Interior bajo izquierdo',
  2: 'Interior bajo derecho',
  3: 'Interior alto izquierdo',
  4: 'Interior alto derecho',
  5: 'Esquina inferior izquierda',
  6: 'Esquina inferior derecha',
  7: 'Esquina superior izquierda',
  8: 'Esquina superior derecha',
};

export function generarReporteMD(
  bateador: Bateador,
  stats: EstadisticasBateador,
  turnos: TurnoAlBate[],
  partido: Partido
): string {
  const avg = stats.promedio.toFixed(3).replace('0.', '.');
  const misTurnos = turnos.filter((t) => t.bateadorId === bateador.id);

  // Zonas calientes (contacto >= 1 hit)
  const zonasCalientes = (Object.entries(stats.porZona) as [string, { hits: number; pitches: number }][])
    .filter(([, v]) => v.hits > 0)
    .sort((a, b) => b[1].hits - a[1].hits);

  const zonasFrias = (Object.entries(stats.porZona) as [string, { hits: number; pitches: number }][])
    .filter(([, v]) => v.pitches > 0 && v.hits === 0)
    .sort((a, b) => b[1].pitches - a[1].pitches);

  let md = `# Reporte de Scouting — ${bateador.apellido}, ${bateador.nombre} (#${bateador.numero})\n\n`;
  md += `**Partido:** ${partido.descripcion}  \n`;
  md += `**Fecha:** ${new Date(partido.fecha).toLocaleDateString('es-AR')}  \n`;
  md += `**Equipo:** ${bateador.equipo}\n\n`;
  md += `---\n\n`;

  md += `## Resumen\n\n`;
  md += `| AB | H | 2B | 3B | HR | KS | KL | BB/HP | OUT | AVG |\n`;
  md += `|----|---|----|----|----|----|----|----|-----|-----|\n`;
  md += `| ${stats.turnosAlBate} | ${stats.hits} | ${stats.dobles} | ${stats.triples} | ${stats.homeRuns} | ${stats.strikeoutsSwinging} | ${stats.strikeoutsLooking} | ${stats.basesPorBolas} | ${stats.outs} | ${avg} |\n\n`;

  md += `---\n\n`;
  md += `## Análisis por Zona\n\n`;
  md += `| Zona | Descripción | Pitches | Hits | Outs | % Contacto |\n`;
  md += `|------|-------------|---------|------|------|------------|\n`;
  for (let z = 1; z <= 8; z++) {
    const d = stats.porZona[z as ZS];
    const pct = d.pitches > 0 ? Math.round((d.contacto / d.pitches) * 100) : 0;
    md += `| ${z} | ${NOMBRE_ZONA[z]} | ${d.pitches} | ${d.hits} | ${d.outs} | ${pct}% |\n`;
  }

  md += `\n---\n\n`;

  if (zonasCalientes.length > 0) {
    md += `## Zonas Calientes 🔥\n\n`;
    for (const [z, v] of zonasCalientes) {
      const pct = v.pitches > 0 ? Math.round((v.hits / v.pitches) * 100) : 0;
      md += `- **Zona ${z}** (${NOMBRE_ZONA[Number(z)]}): ${v.hits} hit(s) en ${v.pitches} pitch(es) — ${pct}% efectividad\n`;
    }
    md += '\n';
  }

  if (zonasFrias.length > 0) {
    md += `## Zonas Frías ❄️\n\n`;
    for (const [z, v] of zonasFrias) {
      md += `- **Zona ${z}** (${NOMBRE_ZONA[Number(z)]}): 0 hits en ${v.pitches} pitch(es)\n`;
    }
    md += '\n';
  }

  md += `---\n\n`;
  md += `## Recomendación de Pitcheo\n\n`;
  if (zonasFrias.length > 0) {
    const top = zonasFrias.slice(0, 2).map(([z]) => `Zona ${z}`).join(' y ');
    md += `Atacar preferentemente ${top} donde el bateador no ha demostrado efectividad.\n\n`;
  } else {
    md += `El bateador ha mostrado efectividad en múltiples zonas. Variar velocidad y tipo de pitch.\n\n`;
  }

  md += `---\n\n`;
  md += `## Detalle de Turnos al Bate\n\n`;
  for (let i = 0; i < misTurnos.length; i++) {
    const t = misTurnos[i];
    md += `### Turno ${i + 1} — Inning ${t.inning}\n\n`;
    md += `- **Zona:** ${t.zona} (${NOMBRE_ZONA[t.zona]})\n`;
    md += `- **Tipo de pitch:** ${t.tipoPitch.charAt(0).toUpperCase() + t.tipoPitch.slice(1)}\n`;
    md += `- **Resultado:** ${t.resultado}`;
    if (t.detalleOut) {
      md += ` → ${t.detalleOut.tipo.charAt(0).toUpperCase() + t.detalleOut.tipo.slice(1)} al #${t.detalleOut.defensor} (${t.detalleOut.calidad.toUpperCase()})`;
    }
    if (t.detalleHit) {
      md += ` → ${t.detalleHit.tipo.charAt(0).toUpperCase() + t.detalleHit.tipo.slice(1)} a zona ${t.detalleHit.ubicacion} (${t.detalleHit.calidad.toUpperCase()})`;
    }
    md += '\n\n';
  }

  md += `---\n\n*Generado por Mi Scout v1.0*\n`;
  return md;
}
