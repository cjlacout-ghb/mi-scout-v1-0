'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { EstadoPartido, Bateador, TurnoAlBate, Partido } from '@/lib/types';
import { cargarEstado, guardarEstado, estadoInicial, generarId } from '@/lib/storage';

// ─── Acciones ─────────────────────────────────────────────────────────────────
type Accion =
  | { type: 'INICIAR_PARTIDO'; payload: { partido: Partido; lineup: Bateador[] } }
  | { type: 'NUEVO_PARTIDO' }
  | { type: 'AGREGAR_BATEADOR'; payload: Omit<Bateador, 'id'> }
  | { type: 'EDITAR_BATEADOR'; payload: { id: string; datos: Partial<Omit<Bateador, 'id'>> } }
  | { type: 'REORDENAR_BATEADORES'; payload: Bateador[] }
  | { type: 'SUSTITUIR_BATEADOR'; payload: { salienteId: string; entrante: Omit<Bateador, 'id' | 'orden'>; inning: number } }
  | { type: 'REGISTRAR_TURNO'; payload: Omit<TurnoAlBate, 'id' | 'timestamp'> }
  | { type: 'AVANZAR_BATEADOR' }
  | { type: 'SET_BATEADOR_ACTUAL'; payload: number }
  | { type: 'SET_INNING'; payload: number }
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
        lineup: accion.payload.lineup,
      };

    case 'AGREGAR_BATEADOR': {
      const nuevo: Bateador = { ...accion.payload, id: generarId() };
      return { ...estado, lineup: [...estado.lineup, nuevo] };
    }

    case 'EDITAR_BATEADOR': {
      const lineup = estado.lineup.map((b) =>
        b.id === accion.payload.id ? { ...b, ...accion.payload.datos } : b
      );
      return { ...estado, lineup };
    }

    case 'REORDENAR_BATEADORES':
      return { ...estado, lineup: accion.payload };

    case 'SUSTITUIR_BATEADOR': {
      const { salienteId, entrante, inning } = accion.payload;
      const saliente = estado.lineup.find((b) => b.id === salienteId);
      if (!saliente) return estado;

      const nuevoId = generarId();
      const lineup = estado.lineup.map((b) => {
        if (b.id === salienteId) {
          return { ...b, activo: false, reemplazadoPorId: nuevoId, reemplazadoAInning: inning };
        }
        return b;
      });

      const nuevoBateador: Bateador = {
        ...entrante,
        id: nuevoId,
        orden: saliente.orden,
        activo: true,
      };

      // Insertar en la misma posición del saliente
      const idx = lineup.findIndex((b) => b.id === salienteId);
      lineup.splice(idx + 1, 0, nuevoBateador);

      return { ...estado, lineup };
    }

    case 'REGISTRAR_TURNO': {
      const turno: TurnoAlBate = {
        ...accion.payload,
        id: generarId(),
        timestamp: new Date().toISOString(),
      };
      return { ...estado, turnosAlBate: [...estado.turnosAlBate, turno] };
    }

    case 'AVANZAR_BATEADOR': {
      const activos = estado.lineup.filter((b) => b.activo);
      if (activos.length === 0) return estado;
      const siguiente = (estado.bateadorActualIndex + 1) % activos.length;
      const vueltasAlOrden = siguiente < estado.bateadorActualIndex
        ? estado.vueltasAlOrden + 1
        : estado.vueltasAlOrden;
      return { ...estado, bateadorActualIndex: siguiente, vueltasAlOrden };
    }

    case 'SET_BATEADOR_ACTUAL':
      return { ...estado, bateadorActualIndex: accion.payload };

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

  const bateadoresActivos = estado.lineup.filter((b) => b.activo);
  const bateadorActual = bateadoresActivos[estado.bateadorActualIndex] ?? null;

  return (
    <ScoutContext.Provider value={{ estado, dispatch, bateadorActual, bateadoresActivos }}>
      {children}
    </ScoutContext.Provider>
  );
}

export function useScout() {
  const ctx = useContext(ScoutContext);
  if (!ctx) throw new Error('useScout debe usarse dentro de ScoutProvider');
  return ctx;
}
