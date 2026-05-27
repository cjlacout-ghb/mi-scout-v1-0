// ─── TIPOS PRINCIPALES DE MI SCOUT ────────────────────────────────────────────

export type TipoPitch = 'drop' | 'riser' | 'curva' | 'cambio' | 'otro';

export type ResultadoAtBat =
  | 'BB'     // Base por bolas
  | 'HBP'     // Hit by pitch (golpe)
  | 'KS'     // Strikeout swinging
  | 'KL'     // Strikeout looking
  | 'OUT'
  | 'HIT';

export type TipoOut = 'asistencia' | 'sac bunt' | 'fly' | 'linea';
export type TipoHit = 'bunt' | 'single' | 'doble' | 'triple' | 'homerun' | 'infield hit';
export type CalidadContacto = 'soft' | 'hard';

// Zona de strike: 1-4 internos, 5-8 perimetrales
export type ZonaStrike = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Número de defensor o ubicación de bateo (1-10)
export type NumeroDefensor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | '7/8' | '8/9';

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

export interface Coordenadas {
  x: number; // 0.0 a 1.0 (porcentaje de ancho)
  y: number; // 0.0 a 1.0 (porcentaje de alto)
}

export interface TurnoAlBate {
  id: string;
  bateadorId: string;  // ID del bateador en el lineup
  inning: number;
  zona: ZonaStrike;
  coordenadas?: Coordenadas; // Coordenadas exactas del lanzamiento
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
  ladoBateo: 'D' | 'Z' | 'S'; // Derecho, Zurdo, Switch
  activo: boolean;
  esAbridor: boolean;          // true si inició el partido, false si es sustituto
  reemplazadoPorId?: string;   // ID del bateador que lo reemplazó
  reemplazadoAInning?: number;
  rol?: 'visitante' | 'local'; // Equipo al que pertenece
}

export interface Partido {
  id: string;
  fecha: string;         // ISO date string
  visitante: string;
  local: string;
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
  basesPorBolas: number;      // BB/HBP
  outs: number;
  promedio: number;           // AVG = H / AB
  porZona: Record<ZonaStrike, { pitches: number; hits: number; outs: number; contacto: number }>;
}

// Estado global del partido en curso
export interface EstadoPartido {
  partido: Partido | null;
  lineupVisitante: Bateador[];
  lineupLocal: Bateador[];
  turnosAlBate: TurnoAlBate[];
  indiceVisitante: number;  // Índice en el lineup visitante
  indiceLocal: number;      // Índice en el lineup local
  mitadInning: 'alta' | 'baja';
  inningActual: number;
  vueltasAlOrdenVisitante: number;
  vueltasAlOrdenLocal: number;
  perspectivaZona: 'catcher' | 'pitcher';
}
