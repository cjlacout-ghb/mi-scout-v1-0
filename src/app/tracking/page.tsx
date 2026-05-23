'use client';

import { useState } from 'react';
import { useScout } from '@/context/ScoutContext';
import ZonaStrikeComponent from '@/components/ZonaStrike';
import ModalPitch from '@/components/ModalPitch';
import ModalConfirm from '@/components/ModalConfirm';
import type { ZonaStrike, TurnoAlBate, Coordenadas } from '@/lib/types';

export default function TrackingPage() {
  const { estado, dispatch, bateadorActual, bateadoresActivos, equipoAlBate } = useScout();
  const [zonaSeleccionada, setZonaSeleccionada] = useState<ZonaStrike | null>(null);
  const [coordenadasSeleccionadas, setCoordenadasSeleccionadas] = useState<Coordenadas | null>(null);
  const [turnoEditando, setTurnoEditando] = useState<TurnoAlBate | null>(null);
  const [turnoAEliminar, setTurnoAEliminar] = useState<string | null>(null);
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState(false);

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
        <p className="empty-state__text">Cargá los bateadores en la pantalla Line-Up.</p>
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
      t.resultado === 'BB/HP' ? 'ball'    : 'strike'
    ) as 'strike' | 'ball' | 'contact';
    return [{ zona: t.zona, tipo, coordenadas: t.coordenadas, resultado: t.resultado, tipoPitch: t.tipoPitch }];
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
    setEsperandoConfirmacion(false);
    setTurnoEditando(null);
    dispatch({ type: 'CAMBIAR_MITAD_INNING' });
  };

  const retrocederMitad = () => {
    setEsperandoConfirmacion(false);
    setTurnoEditando(null);
    dispatch({ type: 'RETROCEDER_MITAD_INNING' });
  };

  // Contar stats rápidas del bateador actual
  const ab = turnosBateador.length;
  const hits = turnosBateador.filter((t) => t.resultado === 'HIT').length;
  const ks  = turnosBateador.filter((t) => t.resultado === 'KS' || t.resultado === 'KL').length;
  const bb  = turnosBateador.filter((t) => t.resultado === 'BB/HP').length;

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
              <span className="badge badge-accent">{bateadorActual?.equipo}</span>
            </div>
          </div>

          {/* Inning control */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <button onClick={retrocederMitad} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.5rem', lineHeight: 1 }}>−</button>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inn</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
              {estado.mitadInning === 'alta' ? <span style={{ color: 'var(--text-primary)' }}>▲</span> : <span style={{ color: 'var(--text-primary)' }}>▼</span>}
              <span style={{ color: 'var(--accent)' }}>{estado.inningActual}</span>
            </div>
            <button onClick={avanzarMitad} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.5rem', lineHeight: 1 }}>+</button>
          </div>
        </div>

        {/* Stats rápidas */}
        {ab > 0 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AB</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{ab}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>H</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)' }}>{hits}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--danger)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>K</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--danger)' }}>{ks}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--info)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BB</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--info)' }}>{bb}</div>
            </div>
            {ultimoTurno && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Último</div>
                <div style={{
                  fontSize: '0.95rem', fontWeight: 800,
                  color: ultimoTurno.resultado === 'HIT' ? 'var(--success)' : ultimoTurno.resultado === 'OUT' || ultimoTurno.resultado.startsWith('K') ? 'var(--danger)' : 'var(--info)',
                }}>
                  {ultimoTurno.resultado}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Zona de strike ── */}
      <div style={{ padding: '8px 0 4px' }}>
        <p style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          {esperandoConfirmacion ? 'Confirmar resultado' : turnoEditando ? 'Reubicá el lanzamiento' : 'MARCA EL LANZAMIENTO EN LA ZONA'}
        </p>
        <ZonaStrikeComponent onZonaClick={handleZonaClick} marcadores={marcadores} />
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
              }}
              style={{ width: 120 }}
            >
              Confirmar
            </button>
          </div>
        )}
      </div>

      {/* ── Mini lineup horizontal ── */}
      <div style={{ padding: '8px 16px' }}>
        <p className="text-xs text-secondary" style={{ marginBottom: 6 }}>Orden al bate</p>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
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
                borderLeft: `3px solid ${t.resultado === 'HIT' ? 'var(--success)' : t.resultado === 'OUT' || t.resultado.startsWith('K') ? 'var(--danger)' : 'var(--info)'}`,
              }}
            >
              <span className="text-xs text-secondary">Inn {t.inning}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flex: 1 }}>
                Zona {t.zona} · {t.tipoPitch}
              </span>
              <span style={{
                fontWeight: 800,
                fontSize: '0.88rem',
                color: t.resultado === 'HIT' ? 'var(--success)' : t.resultado === 'OUT' || t.resultado.startsWith('K') ? 'var(--danger)' : 'var(--info)',
                marginRight: 4
              }}>
                {t.resultado}
                {t.detalleHit && ` (${t.detalleHit.tipo}) ${t.detalleHit.ubicacion}`}
                {t.detalleOut && ` (${t.detalleOut.tipo}) ${t.detalleOut.defensor}`}
              </span>
              <div style={{ display: 'flex', gap: 8, opacity: 0.7 }}>
                <button
                  onClick={() => {
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
    </div>
  );
}
