'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { EstadoPartido, Bateador, TurnoAlBate, Partido } from '@/lib/types';
import { cargarEstado, guardarEstado, estadoInicial, generarId } from '@/lib/storage';

// ─── Acciones ─────────────────────────────────────────────────────────────────
type Accion =
  | { type: 'INICIAR_PARTIDO'; payload: { partido: Partido; lineupVisitante: Bateador[]; lineupLocal: Bateador[]; perspectivaZona?: 'catcher' | 'pitcher' } }
  | { type: 'NUEVO_PARTIDO' }
  | { type: 'AGREGAR_BATEADOR'; payload: Omit<Bateador, 'id'> }
  | { type: 'AGREGAR_BATEADORES_MASIVO'; payload: Array<Omit<Bateador, 'id'>> }
  | { type: 'EDITAR_BATEADOR'; payload: { id: string; rol: 'visitante' | 'local'; datos: Partial<Omit<Bateador, 'id'>> } }
  | { type: 'REORDENAR_BATEADORES'; payload: { rol: 'visitante' | 'local'; bateadores: Bateador[] } }
  | { type: 'SUSTITUIR_BATEADOR'; payload: { salienteId: string; rol: 'visitante' | 'local'; entrante: Omit<Bateador, 'id' | 'orden'>; inning: number } }
  | { type: 'REGISTRAR_TURNO'; payload: Omit<TurnoAlBate, 'id' | 'timestamp'> }
  | { type: 'AVANZAR_BATEADOR' }
  | { type: 'CAMBIAR_MITAD_INNING' }
  | { type: 'RETROCEDER_MITAD_INNING' }

  | { type: 'SET_BATEADOR_ACTUAL'; payload: { rol: 'visitante' | 'local'; indice: number } }
  | { type: 'SET_INNING'; payload: number }
  | { type: 'EDITAR_TURNO_AL_BATE'; payload: { id: string; datos: Partial<Omit<TurnoAlBate, 'id' | 'timestamp'>> } }
  | { type: 'ELIMINAR_TURNO_AL_BATE'; payload: string }
  | { type: 'SET_PERSPECTIVA'; payload: 'catcher' | 'pitcher' }
  | { type: 'CARGAR_ESTADO'; payload: EstadoPartido };

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(estado: EstadoPartido, accion: Accion): EstadoPartido {
  switch (accion.type) {
    case 'CARGAR_ESTADO':
      return accion.payload;

    case 'NUEVO_PARTIDO':
      return estadoInicial;

    case 'INICIAR_PARTIDO':
      return {
        ...estadoInicial,
        partido: accion.payload.partido,
        lineupVisitante: accion.payload.lineupVisitante,
        lineupLocal: accion.payload.lineupLocal,
        perspectivaZona: accion.payload.perspectivaZona || 'catcher',
      };

    case 'SET_PERSPECTIVA':
      return { ...estado, perspectivaZona: accion.payload };

    case 'AGREGAR_BATEADOR': {
      const nuevo: Bateador = { ...accion.payload, id: generarId() };
      if (nuevo.rol === 'visitante') {
        return { ...estado, lineupVisitante: [...estado.lineupVisitante, nuevo] };
      }
      return { ...estado, lineupLocal: [...estado.lineupLocal, nuevo] };
    }

    case 'AGREGAR_BATEADORES_MASIVO': {
      if (accion.payload.length === 0) return estado;
      const rol = accion.payload[0].rol;
      const nuevos: Bateador[] = accion.payload.map(b => ({ ...b, id: generarId() }));
      if (rol === 'visitante') {
        return { ...estado, lineupVisitante: [...estado.lineupVisitante, ...nuevos] };
      }
      return { ...estado, lineupLocal: [...estado.lineupLocal, ...nuevos] };
    }

    case 'EDITAR_BATEADOR': {
      const isVisitante = accion.payload.rol === 'visitante';
      const lineup = isVisitante ? estado.lineupVisitante : estado.lineupLocal;
      const newLineup = lineup.map((b) =>
        b.id === accion.payload.id ? { ...b, ...accion.payload.datos } : b
      );
      if (isVisitante) return { ...estado, lineupVisitante: newLineup };
      return { ...estado, lineupLocal: newLineup };
    }

    case 'REORDENAR_BATEADORES': {
      if (accion.payload.rol === 'visitante') {
        return { ...estado, lineupVisitante: accion.payload.bateadores };
      }
      return { ...estado, lineupLocal: accion.payload.bateadores };
    }

    case 'SUSTITUIR_BATEADOR': {
      const { salienteId, rol, entrante, inning } = accion.payload;
      const isVisitante = rol === 'visitante';
      const lineup = isVisitante ? estado.lineupVisitante : estado.lineupLocal;
      
      const saliente = lineup.find((b) => b.id === salienteId);
      if (!saliente) return estado;

      const nuevoId = generarId();
      const newLineup = lineup.map((b) => {
        if (b.id === salienteId) {
          return { ...b, activo: false, reemplazadoPorId: nuevoId, reemplazadoAInning: inning };
        }
        return b;
      });

      const nuevoBateador: Bateador = {
        ...entrante,
        rol,
        id: nuevoId,
        orden: saliente.orden,
        activo: true,
      };

      const idx = newLineup.findIndex((b) => b.id === salienteId);
      newLineup.splice(idx + 1, 0, nuevoBateador);

      if (isVisitante) return { ...estado, lineupVisitante: newLineup };
      return { ...estado, lineupLocal: newLineup };
    }

    case 'REGISTRAR_TURNO': {
      const turno: TurnoAlBate = {
        ...accion.payload,
        id: generarId(),
        timestamp: new Date().toISOString(),
      };
      return { ...estado, turnosAlBate: [...estado.turnosAlBate, turno] };
    }

    case 'EDITAR_TURNO_AL_BATE': {
      const turnosAlBate = estado.turnosAlBate.map((t) =>
        t.id === accion.payload.id ? { ...t, ...accion.payload.datos } : t
      );
      return { ...estado, turnosAlBate };
    }

    case 'ELIMINAR_TURNO_AL_BATE': {
      const turnosAlBate = estado.turnosAlBate.filter((t) => t.id !== accion.payload);
      return { ...estado, turnosAlBate };
    }

    case 'AVANZAR_BATEADOR': {
      const isVisitante = estado.mitadInning === 'alta';
      const lineup = isVisitante ? estado.lineupVisitante : estado.lineupLocal;
      const activos = lineup.filter((b) => b.activo);
      if (activos.length === 0) return estado;
      
      const indiceActual = isVisitante ? estado.indiceVisitante : estado.indiceLocal;
      let siguiente = indiceActual + 1;
      if (activos.length >= 9) {
        siguiente = siguiente % activos.length;
      }
      
      if (isVisitante) {
        const vueltas = siguiente < indiceActual ? estado.vueltasAlOrdenVisitante + 1 : estado.vueltasAlOrdenVisitante;
        return { ...estado, indiceVisitante: siguiente, vueltasAlOrdenVisitante: vueltas };
      } else {
        const vueltas = siguiente < indiceActual ? estado.vueltasAlOrdenLocal + 1 : estado.vueltasAlOrdenLocal;
        return { ...estado, indiceLocal: siguiente, vueltasAlOrdenLocal: vueltas };
      }
    }

    case 'CAMBIAR_MITAD_INNING': {
      if (estado.mitadInning === 'alta') {
        return { ...estado, mitadInning: 'baja' };
      } else {
        return { ...estado, mitadInning: 'alta', inningActual: estado.inningActual + 1 };
      }
    }

    case 'RETROCEDER_MITAD_INNING': {
      if (estado.mitadInning === 'baja') {
        return { ...estado, mitadInning: 'alta' };
      } else {
        const nuevoInning = Math.max(1, estado.inningActual - 1);
        if (nuevoInning === estado.inningActual) return estado;
        return { ...estado, mitadInning: 'baja', inningActual: nuevoInning };
      }
    }



    case 'SET_BATEADOR_ACTUAL': {
      if (accion.payload.rol === 'visitante') {
        return { ...estado, indiceVisitante: accion.payload.indice };
      }
      return { ...estado, indiceLocal: accion.payload.indice };
    }

    case 'SET_INNING':
      return { ...estado, inningActual: accion.payload };

    default:
      return estado;
  }
}

