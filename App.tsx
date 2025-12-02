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
  Info,
  AlertTriangle,
  Map as MapIcon,
  Loader2,
  Download,
  Printer,
  ChevronRight
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
  const [activeTab, setActiveTab] = useState<'layers' | 'simulation' | 'analysis'>('simulation');
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
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden selection:bg-blue-100">
      
      {/* 1. Header Institucional */}
      <header className="bg-white border-b-4 border-blue-800 flex items-center justify-between px-6 py-2 shadow-sm z-50 h-[70px] shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 leading-none tracking-tight">GeoMedellín</h1>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Alcaldía de Medellín | Depto. Administrativo de Planeación</span>
          </div>
          
          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
          
          <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-1.5 rounded-md border border-blue-100">
             <MapIcon className="w-4 h-4" />
             <span className="text-sm font-semibold">Visor POT 48-2014 (Simulación)</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative hidden lg:block">
             <input type="text" placeholder="Buscar predio o polígono (ej. Z3_CN1)..." className="pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all" />
             <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
           </div>
           <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-md border border-transparent hover:border-slate-200 transition-colors">
             <Menu className="w-6 h-6" />
           </button>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar (GIS Panel) */}
        <div className="w-[340px] bg-white border-r border-slate-200 flex flex-col shadow-xl z-40 shrink-0">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white sticky top-0">
            <button 
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-[3px] transition-colors ${activeTab === 'layers' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Capas
            </button>
            <button 
              onClick={() => setActiveTab('simulation')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-[3px] transition-colors ${activeTab === 'simulation' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Simulación
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-[3px] transition-colors ${activeTab === 'analysis' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Análisis
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
            
            {/* Layers Tab (Mock) */}
            {activeTab === 'layers' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cartografía Base</h3>
                  <label className="flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 p-2 rounded -mx-2 cursor-pointer">
                    <input type="checkbox" checked readOnly className="accent-blue-600 w-4 h-4 rounded border-slate-300" />
                    <span>Límite Municipal</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 p-2 rounded -mx-2 cursor-pointer">
                    <input type="checkbox" checked readOnly className="accent-blue-600 w-4 h-4 rounded border-slate-300" />
                    <span>Barrios y Veredas</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 p-2 rounded -mx-2 cursor-pointer">
                    <input type="checkbox" checked readOnly className="accent-blue-600 w-4 h-4 rounded border-slate-300" />
                    <span>Red Hídrica Principal</span>
                  </label>
                </div>
                
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Normativa POT</h3>
                  <div className="flex items-center gap-2 text-sm text-blue-800 p-2 bg-blue-50 rounded border border-blue-100 font-medium">
                    <Layers className="w-4 h-4" />
                    <span>Polígonos de Tratamiento</span>
                  </div>
                  <label className="flex items-center gap-3 text-sm text-slate-700 ml-4 hover:bg-slate-50 p-2 rounded cursor-pointer">
                    <input type="checkbox" className="accent-blue-600 w-4 h-4 rounded border-slate-300" />
                    <span>Áreas de Expansión</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 ml-4 hover:bg-slate-50 p-2 rounded cursor-pointer">
                    <input type="checkbox" className="accent-blue-600 w-4 h-4 rounded border-slate-300" />
                    <span>Zonas de Riesgo</span>
                  </label>
                </div>
              </div>
            )}

            {/* Simulation Tab */}
            {activeTab === 'simulation' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-xs text-blue-800 leading-relaxed shadow-sm">
                  <div className="flex gap-2 items-start">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>Modifique las variables normativas para visualizar el impacto en la viabilidad inmobiliaria.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-bold text-slate-700">Índice de Construcción (Altura)</label>
                      <span className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{params.heightMultiplier}x</span>
                    </div>
                    <div className="relative h-6 flex items-center">
                      <input 
                        type="range" min="1" max="3" step="0.1"
                        value={params.heightMultiplier}
                        onChange={(e) => setParams({...params, heightMultiplier: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 z-10"
                      />
                      <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                        <div className="w-px h-full bg-slate-300"></div>
                        <div className="w-px h-full bg-slate-300"></div>
                        <div className="w-px h-full bg-slate-300"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                      <span>POT Actual</span>
                      <span>+100%</span>
                      <span>+200%</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                     <label className="text-sm font-bold text-slate-700 block mb-4">Gestión del Suelo</label>
                     <div 
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-all group"
                        onClick={() => setParams({...params, removePlanParcial: !params.removePlanParcial})}
                     >
                       <span className="text-sm text-slate-700 group-hover:text-blue-700 transition-colors">Derogar Planes Parciales</span>
                       <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${params.removePlanParcial ? 'bg-blue-600' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ease-in-out ${params.removePlanParcial ? 'left-6' : 'left-1'}`}></div>
                       </div>
                     </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                     <label className="text-sm font-bold text-slate-700 block mb-4">Instrumentos Financieros</label>
                     <div 
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-all group"
                        onClick={() => setParams({...params, socialHousingIncentive: !params.socialHousingIncentive})}
                     >
                       <span className="text-sm text-slate-700 group-hover:text-blue-700 transition-colors">Incentivos VIS/VIP</span>
                       <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${params.socialHousingIncentive ? 'bg-blue-600' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ease-in-out ${params.socialHousingIncentive ? 'left-6' : 'left-1'}`}></div>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Vivienda Nueva</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-bold text-emerald-600">+{simulationResult.unlockedUnits.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">ud.</span>
                      </div>
                   </div>
                   <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Polígonos</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-bold text-blue-600">{simulationResult.zonesUnlocked}</span>
                        <span className="text-xs text-slate-400">zonas</span>
                      </div>
                   </div>
                 </div>

                 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Riesgo Gentrificación</span>
                     {simulationResult.gentrificationRisk > 40 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                   </div>
                   <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                     <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${simulationResult.gentrificationRisk}%` }}></div>
                   </div>
                   <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                     <span>Bajo</span>
                     <span className="text-slate-600">{simulationResult.gentrificationRisk.toFixed(1)}% (Alto)</span>
                   </div>
                 </div>

                 <button 
                  onClick={() => setShowReportModal(true)}
                  className="w-full mt-6 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-3 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group"
                 >
                   <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                   Generar Ficha Normativa
                 </button>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 text-[10px] text-slate-400 text-center bg-slate-50 font-mono">
             Sistema de Soporte a la Decisión (DSS) v2.4
          </div>
        </div>

        {/* Map Area */}
        <main className="flex-1 relative bg-[#e2e8f0]">
          <MapViz data={INITIAL_ZONES} zoneStatuses={zoneStatuses} />
        </main>

        {/* Report Modal */}
        {showReportModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg">Informe Técnico Justificativo</h2>
                      <p className="text-xs text-slate-500">Expediente Digital #{Math.floor(Math.random()*10000)}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
                  {!report ? (
                     <div className="flex flex-col items-center justify-center h-full space-y-6">
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 max-w-lg w-full text-center shadow-sm">
                           <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Settings className="w-8 h-8 animate-spin-slow" />
                           </div>
                           <h3 className="font-bold text-xl mb-2 text-slate-800">Generar Concepto Técnico</h3>
                           <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                             El sistema utilizará algoritmos de IA para redactar una justificación jurídica formal basada en los <strong className="text-slate-700">{simulationResult.zonesUnlocked} polígonos desbloqueados</strong> por la simulación actual.
                           </p>
                           
                           <button 
                             onClick={handleGenerateReport}
                             disabled={isGeneratingReport}
                             className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                           >
                              {isGeneratingReport ? <Loader2 className="animate-spin w-5 h-5"/> : <Settings className="w-5 h-5"/>}
                              {isGeneratingReport ? 'Procesando Normativa...' : 'Generar Documento'}
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="max-w-3xl mx-auto bg-white">
                        <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-8">
                           <div>
                              <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Concepto Técnico</h1>
                              <p className="text-sm text-slate-600 mt-1 font-medium">Ref: Revisión Excepcional POT - Simulación de Viabilidad</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">FECHA DE EMISIÓN</p>
                              <p className="font-mono text-sm">{new Date().toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="prose prose-sm md:prose-base max-w-none text-slate-800 text-justify leading-relaxed whitespace-pre-wrap font-serif">
                           {report}
                        </div>
                     </div>
                  )}
               </div>

               {report && (
                 <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 shadow-sm flex items-center gap-2 transition-colors">
                      <Printer className="w-4 h-4"/> Imprimir
                    </button>
                    <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow flex items-center gap-2 transition-colors">
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