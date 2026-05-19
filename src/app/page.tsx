'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScout } from '@/context/ScoutContext';
import { generarId } from '@/lib/storage';
import type { Bateador, Partido } from '@/lib/types';

// ─── Modal: Nuevo Partido ─────────────────────────────────────────────────────
function ModalNuevoPartido({ onClose }: { onClose: () => void }) {
  const { dispatch } = useScout();
  const [rival, setRival] = useState('');
  const [desc, setDesc] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const iniciar = () => {
    if (!rival.trim()) return;
    const partido: Partido = {
      id: generarId(),
      fecha,
      rival: rival.trim().toUpperCase(),
      descripcion: desc.trim() || `vs ${rival.trim().toUpperCase()}`,
      innings: 7,
      creadoEn: new Date().toISOString(),
    };
    dispatch({ type: 'INICIAR_PARTIDO', payload: { partido, lineup: [] } });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">Nuevo Partido</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="label">Equipo rival *</label>
            <input
              className="input"
              placeholder="Ej: AUS"
              value={rival}
              onChange={(e) => setRival(e.target.value)}
              autoFocus
              maxLength={20}
            />
          </div>
          <div className="form-group">
            <label className="label">Evento</label>
            <input
              className="input"
              placeholder="Ej: Torneo X — Juego 1"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="form-group">
            <label className="label">Fecha</label>
            <div style={{ position: 'relative' }}>
              <div className="input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: fecha ? 'inherit' : 'var(--text-muted)' }}>
                <span>
                  {fecha 
                    ? (() => {
                        const [y, m, d] = fecha.split('-');
                        return `${d}/${m}/${y}`;
                      })() 
                    : 'DD/MM/AAAA'}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-full" onClick={iniciar}>
            ▶ Iniciar partido
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Agregar / Editar Bateador ─────────────────────────────────────────
interface FormBateador {
  numero: string; apellido: string; nombre: string; equipo: string;
}
const FORM_VACIO: FormBateador = { numero: '', apellido: '', nombre: '', equipo: '' };

function ModalBateador({
  inicial,
  titulo,
  onGuardar,
  onClose,
}: {
  inicial?: FormBateador;
  titulo: string;
  onGuardar: (d: FormBateador) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormBateador>(inicial ?? FORM_VACIO);
  const set = (k: keyof FormBateador) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const guardar = () => {
    if (!form.apellido.trim() || !form.numero.trim()) return;
    onGuardar({
      numero: form.numero.trim(),
      apellido: form.apellido.trim().toUpperCase(),
      nombre: form.nombre.trim().toUpperCase(),
      equipo: form.equipo.trim().toUpperCase(),
    });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{titulo}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <div className="form-group">
              <label className="label"># Camiseta *</label>
              <input className="input" placeholder="7" value={form.numero} onChange={set('numero')} maxLength={3} inputMode="numeric" />
            </div>
            <div className="form-group">
              <label className="label">Equipo</label>
              <input className="input" placeholder="AUS" value={form.equipo} onChange={set('equipo')} maxLength={10} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Apellido *</label>
            <input className="input" placeholder="HORT" value={form.apellido} onChange={set('apellido')} maxLength={40} autoCapitalize="characters" />
          </div>
          <div className="form-group">
            <label className="label">Nombre</label>
            <input className="input" placeholder="LOCHLAN" value={form.nombre} onChange={set('nombre')} maxLength={40} autoCapitalize="characters" />
          </div>
          <button className="btn btn-primary btn-full" onClick={guardar}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Sustitución ───────────────────────────────────────────────────────
function ModalSustitucion({
  saliente,
  inning,
  onClose,
}: {
  saliente: Bateador;
  inning: number;
  onClose: () => void;
}) {
  const { dispatch } = useScout();
  const [form, setForm] = useState<FormBateador>(FORM_VACIO);
  const set = (k: keyof FormBateador) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const confirmar = () => {
    if (!form.apellido.trim() || !form.numero.trim()) return;
    dispatch({
      type: 'SUSTITUIR_BATEADOR',
      payload: {
        salienteId: saliente.id,
        entrante: {
          numero: form.numero.trim(),
          apellido: form.apellido.trim().toUpperCase(),
          nombre: form.nombre.trim().toUpperCase(),
          equipo: form.equipo.trim().toUpperCase() || saliente.equipo,
          activo: true,
        },
        inning,
      },
    });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">Sustitución</h2>
        <p className="sheet-subtitle">
          Sale: #{saliente.numero} {saliente.apellido}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          <p className="text-xs text-secondary" style={{ textAlign: 'center' }}>Ingresa los datos del jugador entrante</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <div className="form-group">
              <label className="label"># Camiseta *</label>
              <input className="input" placeholder="99" value={form.numero} onChange={set('numero')} maxLength={3} inputMode="numeric" />
            </div>
            <div className="form-group">
              <label className="label">Equipo</label>
              <input className="input" placeholder={saliente.equipo} value={form.equipo} onChange={set('equipo')} maxLength={10} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Apellido *</label>
            <input className="input" placeholder="APELLIDO" value={form.apellido} onChange={set('apellido')} maxLength={40} autoCapitalize="characters" />
          </div>
          <div className="form-group">
            <label className="label">Nombre</label>
            <input className="input" placeholder="NOMBRE" value={form.nombre} onChange={set('nombre')} maxLength={40} autoCapitalize="characters" />
          </div>
          <button className="btn btn-primary btn-full" onClick={confirmar}>Confirmar sustitución</button>
        </div>
      </div>
    </div>
  );
}

// ─── Ícono crosshair ──────────────────────────────────────────────────────────
const CrosshairIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="3" x2="12" y2="7" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="3" y1="12" x2="7" y2="12" />
    <line x1="17" y1="12" x2="21" y2="12" />
    <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
  </svg>
);

// ─── Pantalla principal: LINE-UP ──────────────────────────────────────────────
export default function LineupPage() {
  const { estado, dispatch, bateadorActual, bateadoresActivos } = useScout();
  const router = useRouter();

  const [showNuevoPartido, setShowNuevoPartido] = useState(false);
  const [showAgregarBateador, setShowAgregarBateador] = useState(false);
  const [editando, setEditando] = useState<Bateador | null>(null);
  const [sustituyendo, setSustituyendo] = useState<Bateador | null>(null);

  const agregarBateador = (d: FormBateador) => {
    const orden = estado.lineup.length + 1;
    dispatch({
      type: 'AGREGAR_BATEADOR',
      payload: { ...d, orden, activo: true },
    });
  };

  const editarBateador = (b: Bateador, d: FormBateador) => {
    dispatch({ type: 'EDITAR_BATEADOR', payload: { id: b.id, datos: d } });
  };

  const setBateadorActual = (idx: number) => {
    dispatch({ type: 'SET_BATEADOR_ACTUAL', payload: idx });
    router.push('/tracking');
  };

  // Armar lista mostrando sustituciones
  const filas: Array<{ bateador: Bateador; idxActivo?: number; esActual: boolean }> = [];
  const activos = estado.lineup.filter((b) => b.activo);
  for (const b of estado.lineup) {
    const idxActivo = activos.indexOf(b);
    filas.push({ bateador: b, idxActivo: idxActivo >= 0 ? idxActivo : undefined, esActual: bateadorActual?.id === b.id });
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* ── Landing Page (Sin partido) ── */}
      {!estado.partido && (
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          minHeight: 'calc(100vh - 160px)', padding: '32px 24px', textAlign: 'center',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ 
              width: 80, height: 80, background: 'var(--bg-elevated)', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 20px', border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#CCFF00" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M 6.5 4.5 A 9 9 0 0 0 6.5 19.5" />
                <path d="M 17.5 4.5 A 9 9 0 0 1 17.5 19.5" />
                <path d="M 7.5 7 L 5 8" />
                <path d="M 8.5 10 L 5.5 11" />
                <path d="M 8.5 14 L 5.5 13" />
                <path d="M 7.5 17 L 5 16" />
                <path d="M 16.5 7 L 19 8" />
                <path d="M 15.5 10 L 18.5 11" />
                <path d="M 15.5 14 L 18.5 13" />
                <path d="M 16.5 17 L 19 16" />
              </svg>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.03em' }}>
              Mi<span style={{ color: 'var(--accent)' }}>Scout</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>
              Tracking de pitcheos y zona de strike.
            </p>
          </div>
          
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button className="btn btn-primary btn-lg btn-full" style={{ boxShadow: 'var(--glow-accent)', padding: '18px 24px', fontSize: '1.05rem' }} onClick={() => setShowNuevoPartido(true)}>
              ▶ Comenzar Scouting
            </button>

          </div>
        </div>
      )}

      {/* ── Con partido ── */}
      {estado.partido && (
        <>
          {/* Info del partido */}
          <div style={{ padding: '12px 16px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: '1rem', fontWeight: 800 }}>vs {estado.partido.rival}</span>
              <span className="badge badge-accent">Inning {estado.inningActual}</span>
            </div>
            <p className="text-xs text-secondary" style={{ marginTop: 2 }}>{estado.partido.descripcion}</p>
          </div>

          {/* Cabecera de tabla */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 16px',
            borderBottom: '1px solid var(--border)',
          }}>
            <span className="text-xs text-secondary" style={{ width: 24 }}>ORD</span>
            <span className="text-xs text-secondary" style={{ width: 44, textAlign: 'center' }}>NUM</span>
            <span className="text-xs text-secondary" style={{ flex: 1, paddingLeft: 8 }}>APELLIDO Y NOMBRE</span>
            <span className="text-xs text-secondary" style={{ width: 36, textAlign: 'right' }}>TEAM</span>
            <span className="text-xs text-secondary" style={{ width: 40, textAlign: 'center' }}>TRACK</span>
          </div>

          {/* Filas del lineup */}
          {filas.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <p className="text-secondary text-sm">El line-up está vacío</p>
            </div>
          )}

          {filas.map(({ bateador: b, idxActivo, esActual }) => {
            const sustituido = estado.lineup.find((x) => x.id === b.reemplazadoPorId);
            return (
              <div key={b.id}>
                <div
                  className={`lineup-row${esActual ? ' current' : ''}${!b.activo ? ' inactivo' : ''}`}
                  onClick={() => {
                    if (!b.activo) return;
                    if (idxActivo !== undefined) setEditando(b);
                  }}
                >
                  <span className="lineup-orden">{b.orden}.</span>
                  <div className="lineup-numero">{b.numero}</div>
                  <div className="lineup-nombre">
                    {b.apellido}{b.nombre ? `, ${b.nombre}` : ''}
                  </div>
                  <span className="lineup-equipo">{b.equipo}</span>

                  {/* Track button — ir al tracking de este bateador */}
                  <button
                    className="lineup-track"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!b.activo || idxActivo === undefined) return;
                      setBateadorActual(idxActivo);
                    }}
                    aria-label={`Trackear ${b.apellido}`}
                    style={{ background: 'none', border: 'none', cursor: b.activo ? 'pointer' : 'default' }}
                  >
                    <CrosshairIcon color={esActual ? 'var(--accent)' : b.activo ? 'var(--text-muted)' : 'var(--border)'} />
                  </button>
                </div>

                {/* Nota de sustitución */}
                {!b.activo && sustituido && (
                  <div className="lineup-sustitucion">
                    ↳ Reemplazado por #{sustituido.numero} {sustituido.apellido} (Inning {b.reemplazadoAInning})
                  </div>
                )}
              </div>
            );
          })}

          {/* Acciones */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-ghost btn-full" onClick={() => setShowAgregarBateador(true)}>
              + Agregar bateador
            </button>
            {bateadorActual && (
              <button className="btn btn-ghost btn-full" style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }} onClick={() => setSustituyendo(bateadorActual)}>
                ⇄ Sustitución del bateador actual
              </button>
            )}
            <button className="btn btn-danger btn-full" onClick={() => {
              if (confirm('¿Iniciar un partido nuevo? Se perderán los datos actuales.')) {
                dispatch({ type: 'NUEVO_PARTIDO' });
              }
            }}>
              🗑 Nuevo partido
            </button>
          </div>
        </>
      )}

      {/* ── Modales ── */}
      {showNuevoPartido && <ModalNuevoPartido onClose={() => setShowNuevoPartido(false)} />}
      {showAgregarBateador && (
        <ModalBateador
          titulo="Agregar bateador"
          onGuardar={agregarBateador}
          onClose={() => setShowAgregarBateador(false)}
        />
      )}
      {editando && (
        <ModalBateador
          titulo="Editar bateador"
          inicial={{ numero: editando.numero, apellido: editando.apellido, nombre: editando.nombre, equipo: editando.equipo }}
          onGuardar={(d) => editarBateador(editando, d)}
          onClose={() => setEditando(null)}
        />
      )}
      {sustituyendo && (
        <ModalSustitucion
          saliente={sustituyendo}
          inning={estado.inningActual}
          onClose={() => setSustituyendo(null)}
        />
      )}


    </div>
  );
}