// ─── Contexto ─────────────────────────────────────────────────────────────────
interface ContextType {
  estado: EstadoPartido;
  dispatch: React.Dispatch<Accion>;
  bateadorActual: Bateador | null;
  bateadoresActivos: Bateador[];
  equipoAlBate: 'visitante' | 'local';
}

const ScoutContext = createContext<ContextType | null>(null);

export function ScoutProvider({ children }: { children: React.ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);
  const [mounted, setMounted] = React.useState(false);

  // Cargar desde localStorage al montar
  useEffect(() => {
    const guardado = cargarEstado();
    if (guardado && guardado.partido) {
      dispatch({ type: 'CARGAR_ESTADO', payload: guardado });
    }
    setMounted(true);
  }, []);

  // Guardar en localStorage en cada cambio de estado
  useEffect(() => {
    if (estado.partido) {
      guardarEstado(estado);
    }
  }, [estado]);

  const equipoAlBate = estado.mitadInning === 'alta' ? 'visitante' : 'local';
  const lineupActual = (equipoAlBate === 'visitante' ? estado.lineupVisitante : estado.lineupLocal) || [];
  const bateadoresActivos = lineupActual.filter((b) => b.activo);
  const indiceActivo = equipoAlBate === 'visitante' ? (estado.indiceVisitante || 0) : (estado.indiceLocal || 0);
  const bateadorActual = bateadoresActivos[indiceActivo] ?? null;

  return (
    <ScoutContext.Provider value={{ estado, dispatch, bateadorActual, bateadoresActivos, equipoAlBate }}>
      {children}
    </ScoutContext.Provider>
  );
}

export function useScout() {
  const ctx = useContext(ScoutContext);
  if (!ctx) throw new Error('useScout debe usarse dentro de ScoutProvider');
  return ctx;
}
