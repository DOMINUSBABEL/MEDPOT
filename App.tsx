import React, { useState, useEffect } from 'react';
import { MapViz } from './components/MapViz';
import { INITIAL_ZONES } from './services/mockData';
import { generateLegalReport, consultarNormativaPOT } from './services/geminiService';
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
  ChevronRight,
  BookOpen,
  Database,
  Send,
  ShieldCheck
} from 'lucide-react';

// "The Engine" - Phase 3: Calculadora de Viabilidad Inversa adaptada al POT 48-2014
const calculateViability = (zone: typeof INITIAL_ZONES[0], params: SimulationParams) => {
  let cost = zone.landValue + zone.constructionCost;
  
  // Factor: Gestión Asociada (Planes Parciales) - Art. 405 POT
  // Si se elimina el requisito, se asume licencia predio a predio (menor carga administrativa)
  if (zone.planParcialRequired && !params.removePlanParcial) {
    cost *= 1.35; // Sobrecosto por gestión de suelo y fiducia
  }

  // Factor: Obligaciones Urbanísticas - Art. 268 POT
  // Si hay incentivos, se reduce el pago compensatorio o cesiones
  if (params.socialHousingIncentive) {
    cost *= 0.85; 
  }

  // Altura Efectiva vs Aprovechamiento Básico
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
  const [activeTab, setActiveTab] = useState<'layers' | 'simulation' | 'analysis'>('layers');
  const [params, setParams] = useState<SimulationParams>({
    heightMultiplier: 1.0,
    removePlanParcial: false,
    socialHousingIncentive: false,
    constructionCostEfficiency: 0
  });

  // State for GIS Layers (Cartografía Oficial)
  const [activeLayers, setActiveLayers] = useState({
    limiteMunicipal: true,
    barrios: true,
    hidrografia: true,
    poligonos: true,
    expansion: false,
    riesgo: false
  });

  const [simulationResult, setSimulationResult] = useState<SimulationResult>({
    unlockedUnits: 0,
    avgMargin: 0,
    zonesUnlocked: 0,
    gentrificationRisk: 0
  });

  const [zoneStatuses, setZoneStatuses] = useState<Map<string, ZoneStatus>>(new Map());
  
  // States for Report Modal
  const [report, setReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // States for Intranet/InfoPOT
  const [searchQuery, setSearchQuery] = useState('');
  const [consultationResult, setConsultationResult] = useState<string | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);

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
        status = ZoneStatus.LOCKED; // Inviabilidad Financiera
      } else if (isGentrif) {
        status = ZoneStatus.AT_RISK; // Presión Inmobiliaria
      } else {
        status = ZoneStatus.OPTIMIZED;
        totalUnits += potentialUnits;
        unlockedZonesCount++;
      }

      // Lógica específica para suelos de expansión con Plan Parcial bloqueado
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

  const handleConsultation = async () => {
    if (!searchQuery.trim()) return;
    setIsConsulting(true);
    const text = await consultarNormativaPOT(searchQuery);
    setConsultationResult(text);
    setIsConsulting(false);
  };

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden selection:bg-blue-100">
      
      {/* 1. Header Institucional POT */}
      <header className="bg-white border-b-4 border-blue-800 flex items-center justify-between px-6 py-2 shadow-sm z-50 h-[70px] shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 leading-none tracking-tight">GeoMedellín</h1>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Alcaldía de Medellín | Depto. Administrativo de Planeación</span>
          </div>
          
          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
          
          <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-1.5 rounded-md border border-blue-100">
             <BookOpen className="w-4 h-4" />
             <span className="text-sm font-semibold">Monitor POT (Acuerdo 48 de 2014)</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative hidden lg:block">
             <input type="text" placeholder="Buscar CBML, Barrio o Polígono..." className="pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all" />
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
        <div className="w-[380px] bg-white border-r border-slate-200 flex flex-col shadow-xl z-40 shrink-0">
          
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
              Consultas
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-slate-50/50">
            
            {/* Layers Tab (Connected to State) */}
            {activeTab === 'layers' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subsistema Físico-Espacial</h3>
                  <label className="flex items-center gap-3 text-sm text-slate-700 hover:bg-white p-2 rounded -mx-2 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={activeLayers.limiteMunicipal} 
                      onChange={() => toggleLayer('limiteMunicipal')}
                      className="accent-blue-600 w-4 h-4 rounded border-slate-300" 
                    />
                    <span>Límite Municipal</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 hover:bg-white p-2 rounded -mx-2 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={activeLayers.barrios} 
                      onChange={() => toggleLayer('barrios')}
                      className="accent-blue-600 w-4 h-4 rounded border-slate-300" 
                    />
                    <span>División Político-Administrativa</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 hover:bg-white p-2 rounded -mx-2 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={activeLayers.hidrografia} 
                      onChange={() => toggleLayer('hidrografia')}
                      className="accent-blue-600 w-4 h-4 rounded border-slate-300" 
                    />
                    <span>Estructura Ecológica Principal</span>
                  </label>
                </div>
                
                <div className="border-t border-slate-200 pt-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Normativa Acuerdo 48/2014</h3>
                  <label className="flex items-center gap-3 text-sm text-slate-700 hover:bg-white p-2 rounded -mx-2 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                    <div className="flex items-center gap-2 flex-1">
                      <input 
                        type="checkbox" 
                        checked={activeLayers.poligonos} 
                        onChange={() => toggleLayer('poligonos')}
                        className="accent-blue-600 w-4 h-4 rounded border-slate-300" 
                      />
                      <span className="font-medium text-blue-800">Polígonos de Tratamiento</span>
                    </div>
                    <Layers className="w-4 h-4 text-blue-400" />
                  </label>
                  
                  <label className="flex items-center gap-3 text-sm text-slate-700 ml-4 hover:bg-white p-2 rounded cursor-pointer transition-colors border-l-2 border-transparent hover:border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={activeLayers.expansion} 
                      onChange={() => toggleLayer('expansion')}
                      className="accent-blue-600 w-4 h-4 rounded border-slate-300" 
                    />
                    <span>Suelo de Expansión (Zonas 6, 7 y 8)</span>
                  </label>
                  
                  <label className="flex items-center gap-3 text-sm text-slate-700 ml-4 hover:bg-white p-2 rounded cursor-pointer transition-colors border-l-2 border-transparent hover:border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={activeLayers.riesgo} 
                      onChange={() => toggleLayer('riesgo')}
                      className="accent-blue-600 w-4 h-4 rounded border-slate-300" 
                    />
                    <span>Amenaza y Riesgo (Laderas)</span>
                  </label>
                </div>

                <div className="bg-blue-50 p-3 rounded text-[10px] text-blue-800 border border-blue-100 flex gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <p>Visualización conforme al Modelo de Ocupación Territorial (MOT) - Acuerdo 48 de 2014.</p>
                </div>
              </div>
            )}

            {/* Simulation Tab */}
            {activeTab === 'simulation' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Resultados en Tiempo Real</h3>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                     <div className="bg-emerald-50 p-3 rounded border border-emerald-100">
                        <span className="block text-2xl font-bold text-emerald-600">+{simulationResult.unlockedUnits.toLocaleString()}</span>
                        <span className="text-[10px] text-emerald-800 uppercase font-semibold">Viviendas Nuevas</span>
                     </div>
                     <div className="bg-blue-50 p-3 rounded border border-blue-100">
                        <span className="block text-2xl font-bold text-blue-600">{simulationResult.zonesUnlocked}</span>
                        <span className="text-[10px] text-blue-800 uppercase font-semibold">Polígonos Activos</span>
                     </div>
                   </div>
                   
                   <div>
                     <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] text-slate-500 font-bold uppercase">Riesgo Gentrificación</span>
                       <span className="text-xs font-bold text-amber-600">{simulationResult.gentrificationRisk.toFixed(1)}%</span>
                     </div>
                     <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${simulationResult.gentrificationRisk}%` }}></div>
                     </div>
                   </div>

                   <button 
                    onClick={() => setShowReportModal(true)}
                    className="w-full mt-4 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold py-2 rounded shadow-sm transition-all flex items-center justify-center gap-2"
                   >
                     <FileText className="w-3 h-3" />
                     Generar Concepto Técnico de Simulación
                   </button>
                </div>

                <div className="space-y-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parámetros Legislativos</h3>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-bold text-slate-700">Índice de Construcción / Aprovechamiento</label>
                      <span className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{params.heightMultiplier}x</span>
                    </div>
                    <div className="relative h-6 flex items-center">
                      <input 
                        type="range" min="1" max="3" step="0.1"
                        value={params.heightMultiplier}
                        onChange={(e) => setParams({...params, heightMultiplier: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 z-10"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-5">
                     <label className="text-sm font-bold text-slate-700 block mb-1">Gestión del Suelo (Art. 405)</label>
                     <p className="text-[10px] text-slate-400 mb-4">Unidades de Actuación Urbanística y Planes Parciales</p>
                     
                     <div 
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-all group"
                        onClick={() => setParams({...params, removePlanParcial: !params.removePlanParcial})}
                     >
                       <span className="text-sm text-slate-700 group-hover:text-blue-700 transition-colors">Flexibilizar Planes Parciales</span>
                       <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${params.removePlanParcial ? 'bg-blue-600' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ease-in-out ${params.removePlanParcial ? 'left-6' : 'left-1'}`}></div>
                       </div>
                     </div>
                  </div>

                  <div className="border-t border-slate-200 pt-5">
                     <label className="text-sm font-bold text-slate-700 block mb-1">Obligaciones Urbanísticas</label>
                     <p className="text-[10px] text-slate-400 mb-4">Cargas, Cesiones y Compensaciones</p>
                     
                     <div 
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-all group"
                        onClick={() => setParams({...params, socialHousingIncentive: !params.socialHousingIncentive})}
                     >
                       <span className="text-sm text-slate-700 group-hover:text-blue-700 transition-colors">Exención para VIS/VIP</span>
                       <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${params.socialHousingIncentive ? 'bg-blue-600' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ease-in-out ${params.socialHousingIncentive ? 'left-6' : 'left-1'}`}></div>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* Consultation / Intranet Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 flex flex-col h-full">
                 
                 <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 rounded-lg text-white shadow-md shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                       <Database className="w-5 h-5 text-blue-200" />
                       <h3 className="font-bold text-sm uppercase tracking-wide">InfoPOT Intranet</h3>
                    </div>
                    <p className="text-xs text-blue-100 opacity-90 leading-relaxed">
                      Sistema experto de consulta normativa sobre el Acuerdo 48 de 2014. Realice consultas sobre usos, tratamientos, obligaciones y normas generales.
                    </p>
                 </div>

                 <div className="flex flex-col gap-3 shrink-0">
                    <label className="text-xs font-bold text-slate-500 uppercase">Consulta Normativa</label>
                    <div className="relative">
                      <textarea
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ej: ¿Cuáles son las cesiones obligatorias en suelo de expansión? ¿Cuál es la altura máxima en Z3_CN1?"
                        className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none shadow-sm"
                      />
                      <button 
                        onClick={handleConsultation}
                        disabled={isConsulting || !searchQuery.trim()}
                        className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-2 rounded-md shadow-sm transition-all"
                        title="Consultar"
                      >
                        {isConsulting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                 </div>

                 {consultationResult && (
                   <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-sm animate-in fade-in zoom-in-95 duration-300 flex flex-col">
                      <div className="bg-slate-100 p-2 border-b border-slate-200 flex justify-between items-center sticky top-0">
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                           <ShieldCheck className="w-4 h-4 text-emerald-600" />
                           Respuesta Oficial (IA)
                         </div>
                         <button 
                          onClick={() => setConsultationResult(null)} 
                          className="text-[10px] text-blue-600 hover:underline"
                         >
                           Limpiar
                         </button>
                      </div>
                      <div className="p-4 prose prose-sm max-w-none text-slate-700 text-xs leading-relaxed font-sans">
                         {/* Simple markdown rendering equivalent */}
                         {consultationResult.split('\n').map((line, i) => {
                            if (line.startsWith('**') || line.startsWith('#')) return <strong key={i} className="block mt-2 mb-1 text-slate-900">{line.replace(/\*\*/g, '').replace(/#/g, '')}</strong>;
                            if (line.startsWith('-')) return <li key={i} className="ml-4">{line.replace('-', '')}</li>;
                            return <p key={i} className="mb-2">{line}</p>;
                         })}
                      </div>
                   </div>
                 )}

                 {!consultationResult && (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                      <Search className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-xs font-medium">Esperando consulta...</p>
                   </div>
                 )}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 text-[10px] text-slate-400 text-center bg-slate-50 font-mono">
             Sistema de Soporte a la Decisión (DSS) v2.4 | POT 48-2014
          </div>
        </div>

        {/* Map Area - Passing activeLayers state */}
        <main className="flex-1 relative bg-[#e2e8f0]">
          <MapViz data={INITIAL_ZONES} zoneStatuses={zoneStatuses} activeLayers={activeLayers} />
        </main>

        {/* Report Modal (Existing) */}
        {showReportModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg">Informe Técnico Justificativo POT</h2>
                      <p className="text-xs text-slate-500">Expediente Digital: Rev. Excepcional Acuerdo 48/2014</p>
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
                             El sistema procesará los datos de la simulación bajo los lineamientos del <strong className="text-slate-700">Acuerdo 48 de 2014</strong>, generando un análisis de cargas, beneficios y norma urbanística.
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
                              <p className="text-sm text-slate-600 mt-1 font-medium">Ref: Revisión de Instrumentos de Gestión - POT Acuerdo 48/2014</p>
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