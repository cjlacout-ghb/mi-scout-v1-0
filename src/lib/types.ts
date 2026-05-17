// ─── TIPOS PRINCIPALES DE MI SCOUT ────────────────────────────────────────────

export type TipoPitch = 'drop' | 'riser' | 'curva' | 'cambio' | 'otro';

export type ResultadoAtBat =
  | 'BB/HP'
  | 'KS'    // Strikeout swinging
  | 'KL'    // Strikeout looking
  | 'OUT'
  | 'HIT';

export type TipoOut = 'asistencia' | 'fly';
export type TipoHit = 'bunt' | 'single' | 'doble' | 'triple' | 'homerun';
export type CalidadContacto = 'soft' | 'hard';

// Zona de strike: 1-4 internos, 5-8 perimetrales
export type ZonaStrike = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Número de defensor o ubicación de bateo (1-10)
export type NumeroDefensor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface DetalleOut {
  tipo: TipoOut;
  defensor: NumeroDefensor;
  calidad: CalidadContacto;
}

export interface DetalleHit {
  tipo: TipoHit;
  ubicacion: NumeroDefensor;
  calidad: CalidadContacto;
}

export interface TurnoAlBate {
  id: string;
  bateadorId: string;  // ID del bateador en el lineup
  inning: number;
  zona: ZonaStrike;
  tipoPitch: TipoPitch;
  resultado: ResultadoAtBat;
  detalleOut?: DetalleOut;
  detalleHit?: DetalleHit;
  timestamp: string;
}

export interface Bateador {
  id: string;
  orden: number;         // Posición en el lineup (1-15)
  numero: string;        // Número de camiseta
  apellido: string;
  nombre: string;
  equipo: string;
  activo: boolean;
  reemplazadoPorId?: string;   // ID del bateador que lo reemplazó
  reemplazadoAInning?: number;
}

export interface Partido {
  id: string;
  fecha: string;         // ISO date string
  rival: string;
  descripcion: string;
  innings: number;       // Innings jugados
  creadoEn: string;
}

export interface EstadisticasBateador {
  bateadorId: string;
  turnosAlBate: number;   // AB
  hits: number;           // H
  dobles: number;
  triples: number;
  homeRuns: number;
  strikeoutsSwinging: number; // KS
  strikeoutsLooking: number;  // KL
  basesPorBolas: number;      // BB/HP
  outs: number;
  promedio: number;           // AVG = H / AB
  porZona: Record<ZonaStrike, { pitches: number; hits: number; outs: number; contacto: number }>;
}

// Estado global del partido en curso
export interface EstadoPartido {
  partido: Partido | null;
  lineup: Bateador[];
  turnosAlBate: TurnoAlBate[];
  bateadorActualIndex: number;  // Índice en el lineup
  inningActual: number;
  vueltasAlOrden: number;       // Cuántas veces pasó por el lineup completo
}
