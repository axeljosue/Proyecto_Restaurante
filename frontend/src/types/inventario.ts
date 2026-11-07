export interface MateriaPrima {
  id: number;
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  alerta_stock_bajo: boolean;
}

export interface RecetaItem {
  id: number;
  producto_id: number;
  materia_prima_id: number;
  nombre: string;
  unidad_medida: string;
  cantidad_requerida: number;
}

export interface MrpInsumo {
  materia_prima_id: number;
  nombre: string;
  unidad_medida: string;
  cantidad_requerida_unitaria: number;
  cantidad_total_requerida: number;
  stock_disponible: number;
  deficit: number;
  suficiente: boolean;
}

export interface MrpCheckResult {
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  viable: boolean;
  insumos: MrpInsumo[];
}

export interface PronosticoSugerencia {
  producto_id: number;
  producto_nombre: string;
  stock_terminado: number;
  demanda_promedio_7d: number;
  dias_historial: number;
  demanda_pronosticada: number;
  sugerido_producir: number;
}

export interface PronosticoResult {
  fecha_objetivo: string;
  metodo: string;
  sugerencias: PronosticoSugerencia[];
}
