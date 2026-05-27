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
  1: 'Zona 1',
  2: 'Zona 2',
  3: 'Zona 3',
  4: 'Zona 4',
  5: 'Zona 5',
  6: 'Zona 6',
  7: 'Zona 7',
  8: 'Zona 8',
};

const TIPOS_PITCH: { value: TipoPitch; label: string }[] = [
  { value: 'drop',   label: 'Drop' },
  { value: 'riser',  label: 'Riser' },
  { value: 'curva',  label: 'Curva' },
  { value: 'cambio', label: 'Cambio' },
  { value: 'otro',   label: 'Otro' },
];


const TIPOS_OUT: { value: TipoOut; label: string; desc: string }[] = [
  { value: 'asistencia', label: 'Asistencia', desc: 'Rodado / Tiro' },
  { value: 'fly',        label: 'Fly',        desc: 'Elevado' },
  { value: 'sac bunt',   label: 'Sac Bunt',   desc: 'Sacrificio' },
  { value: 'linea',      label: 'Línea',      desc: 'Line Drive' },
];

const TIPOS_HIT: { value: TipoHit; label: string }[] = [
  { value: 'single',  label: 'Single' },
  { value: 'doble',   label: 'Doble' },
  { value: 'triple',  label: 'Triple' },
  { value: 'homerun', label: 'Home Run' },
  { value: 'infield hit', label: 'Infield Hit' },
  { value: 'bunt',    label: 'Bunt Hit' },
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
      // BB/HBP, KS, KL → finalizar
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
          <div className="options-grid">
            {TIPOS_PITCH.map((t) => (
              <button key={t.value} className="option-btn" onClick={() => elegirTipoPitch(t.value)}>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        );

      case 'resultado':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* OUT */}
            <button
              className="option-btn"
              style={{ flexDirection: 'row', justifyContent: 'center', gap: 14 }}
              onClick={() => elegirResultado('OUT')}
            >
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--success)' }}>OUT</span>
            </button>
            {/* Grouped KS / KL card */}
            <div
              className="option-btn"
              style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 0, padding: 0, overflow: 'hidden', cursor: 'default' }}
            >
              <button
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'none', border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer', color: 'inherit' }}
                onClick={() => elegirResultado('KS')}
              >
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--success)' }}>KS</span>
              </button>
              <button
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                onClick={() => elegirResultado('KL')}
              >
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--success)' }}>KL</span>
              </button>
            </div>
            {/* HIT */}
            <button
              className="option-btn"
              style={{ flexDirection: 'row', justifyContent: 'center', gap: 14 }}
              onClick={() => elegirResultado('HIT')}
            >
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--danger)' }}>HIT</span>
            </button>
            {/* Grouped BB / HBP card */}
            <div
              className="option-btn"
              style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 0, padding: 0, overflow: 'hidden', cursor: 'default' }}
            >
              <button
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'none', border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer', color: 'inherit' }}
                onClick={() => elegirResultado('BB')}
              >
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--info)' }}>BB</span>
              </button>
              <button
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                onClick={() => elegirResultado('HBP')}
              >
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--info)' }}>HBP</span>
              </button>
            </div>
          </div>
        );

      case 'detalle_out':
        return (
          <div className="options-grid">
            {TIPOS_OUT.map((t) => (
              <button key={t.value} className="option-btn" onClick={() => elegirTipoOut(t.value)}>
                <span>{t.label}</span>
                <span className="option-btn__label">{t.desc}</span>
              </button>
            ))}
          </div>
        );

      case 'detalle_hit':
        return (
          <div className="options-grid">
            {TIPOS_HIT.map((t) => (
              <button key={t.value} className="option-btn" onClick={() => elegirTipoHit(t.value)}>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        );

      case 'numero_defensor': {
        return (
          <div className="number-grid">
            {([1, 2, 3, 4, 5, 6, 7, '7/8', 8, '8/9', 9, 10] as NumeroDefensor[]).map((n) => (
              <button key={n} className="number-btn" onClick={() => elegirNumero(n)}>
                {n}
              </button>
            ))}
          </div>
        );
      }

      case 'calidad':
        return (
          <div className="options-grid">
            <button
              className="option-btn"
              style={{ padding: '24px 8px' }}
              onClick={() => elegirCalidad('soft')}
            >
              <span>Soft</span>
              <span className="option-btn__label">Contacto débil</span>
            </button>
            <button
              className="option-btn"
              style={{ padding: '24px 8px' }}
              onClick={() => elegirCalidad('hard')}
            >
              <span>Hard</span>
              <span className="option-btn__label">Contacto fuerte</span>
            </button>
          </div>
        );
    }
  };

  const titulos: Record<PasoModal, string> = {
    tipo_pitch:      NOMBRE_ZONA[zona],
    resultado:       'Resultado al bate',
    detalle_out:     'Tipo de out',
    detalle_hit:     'Tipo de hit',
    numero_defensor: estado.resultado === 'HIT' ? 'Ubicación del bateo' : `Defensor (${estado.tipoOut})`,
    calidad:         'Calidad del contacto',
  };

  const subtitulos: Partial<Record<PasoModal, React.ReactNode>> = {
    tipo_pitch:      'Tipo de lanzamiento',
    resultado:       <>Pitch: <strong>{estado.tipoPitch}</strong></>,
  };

  return (
    <div className="overlay" onClick={onCancelar}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        {/* Breadcrumb / título */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          {paso !== 'tipo_pitch' ? (
            <button
              onClick={volver}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '1.2rem', padding: '0 4px', width: 32, textAlign: 'left'
              }}
              aria-label="Volver"
            >
              ←
            </button>
          ) : <div style={{ width: 32 }} />}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <h2 className="sheet-title" style={{ margin: 0 }}>{titulos[paso]}</h2>
            {subtitulos[paso] && (
              <p className="sheet-subtitle" style={{ margin: 0 }}>{subtitulos[paso]}</p>
            )}
          </div>

          <button
            onClick={onCancelar}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1.3rem', padding: '0 4px', width: 32, textAlign: 'right'
            }}
            aria-label="Cancelar"
          >
            ✕
          </button>
        </div>

        <div>
          {renderContenido()}
        </div>
      </div>
    </div>
  );
}
