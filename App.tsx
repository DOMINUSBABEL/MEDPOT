import React, { useState, useEffect } from 'react';
import { MapViz } from './components/MapViz';
import { INITIAL_ZONES } from './services/mockData';
import { generateLegalReport } from './services/geminiService';
import { SimulationParams, ZoneStatus, SimulationResult } from './types';
import { 
  Layers, 
  Settings, 
  FileText, 
  Menu, 
  Search, 
  Plus, 
  Minus, 
  Maximize, 
  Info,
  ChevronRight,
  ChevronDown,
  Download,
  Printer,
  MousePointer2,
  AlertTriangle,
  Building2,
  TrendingUp,
  Map as MapIcon,
  Loader2
} from 'lucide-react';

// "The Engine" - Phase 3: Calculadora de Viabilidad Inversa
const calculateViability = (zone: typeof INITIAL_ZONES[0], params: SimulationParams) => {
  let cost = zone.landValue + zone.constructionCost;
  
  if (zone.planParcialRequired && !params.removePlanParcial) {
    cost *= 1.35; 
  }

  if (params.socialHousingIncentive) {
    cost *= 0.85; 
  }

  const effectiveHeight = Math.max(zone.currentHeight, zone.maxAllowedHeight * params.heightMultiplier);
  const unitsPerFloor = 4; 
  const unitSize = 60; 
  const marketPricePerM2 = zone.landValue * 2.2; 

  const totalRevenue = effectiveHeight * unitsPerFloor * unitSize * marketPricePerM2;
  const totalCost = (effectiveHeight * unitsPerFloor * unitSize * cost);
  
  const margin = ((totalRevenue - totalCost) / totalRevenue) * 100;
  const potentialUnits = Math.floor((effectiveHeight - zone.currentHeight) * unitsPerFloor);

  return { margin, potentialUnits: Math.max(0, potentialUnits) };
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'layers' | 'simulation' | 'results'>('simulation');
  const [params, setParams] = useState<SimulationParams>({
    heightMultiplier: 1.0,
    removePlanParcial: false,
    socialHousingIncentive: false,
    constructionCostEfficiency: 0
  });

  const [simulationResult, setSimulationResult] = useState<SimulationResult>({
    unlockedUnits: 0,
    avgMargin: 0,
    zonesUnlocked: 0,
    gentrificationRisk: 0
  });

  const [zoneStatuses, setZoneStatuses] = useState<Map<string, ZoneStatus>>(new Map());
  const [report, setReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Simulation Loop
  useEffect(() => {
    let totalUnits = 0;
    let totalMargin = 0;
    let unlockedZonesCount = 0;
    let totalRisk = 0;
    const newStatuses = new Map<string, ZoneStatus>();

    INITIAL_ZONES.forEach(zone => {
      const { margin, potentialUnits } = calculateViability(zone, params);

      let status = ZoneStatus.LOCKED;
      
      const affordabilityRatio = zone.avgRentPrice / zone.incomeLevel;
      const isGentrif = affordabilityRatio > 0.35 || zone.touristPressure > 70;

      if (margin < 8) {
        status = ZoneStatus.LOCKED; 
      } else if (isGentrif) {
        status = ZoneStatus.AT_RISK;
      } else {
        status = ZoneStatus.OPTIMIZED;
        totalUnits += potentialUnits;
        unlockedZonesCount++;
      }

      if (zone.planParcialRequired && !params.removePlanParcial && margin < 15) {
         status = ZoneStatus.LOCKED;
      }

      newStatuses.set(zone.id, status);
      totalMargin += margin;
      totalRisk += zone.touristPressure;
    });

    setSimulationResult({
      unlockedUnits: totalUnits,
      avgMargin: totalMargin / INITIAL_ZONES.length,
      zonesUnlocked: unlockedZonesCount,
      gentrificationRisk: (totalRisk / INITIAL_ZONES.length)
    });

    setZoneStatuses(newStatuses);
  }, [params]);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const text = await generateLegalReport(params, simulationResult);
    setReport(text);
    setIsGeneratingReport(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* 1. Header Institucional (Tipo MapGIS) */}
      <header className="bg-white border-b-4 border-blue-800 flex items-center justify-between px-4 py-2 shadow-md z-50 h-16 shrink-0">
        <div className="flex items-center gap-4">
          {/* Logo Placeholder */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 leading-none tracking-tight">GeoMedellín</h1>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Alcaldía de Medellín | Depto. Administrativo de Planeación</span>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
          <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded border border-blue-100">
             <MapIcon className="w-4 h-4" />
             <span className="text-xs font-semibold">Visor POT 48-2014 (Simulación)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative hidden md:block">
             <input type="text" placeholder="Buscar predio o polígono (ej. Z3_CN1)..." className="pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
             <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
           </div>
           <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full">
             <Menu className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left GIS Panel */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-xl z-40 shrink-0">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'layers' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Capas
            </button>
            <button 
              onClick={() => setActiveTab('simulation')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'simulation' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Simulación
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'results' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Análisis
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            
            {/* Layers Tab (Mock) */}
            {activeTab === 'layers' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Cartografía Base</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked readOnly className="accent-blue-600" />
                    <span>Límite Municipal</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked readOnly className="accent-blue-600" />
                    <span>Barrios y Veredas</span>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Ordenamiento Territorial</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-700 p-2 bg-slate-50 rounded border border-slate-200">
                    <Layers className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Polígonos Normativos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 ml-6">
                    <input type="checkbox" className="accent-blue-600" />
                    <span>Tratamientos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 ml-6">
                    <input type="checkbox" className="accent-blue-600" />
                    <span>Usos del Suelo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Simulation Tab */}
            {activeTab === 'simulation' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded text-xs text-blue-800">
                  <Info className="w-3 h-3 inline mr-1 mb-0.5" />
                  Modifique las variables normativas para visualizar el impacto en la viabilidad inmobiliaria.
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-2">Índice de Construcción (Altura)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" min="1" max="3" step="0.1"
                        value={params.heightMultiplier}
                        onChange={(e) => setParams({...params, heightMultiplier: parseFloat(e.target.value)})}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <span className="text-sm font-mono font-bold w-12 text-right">{params.heightMultiplier}x</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                     <label className="text-xs font-bold text-slate-600 block mb-3">Gestión del Suelo</label>
                     <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                        onClick={() => setParams({...params, removePlanParcial: !params.removePlanParcial})}
                     >
                       <span className="text-sm text-slate-700">Derogar Planes Parciales</span>
                       <div className={`w-10 h-5 rounded-full relative transition-colors ${params.removePlanParcial ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${params.removePlanParcial ? 'left-6' : 'left-1'}`}></div>
                       </div>
                     </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                     <label className="text-xs font-bold text-slate-600 block mb-3">Instrumentos Financieros</label>
                     <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                        onClick={() => setParams({...params, socialHousingIncentive: !params.socialHousingIncentive})}
                     >
                       <span className="text-sm text-slate-700">Incentivos VIS/VIP</span>
                       <div className={`w-10 h-5 rounded-full relative transition-colors ${params.socialHousingIncentive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${params.socialHousingIncentive ? 'left-6' : 'left-1'}`}></div>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Vivienda Nueva</span>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="text-lg font-bold text-emerald-600">+{simulationResult.unlockedUnits.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 mb-1">ud.</span>
                      </div>
                   </div>
                   <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Polígonos</span>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="text-lg font-bold text-blue-600">{simulationResult.zonesUnlocked}</span>
                        <span className="text-[10px] text-slate-400 mb-1">zonas</span>
                      </div>
                   </div>
                 </div>

                 <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] text-slate-500 uppercase font-bold">Riesgo Gentrificación</span>
                     {simulationResult.gentrificationRisk > 40 && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                   </div>
                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                     <div className="bg-amber-500 h-full" style={{ width: `${simulationResult.gentrificationRisk}%` }}></div>
                   </div>
                   <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                     <span>Bajo</span>
                     <span>{simulationResult.gentrificationRisk.toFixed(1)}% (Alto)</span>
                   </div>
                 </div>

                 <button 
                  onClick={() => setShowReportModal(true)}
                  className="w-full mt-4 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium py-2.5 rounded shadow flex items-center justify-center gap-2"
                 >
                   <FileText className="w-4 h-4" />
                   Generar Ficha Normativa
                 </button>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 text-[10px] text-slate-400 text-center bg-slate-50">
             Sistema de Soporte a la Decisión (DSS) v2.4
          </div>
        </div>

        {/* Map Area */}
        <main className="flex-1 relative bg-slate-200">
          
          {/* Map Controls Overlay (GIS Style) */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <div className="bg-white border border-slate-300 rounded shadow-md flex flex-col">
              <button className="p-2 hover:bg-slate-100 border-b border-slate-200" title="Acercar">
                <Plus className="w-4 h-4 text-slate-700" />
              </button>
              <button className="p-2 hover:bg-slate-100 border-b border-slate-200" title="Alejar">
                <Minus className="w-4 h-4 text-slate-700" />
              </button>
              <button className="p-2 hover:bg-slate-100" title="Extensión Predeterminada">
                <Maximize className="w-4 h-4 text-slate-700" />
              </button>
            </div>

            <div className="bg-white border border-slate-300 rounded shadow-md p-2 cursor-pointer hover:bg-slate-50" title="Identificar">
               <MousePointer2 className="w-4 h-4 text-slate-700" />
            </div>
            
            <div className="bg-white border border-slate-300 rounded shadow-md p-2 cursor-pointer hover:bg-slate-50" title="Imprimir Mapa">
               <Printer className="w-4 h-4 text-slate-700" />
            </div>
          </div>

          {/* Legend Overlay */}
          <div className="absolute bottom-10 left-4 z-10 bg-white/90 backdrop-blur border border-slate-300 p-3 rounded shadow-md text-xs">
             <h4 className="font-bold text-slate-700 mb-2">Convenciones</h4>
             <div className="space-y-1.5">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                 <span>Bloqueo Normativo</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                 <span>Optimizado (Viable)</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                 <span>Alerta Gentrificación</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500 opacity-50"></div>
                 <span>Norma Vigente</span>
               </div>
             </div>
          </div>

          <MapViz data={INITIAL_ZONES} zoneStatuses={zoneStatuses} />
        </main>

        {/* Report Modal */}
        {showReportModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl h-[85vh] rounded-lg shadow-2xl flex flex-col border border-slate-300">
               <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-700" />
                    <h2 className="font-bold text-slate-800">Informe Técnico Justificativo</h2>
                  </div>
                  <button onClick={() => setShowReportModal(false)} className="text-slate-500 hover:text-slate-700">Cerrar</button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 bg-slate-50 custom-scrollbar">
                  {!report ? (
                     <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center">
                           <h3 className="font-bold text-lg mb-2 text-slate-800">Generar Concepto Técnico</h3>
                           <p className="text-slate-500 text-sm mb-6">El sistema utilizará IA para redactar una justificación jurídica basada en los {simulationResult.zonesUnlocked} polígonos desbloqueados por la simulación actual.</p>
                           
                           <button 
                             onClick={handleGenerateReport}
                             disabled={isGeneratingReport}
                             className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                           >
                              {isGeneratingReport ? <Loader2 className="animate-spin w-5 h-5"/> : <Settings className="w-5 h-5"/>}
                              {isGeneratingReport ? 'Procesando Normativa...' : 'Generar Documento'}
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="bg-white shadow-sm border border-slate-200 p-8 min-h-full">
                        <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-8">
                           <div>
                              <h1 className="text-2xl font-bold text-slate-900 uppercase">Concepto Técnico</h1>
                              <p className="text-sm text-slate-600">Ref: Revisión Excepcional POT - Simulación #{Math.floor(Math.random()*1000)}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs font-bold text-slate-500">FECHA</p>
                              <p className="font-mono">{new Date().toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="prose max-w-none text-slate-800 text-justify text-sm leading-relaxed whitespace-pre-wrap">
                           {report}
                        </div>
                     </div>
                  )}
               </div>

               {report && (
                 <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-lg">
                    <button className="px-4 py-2 border border-slate-300 rounded text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                      <Printer className="w-4 h-4"/> Imprimir
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center gap-2">
                      <Download className="w-4 h-4"/> Exportar PDF
                    </button>
                 </div>
               )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}