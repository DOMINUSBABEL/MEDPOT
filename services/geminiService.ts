import { GoogleGenAI } from "@google/genai";
import { SimulationParams, SimulationResult } from "../types";

export const generateLegalReport = async (
  params: SimulationParams,
  results: SimulationResult
): Promise<string> => {
  // Inicializamos el cliente aquí para evitar errores de 'process is not defined' al cargar el módulo
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return "Error: API_KEY no configurada en el entorno. No se puede generar el reporte jurídico.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Actúa como un experto consultor urbano y abogado urbanista para la ciudad de Medellín.
    
    Contexto: Se ha realizado una simulación utilizando un "Gemelo Digital" para evaluar reformas al POT (Plan de Ordenamiento Territorial).
    
    Parámetros de la simulación aplicada:
    - Multiplicador de Altura: ${params.heightMultiplier}x
    - Eliminación de Planes Parciales en zonas bloqueadas: ${params.removePlanParcial ? 'SÍ' : 'NO'}
    - Incentivos VIS (Exención de cargas): ${params.socialHousingIncentive ? 'SÍ' : 'NO'}
    
    Resultados obtenidos del modelo matemático:
    - Unidades de vivienda potenciales desbloqueadas: ${results.unlockedUnits}
    - Zonas urbanas reactivadas: ${results.zonesUnlocked}
    - Margen promedio del desarrollador (Viabilidad): ${results.avgMargin.toFixed(1)}%
    
    Tarea:
    Genera un resumen ejecutivo formal (formato markdown) titulado "Justificación Técnica para Revisión Excepcional del POT".
    
    El reporte debe incluir:
    1. **Diagnóstico Jurídico**: Explicar por qué la norma actual estaba bloqueando el suelo (énfasis en Planes Parciales y cargas excesivas).
    2. **Evidencia de Viabilidad**: Usar los datos de unidades desbloqueadas para justificar el interés público.
    3. **Propuesta de Articulado (Borrador Conceptual)**: Sugerir 2 o 3 modificaciones legales concretas basadas en los parámetros activados (ej: "Modificación al Artículo X sobre cesiones").
    4. **Conclusión**: Argumento final para el Concejo de Medellín.

    Tono: Técnico, jurídico y persuasivo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Fast response for UI
      }
    });
    return response.text || "No se pudo generar el reporte.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Error generando el reporte. Por favor intente nuevamente.";
  }
};