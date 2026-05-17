'use client';

import { useState } from 'react';
import type {
  ZonaStrike, TipoPitch, ResultadoAtBat, TipoOut, TipoHit,
  CalidadContacto, NumeroDefensor, DetalleOut, DetalleHit,
} from '@/lib/types';

// ─── Pasos del flujo ──────────────────────────────────────────────────────────
type PasoModal =
  | 'tipo_pitch'
  | 'resultado'
  | 'detalle_out'
  | 'detalle_hit'
  | 'numero_defensor'
  | 'calidad';

interface EstadoModal {
  zona: ZonaStrike;
  tipoPitch?: TipoPitch;
  resultado?: ResultadoAtBat;
  tipoOut?: TipoOut;
  tipoHit?: TipoHit;
  numeroDefensor?: NumeroDefensor;
  calidad?: CalidadContacto;
}

interface RegistroPitchCompleto {
  zona: ZonaStrike;
  tipoPitch: TipoPitch;
  resultado: ResultadoAtBat;
  detalleOut?: DetalleOut;
  detalleHit?: DetalleHit;
}

interface Props {
  zona: ZonaStrike;
  onConfirmar: (datos: RegistroPitchCompleto) => void;
  onCancelar: () => void;
}

// ─── Labels ───────────────────────────────────────────────────────────────────
const NOMBRE_ZONA: Record<number, string> = {
  1: 'Zona 1 — Interior bajo izq.',
  2: 'Zona 2 — Interior bajo der.',
  3: 'Zona 3 — Interior alto izq.',
  4: 'Zona 4 — Interior alto der.',
  5: 'Zona 5 — Esquina inf. izq.',
  6: 'Zona 6 — Esquina inf. der.',
  7: 'Zona 7 — Esquina sup. izq.',
  8: 'Zona 8 — Esquina sup. der.',
};

const TIPOS_PITCH: { value: TipoPitch; label: string; emoji: string }[] = [
  { value: 'drop',   label: 'Drop',   emoji: '⬇️' },
  { value: 'riser',  label: 'Riser',  emoji: '⬆️' },
  { value: 'curva',  label: 'Curva',  emoji: '↩️' },
  { value: 'cambio', label: 'Cambio', emoji: '🔄' },
  { value: 'otro',   label: 'Otro',   emoji: '⚾' },
];

const TIPOS_RESULTADO: { value: ResultadoAtBat; label: string; color: string; desc: string }[] = [
  { value: 'BB/HP', label: 'BB / HP', color: 'var(--info)',    desc: 'Base por bolas o golpe' },
  { value: 'KS',    label: 'KS',      color: 'var(--danger)',  desc: 'Strikeout abanicando' },
  { value: 'KL',    label: 'KL',      color: 'var(--danger)',  desc: 'Strikeout cantado' },
  { value: 'OUT',   label: 'OUT',     color: 'var(--warning)', desc: 'Out en juego' },
  { value: 'HIT',   label: 'HIT',     color: 'var(--success)', desc: 'Llegó a base' },
];

const TIPOS_OUT: { value: TipoOut; label: string; desc: string }[] = [
  { value: 'asistencia', label: 'Asistencia', desc: 'Rodado / Tiro' },
  { value: 'fly',        label: 'Fly',        desc: 'Elevado' },
];

const TIPOS_HIT: { value: TipoHit; label: string; emoji: string }[] = [
  { value: 'bunt',    label: 'Bunt',     emoji: '🔸' },
  { value: 'single',  label: 'Single',   emoji: '1️⃣' },
  { value: 'doble',   label: 'Doble',    emoji: '2️⃣' },
  { value: 'triple',  label: 'Triple',   emoji: '3️⃣' },
  { value: 'homerun', label: 'Home Run', emoji: '🏠' },
];

