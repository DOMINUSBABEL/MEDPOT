import { UrbanZone } from '../types';

// Generates a grid of urban zones representing different parts of Medellín with POT nomenclature
export const generateUrbanData = (): UrbanZone[] => {
  const data: UrbanZone[] = [];
  
  // Base communes with POT Classification codes
  const communes = [
    { name: 'El Poblado', code: 'Z3_CN1', baseX: 60, baseY: 25, landValue: 8000000, income: 12000000, tourist: 95, height: 20 },
    { name: 'Laureles', code: 'Z4_R_10', baseX: 40, baseY: 45, landValue: 6000000, income: 7000000, tourist: 70, height: 12 },
    { name: 'Belén', code: 'Z5_M_2', baseX: 30, baseY: 35, landValue: 4500000, income: 4500000, tourist: 40, height: 8 },
    { name: 'La Candelaria', code: 'Z1_CN2', baseX: 50, baseY: 55, landValue: 5500000, income: 3500000, tourist: 30, height: 15 },
    { name: 'Robledo', code: 'Z7_R_5', baseX: 25, baseY: 65, landValue: 2500000, income: 2500000, tourist: 10, height: 5 },
    { name: 'Aranjuez', code: 'Z2_R_8', baseX: 60, baseY: 75, landValue: 3000000, income: 2800000, tourist: 15, height: 4 },
  ];

  let idCounter = 0;

  communes.forEach((commune) => {
    // Generate micro-polygons per commune
    for (let i = 0; i < 15; i++) {
      const isPlanParcial = Math.random() > 0.65; // 35% chance of requiring Partial Plan
      const subCode = `${commune.code}_${Math.floor(Math.random() * 90) + 10}`;
      
      data.push({
        id: subCode,
        name: `Polígono ${subCode}`,
        commune: commune.name,
        // Add random scatter to coordinates
        coordinates: {
          x: commune.baseX + (Math.random() * 12 - 6),
          y: commune.baseY + (Math.random() * 12 - 6),
        },
        currentHeight: Math.floor(Math.random() * commune.height) + 1,
        maxAllowedHeight: commune.height, // Initial constraint
        landValue: commune.landValue * (0.9 + Math.random() * 0.2),
        constructionCost: 3800000, // Updated 2024 cost
        planParcialRequired: isPlanParcial,
        avgRentPrice: (commune.landValue * 0.005) + (Math.random() * 500000),
        incomeLevel: commune.income,
        touristPressure: commune.tourist + (Math.random() * 10 - 5),
      });
    }
  });

  return data;
};

export const INITIAL_ZONES = generateUrbanData();