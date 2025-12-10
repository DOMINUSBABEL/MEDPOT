import { UrbanZone } from '../types';

// Generates a grid of urban zones representing different parts of Medellín with POT nomenclature
export const generateUrbanData = (): UrbanZone[] => {
  const data: UrbanZone[] = [];
  
  // Coordinates are calibrated for a 100x100 grid where:
  // 0,0 is Top-Left (North-West)
  // 100,100 is Bottom-Right (South-East)
  
  // Based on Macroproyectos from Acuerdo 48 de 2014
  const macroproyectos = [
    // Macroproyecto Río Sur (El Poblado / Guayabal) - Z3_CN1 (Consolidación Nivel 1)
    { name: 'Macroproyecto Río Sur', code: 'Z3_CN1', baseX: 70, baseY: 70, landValue: 8000000, income: 12000000, tourist: 95, height: 20 },
    
    // Macroproyecto Río Centro (La Candelaria / Centro) - Z1_RED (Redesarrollo)
    { name: 'Macroproyecto Río Centro', code: 'Z1_RED', baseX: 55, baseY: 45, landValue: 5500000, income: 3500000, tourist: 30, height: 15 },
    
    // Macroproyecto Transversal (Laureles / Estadio) - Z4_CN2 (Consolidación Nivel 2)
    { name: 'Macroproyecto Transversal', code: 'Z4_CN2', baseX: 40, baseY: 50, landValue: 6000000, income: 7000000, tourist: 70, height: 12 },
    
    // Macroproyecto Bordes Occidental (Belén / Altavista) - Z5_M (Mejoramiento Integral)
    { name: 'Borde Occidental', code: 'Z5_MI', baseX: 30, baseY: 70, landValue: 4500000, income: 4500000, tourist: 40, height: 8 },
    
    // Macroproyecto Bordes Norte (Robledo / Doce de Octubre) - Z7_MI (Mejoramiento)
    { name: 'Borde Norte', code: 'Z7_MI', baseX: 25, baseY: 30, landValue: 2500000, income: 2500000, tourist: 10, height: 5 },
    
    // Aranjuez / Manrique - Z2_C (Consolidación)
    { name: 'Zona Nororiental', code: 'Z2_CN3', baseX: 65, baseY: 25, landValue: 3000000, income: 2800000, tourist: 15, height: 4 },
  ];

  let idCounter = 0;

  macroproyectos.forEach((macro) => {
    // Generate micro-polygons per commune
    for (let i = 0; i < 15; i++) {
      // In POT 48, expansion and renovation zones often require Partial Plans
      const isPlanParcial = Math.random() > 0.60; 
      const subCode = `${macro.code}_${Math.floor(Math.random() * 900) + 100}`;
      
      const scatterX = (Math.random() * 14 - 7);
      const scatterY = (Math.random() * 14 - 7);

      data.push({
        id: subCode,
        name: `Polígono ${subCode}`,
        commune: macro.name,
        coordinates: {
          x: Math.max(5, Math.min(95, macro.baseX + scatterX)),
          y: Math.max(5, Math.min(95, macro.baseY + scatterY)),
        },
        currentHeight: Math.floor(Math.random() * macro.height) + 1,
        maxAllowedHeight: macro.height,
        landValue: macro.landValue * (0.9 + Math.random() * 0.2),
        constructionCost: 3800000, 
        planParcialRequired: isPlanParcial,
        avgRentPrice: (macro.landValue * 0.005) + (Math.random() * 500000),
        incomeLevel: macro.income,
        touristPressure: macro.tourist + (Math.random() * 10 - 5),
      });
    }
  });

  return data;
};

export const INITIAL_ZONES = generateUrbanData();