export default function ModalPitch({ zona, onConfirmar, onCancelar }: Props) {
  const [paso, setPaso] = useState<PasoModal>('tipo_pitch');
  const [estado, setEstado] = useState<EstadoModal>({ zona });

  // ─── Handlers de cada paso ────────────────────────────────────────────────
  const elegirTipoPitch = (t: TipoPitch) => {
    setEstado((p) => ({ ...p, tipoPitch: t }));
    setPaso('resultado');
  };

  const elegirResultado = (r: ResultadoAtBat) => {
    setEstado((p) => ({ ...p, resultado: r }));
    if (r === 'OUT') setPaso('detalle_out');
    else if (r === 'HIT') setPaso('detalle_hit');
    else {
      // BB/HP, KS, KL → finalizar
      onConfirmar({
        zona: estado.zona,
        tipoPitch: estado.tipoPitch!,
        resultado: r,
      });
    }
  };

  const elegirTipoOut = (t: TipoOut) => {
    setEstado((p) => ({ ...p, tipoOut: t }));
    setPaso('numero_defensor');
  };

  const elegirTipoHit = (t: TipoHit) => {
    setEstado((p) => ({ ...p, tipoHit: t }));
    setPaso('numero_defensor');
  };

  const elegirNumero = (n: NumeroDefensor) => {
    setEstado((p) => ({ ...p, numeroDefensor: n }));
    setPaso('calidad');
  };

  const elegirCalidad = (c: CalidadContacto) => {
    const final = { ...estado, calidad: c };
    const resultado: RegistroPitchCompleto = {
      zona: final.zona,
      tipoPitch: final.tipoPitch!,
      resultado: final.resultado!,
    };
    if (final.resultado === 'OUT' && final.tipoOut && final.numeroDefensor) {
      resultado.detalleOut = { tipo: final.tipoOut, defensor: final.numeroDefensor, calidad: c };
    }
    if (final.resultado === 'HIT' && final.tipoHit && final.numeroDefensor) {
      resultado.detalleHit = { tipo: final.tipoHit, ubicacion: final.numeroDefensor, calidad: c };
    }
    onConfirmar(resultado);
  };

  const volver = () => {
    switch (paso) {
      case 'resultado':     setPaso('tipo_pitch');       break;
      case 'detalle_out':
      case 'detalle_hit':   setPaso('resultado');         break;
      case 'numero_defensor': setPaso(estado.resultado === 'OUT' ? 'detalle_out' : 'detalle_hit'); break;
      case 'calidad':       setPaso('numero_defensor');  break;
      default: onCancelar();
    }
  };

  // ─── Render pasos ─────────────────────────────────────────────────────────
  const renderContenido = () => {
    switch (paso) {
      case 'tipo_pitch':
        return (
          <>
            <p className="sheet-subtitle">{NOMBRE_ZONA[zona]}</p>
            <div className="options-grid">
              {TIPOS_PITCH.map((t) => (
                <button key={t.value} className="option-btn" onClick={() => elegirTipoPitch(t.value)}>
                  <span style={{ fontSize: '1.4rem' }}>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </>
        );

      case 'resultado':
        return (
          <>
            <p className="sheet-subtitle">Pitch: <strong>{estado.tipoPitch}</strong></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TIPOS_RESULTADO.map((r) => (
                <button
                  key={r.value}
                  className="option-btn"
                  style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 14 }}
                  onClick={() => elegirResultado(r.value)}
                >
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: r.color, width: 50 }}>
                    {r.label}
                  </span>
                  <span className="option-btn__label" style={{ fontSize: '0.82rem' }}>{r.desc}</span>
                </button>
              ))}
            </div>
          </>
        );

      case 'detalle_out':
        return (
          <>
            <p className="sheet-subtitle">Tipo de out</p>
            <div className="options-grid">
              {TIPOS_OUT.map((t) => (
                <button key={t.value} className="option-btn" onClick={() => elegirTipoOut(t.value)}>
                  <span>{t.label}</span>
                  <span className="option-btn__label">{t.desc}</span>
                </button>
              ))}
            </div>
          </>
        );

      case 'detalle_hit':
        return (
          <>
            <p className="sheet-subtitle">Tipo de hit</p>
            <div className="options-grid">
              {TIPOS_HIT.map((t) => (
                <button key={t.value} className="option-btn" onClick={() => elegirTipoHit(t.value)}>
                  <span style={{ fontSize: '1.2rem' }}>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </>
        );

      case 'numero_defensor': {
        const esHit = estado.resultado === 'HIT';
        return (
          <>
            <p className="sheet-subtitle">
              {esHit ? 'Ubicación del bateo' : `Defensor (${estado.tipoOut})`}
            </p>
            <div className="number-grid">
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as NumeroDefensor[]).map((n) => (
                <button key={n} className="number-btn" onClick={() => elegirNumero(n)}>
                  {n}
                </button>
              ))}
            </div>
          </>
        );
      }

      case 'calidad':
        return (
          <>
            <p className="sheet-subtitle">Calidad del contacto</p>
            <div className="options-grid">
              <button
                className="option-btn"
                style={{ padding: '24px 8px' }}
                onClick={() => elegirCalidad('soft')}
              >
                <span style={{ fontSize: '1.6rem' }}>🐌</span>
                <span>Soft</span>
                <span className="option-btn__label">Contacto débil</span>
              </button>
              <button
                className="option-btn"
                style={{ padding: '24px 8px' }}
                onClick={() => elegirCalidad('hard')}
              >
                <span style={{ fontSize: '1.6rem' }}>💥</span>
                <span>Hard</span>
                <span className="option-btn__label">Contacto fuerte</span>
              </button>
            </div>
          </>
        );
    }
  };

  const titulos: Record<PasoModal, string> = {
    tipo_pitch:      'Tipo de lanzamiento',
    resultado:       'Resultado al bate',
    detalle_out:     'Tipo de out',
    detalle_hit:     'Tipo de hit',
    numero_defensor: estado.resultado === 'HIT' ? 'Ubicación' : 'Defensor',
    calidad:         'Calidad del contacto',
  };

  return (
    <div className="overlay" onClick={onCancelar}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        {/* Breadcrumb / título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {paso !== 'tipo_pitch' && (
            <button
              onClick={volver}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '1.2rem', padding: '0 4px',
              }}
              aria-label="Volver"
            >
              ←
            </button>
          )}
          <h2 className="sheet-title" style={{ margin: 0, flex: 1 }}>{titulos[paso]}</h2>
          <button
            onClick={onCancelar}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1.3rem', padding: '0 4px',
            }}
            aria-label="Cancelar"
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {renderContenido()}
        </div>
      </div>
    </div>
  );
}
