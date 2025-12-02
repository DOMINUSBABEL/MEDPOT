export enum ZoneStatus {
  LOCKED = 'LOCKED', // Bloqueado por norma
  AT_RISK = 'AT_RISK', // En riesgo de gentrificación
  VIABLE = 'VIABLE', // Viable para desarrollo
  OPTIMIZED = 'OPTIMIZED' // Desbloqueado por simulación
}

export interface UrbanZone {
  id: string;
  name: string; // e.g., "El Poblado - Z3_CN1"
  commune: string;
  coordinates: { x: number; y: number }; // Abstract coordinates for visualization
  currentHeight: number; // Pisos actuales
  maxAllowedHeight: number; // Pisos permitidos por POT
  landValue: number; // Precio suelo COP/m2
  constructionCost: number; // Costo construcción COP/m2
  planParcialRequired: boolean; // Si requiere plan parcial
  avgRentPrice: number; // Canon promedio actual
  incomeLevel: number; // Ingreso promedio hogar
  touristPressure: number; // 0-100 (Airbnb index)
}

export interface SimulationParams {
  heightMultiplier: number; // Factor de aumento de altura (1.0 = normal)
  removePlanParcial: boolean; // Eliminar requisito de gestión
  socialHousingIncentive: boolean; // Exención de cargas para VIS
  constructionCostEfficiency: number; // % reducción costos por agilidad trámites
}

export interface SimulationResult {
  unlockedUnits: number;
  avgMargin: number; // Margen promedio desarrollador
  zonesUnlocked: number;
  gentrificationRisk: number; // Recalculated risk
}
