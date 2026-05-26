'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScout } from '@/context/ScoutContext';
import { generarId } from '@/lib/storage';
import ModalConfirm from '@/components/ModalConfirm';
import type { Bateador, Partido } from '@/lib/types';

// ─── Modal: Nuevo Partido ─────────────────────────────────────────────────────
function ModalNuevoPartido({ onClose }: { onClose: () => void }) {
  const { dispatch } = useScout();
  const [visitante, setVisitante] = useState('');
  const [local, setLocal] = useState('');
  const [desc, setDesc] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [perspectiva, setPerspectiva] = useState<'catcher' | 'pitcher'>('catcher');

  const iniciar = () => {
    if (!visitante.trim() || !local.trim()) return;
    const partido: Partido = {
      id: generarId(),
      fecha,
      visitante: visitante.trim().toUpperCase(),
      local: local.trim().toUpperCase(),
      descripcion: desc.trim() || `${visitante.trim().toUpperCase()} vs ${local.trim().toUpperCase()}`,
      innings: 7,
      creadoEn: new Date().toISOString(),
    };
    dispatch({ type: 'INICIAR_PARTIDO', payload: { partido, lineupVisitante: [], lineupLocal: [], perspectivaZona: perspectiva } });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">Nuevo Partido</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="label">Equipo Visitante *</label>
            <input
              className="input"
              placeholder="Ej: AUS"
              value={visitante}
              onChange={(e) => setVisitante(e.target.value)}
              autoFocus
              maxLength={20}
            />
          </div>
          <div className="form-group">
            <label className="label">Equipo Local *</label>
            <input
              className="input"
              placeholder="Ej: ARG"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
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
                onClick={(e) => {
                  try {
                    if ('showPicker' in e.currentTarget) {
                      (e.currentTarget as any).showPicker();
                    }
                  } catch (err) {}
                }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Vista de zona de strike</label>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
              ¿Desde qué perspectiva vas a marcar los lanzamientos?
            </p>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {(['catcher', 'pitcher'] as const).map(p => (
                <button
                  key={p}
                  className={`btn ${perspectiva === p ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, borderRadius: 0, border: 'none', borderRight: p === 'catcher' ? '1px solid var(--border)' : 'none', padding: '10px 0', textTransform: 'capitalize' }}
                  onClick={() => setPerspectiva(p)}
                >
                  {p === 'catcher' ? 'Catcher' : 'Pitcher'}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-full" onClick={iniciar}>
            Comenzar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Agregar / Editar Bateador ─────────────────────────────────────────
import ModalBateador, { FormBateador, FORM_VACIO } from '@/components/ModalBateador';

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
  const { dispatch, estado } = useScout();
  const [form, setForm] = useState<FormBateador>(FORM_VACIO);
  const set = (k: keyof FormBateador) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const confirmar = () => {
    if (!form.apellido.trim() || !form.numero.trim()) return;
    dispatch({
      type: 'SUSTITUIR_BATEADOR',
      payload: {
        salienteId: saliente.id,
        rol: saliente.rol as 'visitante' | 'local',
        entrante: {
          numero: form.numero.trim(),
          apellido: form.apellido.trim().toUpperCase(),
          nombre: form.nombre.trim().toUpperCase(),
          equipo: saliente.equipo,
          ladoBateo: form.ladoBateo,
          activo: true,
          esAbridor: false,
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
          <div className="form-group" style={{ width: '40%' }}>
            <label className="label"># Camiseta *</label>
            <input className="input" placeholder="99" value={form.numero} onChange={set('numero')} maxLength={3} inputMode="numeric" />
          </div>
          <div className="form-group">
            <label className="label">Apellido *</label>
            <input className="input" placeholder="APELLIDO" value={form.apellido} onChange={set('apellido')} maxLength={40} autoCapitalize="characters" />
          </div>
          <div className="form-group">
            <label className="label">Nombre</label>
            <input className="input" placeholder="NOMBRE" value={form.nombre} onChange={set('nombre')} maxLength={40} autoCapitalize="characters" />
          </div>
          <div className="form-group">
            <label className="label">Lado de bateo</label>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {(['D', 'Z', 'S'] as const).map(l => (
                <button
                  key={l}
                  className={`btn ${form.ladoBateo === l ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, borderRadius: 0, border: 'none', borderRight: l !== 'S' ? '1px solid var(--border)' : 'none', padding: '10px 0' }}
                  onClick={() => setForm({ ...form, ladoBateo: l })}
                >
                  {l}
                </button>
              ))}
            </div>
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

// ─── Modal: Carga Masiva ────────────────────────────────────────────────────────
function ModalCargaMasiva({
  equipo,
  onGuardar,
  onClose,
}: {
  equipo: string;
  onGuardar: (bateadores: Array<Omit<Bateador, 'id'>>) => void;
  onClose: () => void;
}) {
  const [filas, setFilas] = useState<FormBateador[]>(
    Array(9).fill(null).map(() => ({ ...FORM_VACIO }))
  );

  const setRow = (index: number, key: keyof FormBateador, val: string) => {
    const n = [...filas];
    n[index] = { ...n[index], [key]: val };
    setFilas(n);
  };

  const agregarFila = () => {
    setFilas([...filas, { ...FORM_VACIO }]);
  };

  const guardar = () => {
    // Filtrar filas válidas (mínimo apellido)
    const validas = filas.filter(f => f.apellido.trim());
    if (validas.length === 0) return;

    const bateadores = validas.map((f, i) => ({
      numero: f.numero.trim(),
      apellido: f.apellido.trim().toUpperCase(),
      nombre: f.nombre.trim().toUpperCase(),
      equipo,
      ladoBateo: f.ladoBateo,
      orden: i + 1,
      activo: true,
      esAbridor: true,
    }));
    
    onGuardar(bateadores);
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">Line-up: {equipo.toUpperCase()}</h2>
        <p className="sheet-subtitle">Ingresa en orden a los bateadores</p>
        
        <div style={{ flex: 1, overflowY: 'auto', margin: '12px -24px', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Cabecera miniatura */}
          <div style={{ display: 'flex', gap: 8, padding: '0 4px', paddingLeft: 22 }}>
            <span className="text-xs text-secondary" style={{ width: 40, textAlign: 'center' }}>#</span>
            <span className="text-xs text-secondary" style={{ flex: 1, paddingLeft: 8 }}>APELLIDO</span>
            <span className="text-xs text-secondary" style={{ flex: 1, paddingLeft: 8 }}>NOMBRE</span>
            <span className="text-xs text-secondary" style={{ width: 68, textAlign: 'center' }}>LADO</span>
          </div>
          
          {filas.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="text-xs text-secondary" style={{ width: 14 }}>{i+1}.</span>
              <input 
                className="input" style={{ width: 40, padding: '8px 4px', textAlign: 'center', fontSize: '0.9rem' }} 
                placeholder="7" value={f.numero} onChange={(e) => setRow(i, 'numero', e.target.value)} maxLength={3} inputMode="numeric" 
              />
              <input 
                className="input" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }} 
                placeholder="Apellido" value={f.apellido} onChange={(e) => setRow(i, 'apellido', e.target.value)} autoCapitalize="characters" 
              />
              <input 
                className="input" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }} 
                placeholder="Nombre" value={f.nombre} onChange={(e) => setRow(i, 'nombre', e.target.value)} autoCapitalize="words" 
              />
              {/* Lado selector rápido */}
              <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', width: 68, border: '1px solid var(--border)', flexShrink: 0 }}>
                {(['D', 'Z', 'S'] as const).map(l => (
                  <div
                    key={l}
                    onClick={() => setRow(i, 'ladoBateo', l)}
                    style={{
                      flex: 1, textAlign: 'center', padding: '6px 0', fontSize: '0.75rem', fontWeight: 700,
                      background: f.ladoBateo === l ? 'var(--accent)' : 'transparent',
                      color: f.ladoBateo === l ? '#000' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={agregarFila}>
            + Agregar fila
          </button>
        </div>
        
        <div style={{ paddingTop: 16 }}>
          <button className="btn btn-primary btn-full" onClick={guardar}>Guardar Line-Up Completo</button>
        </div>
      </div>
    </div>
  );
}

// ─── Pantalla principal: LINE-UP ──────────────────────────────────────────────
export default function LineupPage() {
  const { estado, dispatch, bateadorActual, bateadoresActivos } = useScout();
  const router = useRouter();

  const [showNuevoPartido, setShowNuevoPartido] = useState(false);
  const [showAgregarBateador, setShowAgregarBateador] = useState(false);
  const [showCargaMasiva, setShowCargaMasiva] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [editando, setEditando] = useState<Bateador | null>(null);
  const [sustituyendo, setSustituyendo] = useState<Bateador | null>(null);
  const [activeTab, setActiveTab] = useState<'visitante' | 'local'>('visitante');

  const equipoActual = activeTab === 'visitante' ? estado.partido?.visitante : estado.partido?.local;
  const lineupActual = (activeTab === 'visitante' ? estado.lineupVisitante : estado.lineupLocal) || [];

  const agregarBateador = (d: FormBateador) => {
    const ordenMaximo = Math.max(0, ...lineupActual.map(b => b.orden));
    const orden = ordenMaximo + 1;
    dispatch({
      type: 'AGREGAR_BATEADOR',
      payload: { ...d, equipo: equipoActual || '', rol: activeTab, orden, activo: true, esAbridor: true },
    });
  };

  const agregarBateadoresMasivo = (bateadores: Array<Omit<Bateador, 'id'>>) => {
    const conRol = bateadores.map(b => ({ ...b, rol: activeTab }));
    dispatch({
      type: 'AGREGAR_BATEADORES_MASIVO',
      payload: conRol,
    });
  };

  const editarBateador = (b: Bateador, d: FormBateador) => {
    dispatch({ type: 'EDITAR_BATEADOR', payload: { id: b.id, rol: activeTab, datos: { ...d, equipo: b.equipo, ladoBateo: d.ladoBateo } } });
  };

  const seleccionarAlBate = (idx: number) => {
    dispatch({ type: 'SET_BATEADOR_ACTUAL', payload: { rol: activeTab, indice: idx } });
  };

  const filas: Array<{ bateador: Bateador; idxActivo?: number; esActual: boolean }> = [];
  const activos = lineupActual.filter((b) => b.activo);
  const ordenMaximo = Math.max(0, ...lineupActual.map(b => b.orden));

  for (const b of lineupActual) {
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
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.03em' }}>
              Mi<span style={{ color: 'var(--accent)' }}>Scout</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>
              Tracking de pitcheos y zona de strike.
            </p>
          </div>
          
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button className="btn btn-primary btn-lg btn-full" style={{ boxShadow: 'var(--glow-accent)', padding: '18px 24px', fontSize: '1.05rem' }} onClick={() => setShowNuevoPartido(true)}>
              Comenzar
            </button>

          </div>
        </div>
      )}

      {/* ── Con partido ── */}
      {estado.partido && (
        <>
          {/* Info adicional del evento */}
          {estado.partido.descripcion && (
            <div style={{ padding: '12px 16px 4px' }}>
              <p className="text-sm text-secondary" style={{ fontWeight: 600 }}>{estado.partido.descripcion}</p>
            </div>
          )}

          {/* Tabs Visitante / Local */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginTop: 8 }}>
            <button
              className={`btn ${activeTab === 'visitante' ? '' : 'btn-ghost'}`}
              style={{ flex: 1, borderRadius: 0, borderBottom: activeTab === 'visitante' ? '2px solid var(--accent)' : '2px solid transparent' }}
              onClick={() => setActiveTab('visitante')}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Visitante</div>
              <div style={{ fontWeight: 800 }}>{estado.partido.visitante}</div>
            </button>
            <button
              className={`btn ${activeTab === 'local' ? '' : 'btn-ghost'}`}
              style={{ flex: 1, borderRadius: 0, borderBottom: activeTab === 'local' ? '2px solid var(--accent)' : '2px solid transparent' }}
              onClick={() => setActiveTab('local')}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Local</div>
              <div style={{ fontWeight: 800 }}>{estado.partido.local}</div>
            </button>
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
            <span style={{ width: 32 }}></span>
          </div>

          {/* Filas del lineup */}
          {filas.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <p className="text-secondary text-sm">El line-up está vacío</p>
            </div>
          )}

          {filas.map(({ bateador: b, idxActivo, esActual }) => {
            const sustituido = lineupActual.find((x) => x.id === b.reemplazadoPorId);
            return (
              <div key={b.id}>
                <div
                  className={`lineup-row${esActual ? ' current' : ''}${!b.activo ? ' inactivo' : ''}`}
                  onClick={() => {
                    if (!b.activo || idxActivo === undefined) return;
                    seleccionarAlBate(idxActivo);
                  }}
                  onDoubleClick={() => {
                    if (!b.activo || idxActivo === undefined) return;
                    seleccionarAlBate(idxActivo);
                    router.push('/tracking');
                  }}
                  style={{ cursor: b.activo ? 'pointer' : 'default' }}
                >
                  <span className="lineup-orden">{b.orden}.</span>
                  <div className="lineup-numero">{b.numero}</div>
                  <div className="lineup-nombre">
                    {b.apellido}{b.nombre ? `, ${b.nombre}` : ''}
                    <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, fontSize: '0.65rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-secondary)' }}>
                      {b.ladoBateo || 'D'}
                    </span>
                  </div>
                  <span className="lineup-equipo">{b.equipo}</span>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: 6, border: 'none', marginLeft: 4, color: 'var(--text-secondary)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditando(b);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
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
            {ordenMaximo === 0 && (
              <button className="btn btn-primary btn-full" onClick={() => setShowCargaMasiva(true)}>
                Carga rápida (Line-Up Completo)
              </button>
            )}
            {ordenMaximo < 15 && (
              <button className={`btn ${ordenMaximo === 0 ? 'btn-ghost' : 'btn-primary'} btn-full`} onClick={() => setShowAgregarBateador(true)}>
                Agregar 1 jugador
              </button>
            )}
            {bateadorActual && (
              <button className="btn btn-ghost btn-full" style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }} onClick={() => setSustituyendo(bateadorActual)}>
                Sustitución del bateador actual
              </button>
            )}
            <button className="btn btn-danger btn-full" onClick={() => setShowConfirmReset(true)}>
              Nuevo partido
            </button>
          </div>
        </>
      )}

      {/* ── Modales ── */}
      {showNuevoPartido && <ModalNuevoPartido onClose={() => setShowNuevoPartido(false)} />}
      {showAgregarBateador && (
        <ModalBateador
          titulo="Agregar bateador"
          subtitulo={`Orden al bate: ${ordenMaximo + 1}`}
          onGuardar={agregarBateador}
          onClose={() => setShowAgregarBateador(false)}
        />
      )}
      {showCargaMasiva && estado.partido && (
        <ModalCargaMasiva
          equipo={equipoActual || ''}
          onGuardar={agregarBateadoresMasivo}
          onClose={() => setShowCargaMasiva(false)}
        />
      )}
      {editando && (
        <ModalBateador
          titulo="Editar bateador"
          subtitulo={`Orden al bate: ${editando.orden}`}
          inicial={{ numero: editando.numero, apellido: editando.apellido, nombre: editando.nombre, equipo: editando.equipo, ladoBateo: editando.ladoBateo || 'D' }}
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
      {showConfirmReset && (
        <ModalConfirm
          mensaje="¿Iniciar un partido nuevo? Se perderán los datos actuales."
          onConfirmar={() => {
            dispatch({ type: 'NUEVO_PARTIDO' });
            setShowConfirmReset(false);
          }}
          onCancelar={() => setShowConfirmReset(false)}
        />
      )}
    </div>
  );
}
