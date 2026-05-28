'use client';

import { useState, useEffect, useRef } from 'react';
import { useScout } from '@/context/ScoutContext';
import ZonaStrikeComponent from '@/components/ZonaStrike';
import ModalPitch from '@/components/ModalPitch';
import ModalConfirm from '@/components/ModalConfirm';
import ModalBateador, { type FormBateador } from '@/components/ModalBateador';
import type { ZonaStrike, TurnoAlBate, Coordenadas } from '@/lib/types';

export default function TrackingPage() {
  const { estado, dispatch, bateadorActual, bateadoresActivos, equipoAlBate } = useScout();
  const [zonaSeleccionada, setZonaSeleccionada] = useState<ZonaStrike | null>(null);
  const [coordenadasSeleccionadas, setCoordenadasSeleccionadas] = useState<Coordenadas | null>(null);
  const [turnoEditando, setTurnoEditando] = useState<TurnoAlBate | null>(null);
  const [turnoAEliminar, setTurnoAEliminar] = useState<string | null>(null);
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState(false);
  const [avisoInning, setAvisoInning] = useState(false);
  const [showAgregarBateador, setShowAgregarBateador] = useState(false);
  const [showFinPartido, setShowFinPartido] = useState(false);


  const prevEquipoRef = useRef(equipoAlBate);
  const prevInningRef = useRef(estado.inningActual);

  useEffect(() => {
    if (prevEquipoRef.current !== equipoAlBate || prevInningRef.current !== estado.inningActual) {
      setAvisoInning(true);
    }
    prevEquipoRef.current = equipoAlBate;
    prevInningRef.current = estado.inningActual;
  }, [equipoAlBate, estado.inningActual]);

  const promptRef = useRef<{ rol: string, index: number } | null>(null);

  useEffect(() => {
    // Si estamos en medio de un partido, y faltan bateadores por cargar
    if (estado.partido && bateadoresActivos.length > 0 && bateadoresActivos.length < 9) {
      const idx = equipoAlBate === 'visitante' ? estado.indiceVisitante : estado.indiceLocal;
      if (idx >= bateadoresActivos.length && !showAgregarBateador) {
        // Evitar múltiples aperturas del mismo modal en el mismo índice
        if (promptRef.current?.rol !== equipoAlBate || promptRef.current?.index !== idx) {
          promptRef.current = { rol: equipoAlBate, index: idx };
          setShowAgregarBateador(true);
        }
      }
    }
  }, [estado.partido, equipoAlBate, bateadoresActivos.length, estado.indiceVisitante, estado.indiceLocal, showAgregarBateador]);

  // ─── Sin partido activo ────────────────────────────────────────────────────
  if (!estado.partido) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🎯</div>
        <div className="empty-state__title">Sin partido activo</div>
        <p className="empty-state__text">Iniciá un partido desde el Line-Up para comenzar el tracking.</p>
      </div>
    );
  }

  if (bateadoresActivos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">👥</div>
        <div className="empty-state__title">Line-up vacío</div>
        <p className="empty-state__text">Cargá el primer bateador para comenzar.</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAgregarBateador(true)}>
          Agregar Bateador
        </button>
        {showAgregarBateador && estado.partido && (
          <ModalBateador
            titulo="Primer bateador"
            subtitulo="Orden al bate: 1"
            onGuardar={(d: import('@/components/ModalBateador').FormBateador) => {
              dispatch({
                type: 'AGREGAR_BATEADOR',
                payload: {
                  ...d,
                  equipo: equipoAlBate === 'visitante' ? estado.partido!.visitante : estado.partido!.local,
                  rol: equipoAlBate,
                  orden: 1,
                  activo: true,
                  esAbridor: true,
                },
              });
              dispatch({
                type: 'SET_BATEADOR_ACTUAL',
                payload: { rol: equipoAlBate, indice: 0 },
              });
              setShowAgregarBateador(false);
            }}
            onClose={() => setShowAgregarBateador(false)}
          />
        )}
      </div>
    );
  }

  // ─── Turnos del bateador actual en este partido ────────────────────────────
  const turnosBateador: TurnoAlBate[] = bateadorActual
    ? estado.turnosAlBate.filter((t) => t.bateadorId === bateadorActual.id)
    : [];

  // Marcadores para mostrar en la zona (todos los turnos del bateador en el partido)
  const marcadores = turnosBateador.flatMap((t) => {
    const tipo = (
      t.resultado === 'HIT'   ? 'contact' :
      t.resultado === 'OUT'   ? 'contact' :
      (t.resultado === 'BB' || t.resultado === 'HBP') ? 'ball'    : 'strike'
    ) as 'strike' | 'ball' | 'contact';
    const calidad = t.detalleOut?.calidad || t.detalleHit?.calidad;
    return [{ zona: t.zona, tipo, coordenadas: t.coordenadas, resultado: t.resultado, tipoPitch: t.tipoPitch, calidad }];
  });

  const handleZonaClick = (zona: ZonaStrike, coordenadas?: Coordenadas) => {
    if (esperandoConfirmacion) return;
    setZonaSeleccionada(zona);
    setCoordenadasSeleccionadas(coordenadas || null);
  };

  const handleConfirmarPitch = (datos: {
    zona: ZonaStrike;
    tipoPitch: import('@/lib/types').TipoPitch;
    resultado: import('@/lib/types').ResultadoAtBat;
    detalleOut?: import('@/lib/types').DetalleOut;
    detalleHit?: import('@/lib/types').DetalleHit;
  }) => {
    if (!bateadorActual) return;

    if (turnoEditando) {
      dispatch({
        type: 'EDITAR_TURNO_AL_BATE',
        payload: {
          id: turnoEditando.id,
          datos: {
            zona: datos.zona,
            coordenadas: coordenadasSeleccionadas || turnoEditando.coordenadas,
            tipoPitch: datos.tipoPitch,
            resultado: datos.resultado,
            detalleOut: datos.detalleOut,
            detalleHit: datos.detalleHit,
          },
        },
      });
      setTurnoEditando(null);
      setEsperandoConfirmacion(true);
    } else {
      dispatch({
        type: 'REGISTRAR_TURNO',
        payload: {
          bateadorId: bateadorActual.id,
          inning: estado.inningActual,
          zona: datos.zona,
          coordenadas: coordenadasSeleccionadas || undefined,
          tipoPitch: datos.tipoPitch,
          resultado: datos.resultado,
          detalleOut: datos.detalleOut,
          detalleHit: datos.detalleHit,
        },
      });
      setEsperandoConfirmacion(true);
    }

    setZonaSeleccionada(null);
    setCoordenadasSeleccionadas(null);
  };

  const avanzarMitad = () => {
    if (esperandoConfirmacion && !turnoEditando) {
      dispatch({ type: 'AVANZAR_BATEADOR' });
    }
    setEsperandoConfirmacion(false);
    setTurnoEditando(null);
    dispatch({ type: 'CAMBIAR_MITAD_INNING' });
  };

  const retrocederMitad = () => {
    if (esperandoConfirmacion && !turnoEditando) {
      dispatch({ type: 'AVANZAR_BATEADOR' });
    }
    setEsperandoConfirmacion(false);
    setTurnoEditando(null);
    dispatch({ type: 'RETROCEDER_MITAD_INNING' });
  };

  // Contar stats rápidas del bateador actual
  const ab = turnosBateador.length;
  const hits = turnosBateador.filter((t) => t.resultado === 'HIT').length;
  const ks  = turnosBateador.filter((t) => t.resultado === 'KS' || t.resultado === 'KL').length;
  const bb  = turnosBateador.filter((t) => t.resultado === 'BB' || t.resultado === 'HBP').length;
  const outs = turnosBateador.filter((t) => t.resultado === 'OUT').length;

  const ultimoTurno = turnosBateador[turnosBateador.length - 1];

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* ── Bateador actual ── */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48,
            background: 'var(--bg-elevated)',
            border: '2px solid var(--accent)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 900,
            color: 'var(--accent)',
            flexShrink: 0,
          }}>
            {bateadorActual?.numero ?? '-'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bateadorActual?.apellido ?? '—'}{bateadorActual?.nombre ? `, ${bateadorActual.nombre}` : ''}
              <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, fontSize: '0.65rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-secondary)', verticalAlign: 'middle', position: 'relative', top: '-1px' }}>
                {bateadorActual?.ladoBateo || 'D'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{bateadorActual?.equipo}</span>
            </div>
          </div>

          {/* Inning control */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <button onClick={avanzarMitad} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.5rem', lineHeight: 1 }}>+</button>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {estado.mitadInning === 'alta' ? <span style={{ color: 'var(--text-primary)', lineHeight: 1 }}>▲</span> : <span style={{ opacity: 0, lineHeight: 1 }}>▲</span>}
              <span style={{ color: 'var(--accent)', lineHeight: 1 }}>{estado.inningActual}</span>
              {estado.mitadInning === 'baja' ? <span style={{ color: 'var(--text-primary)', lineHeight: 1 }}>▼</span> : <span style={{ opacity: 0, lineHeight: 1 }}>▼</span>}
            </div>
            <button onClick={retrocederMitad} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.5rem', lineHeight: 1 }}>−</button>
          </div>
        </div>

        {/* Stats rápidas */}
        {ab > 0 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AB</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{ab}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--danger)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>H</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--danger)' }}>{hits}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>O</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>{outs}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>K</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)' }}>{ks}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--info)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BB/HBP</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--info)' }}>{bb}</div>
            </div>
            {ultimoTurno && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Último</div>
                <div style={{
                  fontSize: '0.95rem', fontWeight: 800,
                  color: ultimoTurno.resultado === 'HIT' ? 'var(--danger)' : ultimoTurno.resultado === 'OUT' || ultimoTurno.resultado.startsWith('K') ? 'var(--success)' : 'var(--info)',
                }}>
                  {ultimoTurno.resultado}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Zona de strike ── */}
      <div style={{ padding: '8px 0 4px', position: 'relative' }}>
        {avisoInning && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 16,
            right: 16,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--accent)',
            borderRadius: 8,
            padding: '10px 12px',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Confirmá que se juega la {estado.mitadInning === 'alta' ? 'Alta' : 'Baja'} del {estado.inningActual}
              </span>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.75rem', flexShrink: 0 }}
              onClick={() => setAvisoInning(false)}
            >
              OK
            </button>
          </div>
        )}

        <p style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          fontWeight: 900,
          letterSpacing: '0.08em',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          {esperandoConfirmacion ? 'Confirmar resultado' : turnoEditando ? 'Reubicá el lanzamiento' : 'MARCA EL LANZAMIENTO EN LA ZONA'}
        </p>
        <ZonaStrikeComponent 
          onZonaClick={handleZonaClick} 
          marcadores={marcadores} 
          ladoBateo={bateadorActual?.ladoBateo} 
          perspectiva={estado.perspectivaZona} 
        />
        {esperandoConfirmacion && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (!ultimoTurno) return;
                setEsperandoConfirmacion(false);
                setTurnoEditando(ultimoTurno);
              }}
              style={{ width: 120 }}
            >
              Editar
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEsperandoConfirmacion(false);
                dispatch({ type: 'AVANZAR_BATEADOR' });
                const indiceActual = equipoAlBate === 'visitante' ? estado.indiceVisitante : estado.indiceLocal;
                const siguienteIdx = indiceActual + 1;
                if (siguienteIdx >= bateadoresActivos.length && bateadoresActivos.length < 9) {
                  setShowAgregarBateador(true);
                }
              }}
              style={{ width: 120 }}
            >
              Confirmar
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '8px 16px' }}>
        <p className="text-xs text-secondary" style={{ marginBottom: 6 }}>Orden al bate</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, flex: 1 }}>
            {bateadoresActivos.map((b, i) => (
              <button
                key={b.id}
                onClick={() => {
                  setEsperandoConfirmacion(false);
                  setTurnoEditando(null);
                  dispatch({ type: 'SET_BATEADOR_ACTUAL', payload: { rol: equipoAlBate, indice: i } });
                }}
                style={{
                  flexShrink: 0,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: b.id === bateadorActual?.id ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  border: `1px solid ${b.id === bateadorActual?.id ? 'var(--accent)' : 'var(--border)'}`,
                  color: b.id === bateadorActual?.id ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <span style={{ fontSize: '0.6rem' }}>{b.orden}.</span>
                <span>{b.numero}</span>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => {
              avanzarMitad();
            }}
            style={{
              flexShrink: 0,
              padding: '6px 10px',
              minWidth: 40,
              height: 40, // Height of the mini cards is roughly 40px
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            }}
            title="Cambiar equipo al bate"
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⇄</span>
          </button>
        </div>
      </div>

      {/* ── Historial de turnos del bateador actual ── */}
      {turnosBateador.length > 0 && (
        <div style={{ padding: '8px 16px' }}>
          <p className="text-xs text-secondary" style={{ marginBottom: 6 }}>Historial</p>
          {[...turnosBateador].reverse().map((t, i) => (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: 'var(--bg-elevated)',
                borderRadius: 8,
                marginBottom: 6,
                borderLeft: `3px solid ${t.resultado === 'HIT' ? 'var(--danger)' : t.resultado === 'OUT' || t.resultado.startsWith('K') ? 'var(--success)' : 'var(--info)'}`,
              }}
            >
              <span className="text-xs text-secondary">Inn {t.inning}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flex: 1 }}>
                Zona {t.zona} · {t.tipoPitch}
              </span>
              <span style={{
                fontWeight: 800,
                fontSize: '0.88rem',
                color: t.resultado === 'HIT' ? 'var(--danger)' : t.resultado === 'OUT' || t.resultado.startsWith('K') ? 'var(--success)' : 'var(--info)',
                marginRight: 4
              }}>
                {t.resultado}
                {t.detalleHit && ` (${t.detalleHit.tipo}) ${t.detalleHit.ubicacion} ${t.detalleHit.calidad}`}
                {t.detalleOut && ` (${t.detalleOut.tipo}) ${t.detalleOut.defensor} ${t.detalleOut.calidad}`}
              </span>
              <div style={{ display: 'flex', gap: 8, opacity: 0.7 }}>
                <button
                  onClick={() => {
                    setEsperandoConfirmacion(false);
                    setTurnoEditando(t);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}
                  title="Editar"
                >
                  ✎
                </button>
                <button
                  onClick={() => setTurnoAEliminar(t.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--danger)' }}
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Fin Partido ── */}
      <div style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'center' }}>
        <button
          className="btn btn-danger btn-sm"
          style={{ opacity: 0.7, fontSize: '0.72rem' }}
          onClick={() => setShowFinPartido(true)}
        >
          Fin Partido
        </button>
      </div>

      {/* ── Modales ── */}
      {zonaSeleccionada !== null && (
        <ModalPitch
          zona={zonaSeleccionada}
          onConfirmar={handleConfirmarPitch}
          onCancelar={() => {
            setZonaSeleccionada(null);
            setCoordenadasSeleccionadas(null);
            setTurnoEditando(null);
          }}
        />
      )}
      {turnoAEliminar && (
        <ModalConfirm
          mensaje="¿Eliminar este lanzamiento?"
          onConfirmar={() => {
            dispatch({ type: 'ELIMINAR_TURNO_AL_BATE', payload: turnoAEliminar });
            setTurnoAEliminar(null);
          }}
          onCancelar={() => setTurnoAEliminar(null)}
        />
      )}
      {showFinPartido && (
        <ModalConfirm
          mensaje="¿Finalizar el partido? Esta acción no se puede deshacer."
          onConfirmar={() => {
            setShowFinPartido(false);
            dispatch({ type: 'NUEVO_PARTIDO' });
          }}
          onCancelar={() => setShowFinPartido(false)}
        />
      )}
      {showAgregarBateador && estado.partido && (
        <ModalBateador
          titulo="Siguiente bateador"
          subtitulo={`Orden al bate: ${bateadoresActivos.length + 1}`}
          onGuardar={(d: FormBateador) => {
            const lineupActual = equipoAlBate === 'visitante' ? estado.lineupVisitante : estado.lineupLocal;
            const ordenMaximo = Math.max(0, ...lineupActual.map(b => b.orden));
            dispatch({
              type: 'AGREGAR_BATEADOR',
              payload: {
                ...d,
                equipo: equipoAlBate === 'visitante' ? estado.partido!.visitante : estado.partido!.local,
                rol: equipoAlBate,
                orden: ordenMaximo + 1,
                activo: true,
                esAbridor: true,
              },
            });
            dispatch({
              type: 'SET_BATEADOR_ACTUAL',
              payload: {
                rol: equipoAlBate,
                indice: bateadoresActivos.length,
              },
            });
          }}
          onClose={() => setShowAgregarBateador(false)}
        />
      )}
    </div>
  );
}
