# GeoMedellín: Gemelo Digital Urbano & Simulador POT

**Versión:** 2.4 (Sistema de Soporte a la Decisión - DSS)  
**Entidad:** Alcaldía de Medellín | Departamento Administrativo de Planeación  
**Tecnología:** React 18 + TypeScript + Google Gemini AI + SVG Vector Engine

---

## 1. Descripción General

**GeoMedellín** es una plataforma web progresiva (PWA) diseñada como un instrumento de auditoría normativa y simulación urbana en tiempo real. Su objetivo principal es identificar bloqueos financieros generados por el Plan de Ordenamiento Territorial (POT) vigente y simular escenarios de reforma legislativa.

El aplicativo funciona como un **Gemelo Digital**, permitiendo a planeadores urbanos y concejales manipular variables críticas (alturas, cargas urbanísticas, gestión del suelo) y visualizar inmediatamente el impacto en:
1.  La viabilidad financiera de proyectos de vivienda (VIS/VIP).
2.  El desbloqueo de suelo útil para el desarrollo.
3.  Los riesgos de gentrificación y expulsión demográfica.

---

## 2. Arquitectura Técnica

El sistema sigue una arquitectura basada en componentes desacoplados (Component-Based Architecture), priorizando el rendimiento en el renderizado de mapas vectoriales y la reactividad de los cálculos matemáticos en el cliente.

### 2.1. Stack Tecnológico
*   **Core:** React 18 con TypeScript (Tipado estricto para modelos de datos urbanos complejos).
*   **Motor Gráfico:** SVG Nativo (Scalable Vector Graphics) manipulado vía React. No se utilizan librerías de mapas pesadas (como Leaflet o Mapbox) para mantener una arquitectura ligera y permitir un control total del DOM y estilos CSS.
*   **Estilos:** Tailwind CSS para una interfaz consistente e implementación de diseño responsivo.
*   **Inteligencia Artificial:** SDK `@google/genai` (Modelo Gemini 2.5 Flash) para la generación procedimental de conceptos jurídicos.

### 2.2. Estructura de Directorios
*   `App.tsx`: Controlador principal. Maneja el estado global (`activeLayers`, `simulationParams`), el bucle de simulación (`useEffect`) y la orquestación de la interfaz de usuario.
*   `components/MapViz.tsx`: Motor de visualización cartográfica. Renderiza capas vectoriales, aplica patrones de texturas (hatching/dots) y gestiona la interactividad de los marcadores.
*   `services/mockData.ts`: Capa de datos simulada. Representa la base de datos espacial (PostGIS) con coordenadas calibradas para la geografía del Valle de Aburrá.
*   `services/geminiService.ts`: Servicio de integración con la API de Google para la generación de texto legal basado en los resultados de la simulación.

---

## 3. Algoritmos y Lógica de Negocio

### 3.1. Algoritmo de Viabilidad Inversa (`calculateViability`)
Este es el núcleo del simulador. A diferencia de los visores tradicionales que solo muestran normas, este algoritmo calcula si es *financieramente posible* construir bajo esa norma.

**Fórmula Simplificada:**
```typescript
Costo Total = (Costo Suelo + Costo Construcción) * (Factor Plan Parcial) * (Incentivo VIS)
Ingresos = Altura Efectiva * Unidades/Piso * Area Unidad * Precio Mercado
Margen = (Ingresos - Costo Total) / Ingresos
```

**Lógica de Clasificación de Suelo:**
1.  Si `Margen < 8%` → El predio se marca como **LOCKED** (Bloqueo Normativo).
2.  Si `Ratio (Precio Arriendo / Ingreso) > 0.35` → El predio se marca como **AT_RISK** (Gentrificación).
3.  Si `Margen > 12%` Y `Ratio < 0.30` → El predio se marca como **OPTIMIZED** (Viable).

El sistema recalcula estos estados para cientos de polígonos en milisegundos (O(n)) cada vez que el usuario ajusta un parámetro de la simulación.

### 3.2. Motor de Renderizado de Capas (GIS)
El componente `MapViz` implementa un sistema de capas superpuestas (Z-Index) basado en SVG Groups (`<g>`):

1.  **Cartografía Base:** Rutas SVG estáticas que definen el límite municipal (`activeLayers.limiteMunicipal`) y la red hídrica.
2.  **Tramas y Texturas:** Se utilizan definiciones `<defs>` y `<pattern>` de SVG para simular simbología técnica estándar de planeación:
    *   *Grid:* Para suelo urbano consolidado (Barrios).
    *   *Hatching (Rayado Diagonal):* Para zonas de riesgo (Laderas).
    *   *Dots (Punteado):* Para suelos de expansión urbana.
3.  **Renderizado Condicional:** Las capas se desmontan del DOM virtual cuando se desactivan para optimizar el rendimiento de la aplicación.

### 3.3. Generación de Evidencia Jurídica (AI Pipeline)
El sistema transforma datos cuantitativos de la simulación en argumentos cualitativos legales.

1.  **Recolección de Datos:** Se capturan los deltas de la simulación (ej. "Se desbloquearon 45 polígonos", "Margen aumentó al 15%").
2.  **Prompt Engineering:** Se inyecta un contexto estructurado a Gemini 2.5 Flash:
    *   *Rol:* Abogado Urbanista experto en legislación colombiana.
    *   *Input:* Parámetros actuales (Altura, Gestión del Suelo).
    *   *Output Esperado:* Borrador de articulado legal y justificación técnica en formato Markdown.
3.  **Respuesta:** El modelo devuelve un documento listo para exportar a PDF o imprimir.

---

## 4. Guía de Uso del Aplicativo

### 4.1. Panel de Capas (Izquierda - Tab 1)
Permite encender y apagar capas de información geográfica para visualizar diferentes aspectos del territorio.
*   **Cartografía Base:** Contexto espacial (Límites, Barrios, Río).
*   **Normativa POT:**
    *   *Polígonos:* Círculos interactivos que representan el estado financiero de cada zona.
    *   *Áreas de Expansión:* Polígonos con borde punteado azul.
    *   *Zonas de Riesgo:* Zonas con trama rayada roja en las laderas.

### 4.2. Panel de Simulación (Izquierda - Tab 2)
Controles para modificar la realidad normativa ("Simulador Legislativo"):
*   **Índice de Construcción:** Aumenta la altura permitida (densificación).
*   **Gestión del Suelo:** "Derogar Planes Parciales" simula la eliminación de sobrecostos administrativos y tiempos de gestión.
*   **Instrumentos Financieros:** "Incentivos VIS" reduce cargas urbanísticas simulando exenciones tributarias.

### 4.3. Interpretación del Mapa (Convenciones)
*   🔴 **Rojo (Bloqueo):** La norma actual hace inviable la construcción (Margen < 8%).
*   🟢 **Verde (Optimizado):** La reforma simulada ha desbloqueado este suelo para el desarrollo.
*   🟠 **Naranja (Riesgo):** Alta presión inmobiliaria o turística desplazando población local.
*   🔵 **Azul (Norma):** Estado neutral / Norma vigente sin cambios significativos.

---

## 5. Instalación y Despliegue Local

1.  Clonar el repositorio.
2.  Ejecutar `npm install` para instalar dependencias (React, Lucide, Google GenAI SDK).
3.  Configurar la variable de entorno `API_KEY` con una llave válida de Google AI Studio.
4.  Ejecutar `npm start` para lanzar el servidor de desarrollo.

---

© 2024 Alcaldía de Medellín - Prototipo Funcional de Gobierno Digital.