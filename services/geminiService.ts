import { GoogleGenAI } from "@google/genai";
import { SimulationParams, SimulationResult } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY no configurada");
  return new GoogleGenAI({ apiKey });
};

export const generateLegalReport = async (
  params: SimulationParams,
  results: SimulationResult
): Promise<string> => {
  try {
    const ai = getAIClient();
    const prompt = `
      Actúa como el Director del Departamento Administrativo de Planeación de Medellín, experto en el Plan de Ordenamiento Territorial (POT) vigente: **Acuerdo 48 de 2014**.

      Contexto:
      Se ha ejecutado una simulación en el "Monitor POT" para evaluar la viabilidad de instrumentos de gestión y financiación del suelo bajo el modelo de "Ciudad Compacta".
      
      Parámetros de la simulación aplicada:
      - Índice de Construcción (Densificación): ${params.heightMultiplier}x sobre la norma base.
      - Flexibilización de Planes Parciales (Art. 405): ${params.removePlanParcial ? 'ACTIVADA (Gestión Predio a Predio)' : 'DESACTIVADA (Requiere Unidad de Actuación)'}
      - Exención de Obligaciones Urbanísticas VIS/VIP (Art. 280): ${params.socialHousingIncentive ? 'APLICADA' : 'NO APLICADA'}
      
      Resultados obtenidos del modelo financiero:
      - Unidades de vivienda potenciales desbloqueadas: ${results.unlockedUnits}
      - Polígonos de tratamiento reactivados: ${results.zonesUnlocked}
      - Margen promedio del desarrollador: ${results.avgMargin.toFixed(1)}%
      
      Tarea:
      Genera un **Concepto Técnico de Revisión Excepcional** (formato markdown) citando explícitamente el Acuerdo 48 de 2014.
      
      Estructura del Informe:
      1. **Encabezado**: Referencia al Modelo de Ocupación Territorial (MOT) y el principio de "Ecociudad".
      2. **Diagnóstico Normativo**: Analizar si las cargas actuales (Obligaciones) y la gestión asociada (Planes Parciales) están bloqueando el desarrollo en los Macroproyectos del Río y Bordes.
      3. **Justificación Técnica**: Usar los datos de la simulación para argumentar la necesidad de flexibilizar los Instrumentos de Gestión. Citar el Artículo 15 (Objetivos del POT).
      4. **Propuesta de Modificación**: Redactar un borrador de artículo modificatorio proponiendo, por ejemplo, ajustes a la compensación de obligaciones en suelo de renovación urbana.
      
      Tono: Institucional, jurídico, técnico y alineado con las políticas públicas de Medellín.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "No se pudo generar el reporte.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Error generando el reporte. Verifique la API Key.";
  }
};

export const consultarNormativaPOT = async (query: string): Promise<string> => {
  try {
    const ai = getAIClient();
    
    const prompt = `
      Actúa como el Sistema de Información Normativa (InfoPOT) de la Alcaldía de Medellín. Tu base de conocimiento es exclusivamente el **Acuerdo 48 de 2014 (Plan de Ordenamiento Territorial)**.

      Solicitud del Usuario (Intranet): "${query}"

      Tarea:
      Responde a la consulta técnica citando la normativa aplicable del POT de Medellín.

      Estructura de la respuesta (Formato Memorando Interno):
      1. **Marco Normativo Aplicable**: Cita los artículos aproximados del Acuerdo 48 de 2014 que regulan el tema consultado (ej. Usos del Suelo, Tratamientos, Índices de Construcción, Obligaciones).
      2. **Concepto Técnico**: Explicación clara y detallada de cómo aplica la norma a la consulta.
      3. **Requerimientos Específicos**: Si aplica, lista requisitos (ej. Cesiones, Vías obligadas, Retiros a quebradas).

      Reglas:
      - Si la pregunta es sobre alturas, menciona el plano de alturas y el concepto de índice de construcción.
      - Si es sobre usos, menciona el Cuadro de Usos del Suelo (Anexo 3 del POT).
      - Mantén un tono formal, administrativo y preciso.
      - Si la información no es exacta en tu entrenamiento, indica qué artículo general regula la materia.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "No se encontró información normativa específica para esta consulta.";
  } catch (error) {
    console.error("Error consulting POT:", error);
    return "Error de conexión con la base de datos normativa.";
  }
};