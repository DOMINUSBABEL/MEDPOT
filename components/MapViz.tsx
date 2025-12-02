import React, { useState } from 'react';
import { UrbanZone, ZoneStatus } from '../types';
import { Plus, Minus, Maximize, MousePointer2, Printer } from 'lucide-react';

interface MapVizProps {
  data: UrbanZone[];
  zoneStatuses: Map<string, ZoneStatus>;
  activeLayers: {
    limiteMunicipal: boolean;
    barrios: boolean;
    hidrografia: boolean;
    poligonos: boolean;
    expansion: boolean;
    riesgo: boolean;
  };
}

export const MapViz: React.FC<MapVizProps> = ({ data, zoneStatuses, activeLayers }) => {
  const [hoveredZone, setHoveredZone] = useState<UrbanZone | null>(null);

  const getColor = (zoneId: string) => {
    const status = zoneStatuses.get(zoneId);
    switch (status) {
      case ZoneStatus.LOCKED: return '#ef4444'; // Red (Bloqueado)
      case ZoneStatus.OPTIMIZED: return '#10b981'; // Emerald (Optimizado)
      case ZoneStatus.AT_RISK: return '#f59e0b'; // Amber (Riesgo)
      default: return '#93c5fd'; // Light Blue (Norma Vigente)
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#dde3ea] group">
      {/* 1. Map Canvas (SVG) */}
      <svg 
        className="w-full h-full pointer-events-none md:pointer-events-auto"
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Pattern for Grid (Barrios) */}
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#94a3b8" strokeWidth="0.1"/>
          </pattern>
          {/* Pattern for Risk Zones (Hatching) */}
          <pattern id="hatch-risk" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#f87171" strokeWidth="1.5" opacity="0.6" />
          </pattern>
          {/* Pattern for Expansion Zones (Dots) */}
          <pattern id="dots-expansion" width="2" height="2" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="#3b82f6" opacity="0.6" />
          </pattern>
        </defs>

        {/* 1. Limite Municipal (City Outline) */}
        {activeLayers.limiteMunicipal && (
          <path 
            d="M20,10 L45,5 L80,15 L95,40 L85,85 L50,95 L15,85 L5,45 Z" 
            fill="white" 
            stroke="#cbd5e1" 
            strokeWidth="0.5"
            filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.05))"
          />
        )}

        {/* 2. Barrios y Veredas (Grid Mesh) */}
        {activeLayers.barrios && activeLayers.limiteMunicipal && (
          <path 
            d="M20,10 L45,5 L80,15 L95,40 L85,85 L50,95 L15,85 L5,45 Z" 
            fill="url(#grid)" 
            opacity="0.4"
          />
        )}

        {/* 3. Zonas de Riesgo (Laderas) */}
        {activeLayers.riesgo && (
          <g>
            {/* Ladera Oriental */}
            <path d="M75,20 L90,40 L85,75 L70,55 Z" fill="url(#hatch-risk)" stroke="#fca5a5" strokeWidth="0.2" />
            {/* Ladera Occidental */}
            <path d="M15,30 L25,25 L35,50 L20,70 Z" fill="url(#hatch-risk)" stroke="#fca5a5" strokeWidth="0.2" />
          </g>
        )}

        {/* 4. Áreas de Expansión (Bordes) */}
        {activeLayers.expansion && (
          <g>
            {/* Pajarito / Robledo Expansion */}
            <path d="M10,25 L20,20 L25,35 L15,40 Z" fill="url(#dots-expansion)" stroke="#60a5fa" strokeWidth="0.2" />
            {/* San Antonio de Prado Expansion */}
            <path d="M25,80 L40,85 L35,92 L20,88 Z" fill="url(#dots-expansion)" stroke="#60a5fa" strokeWidth="0.2" />
          </g>
        )}

        {/* 5. Hidrografía (Río Medellín y Quebradas) */}
        {activeLayers.hidrografia && (
          <g>
            {/* Río Medellín (Sur-Norte) */}
            <path 
              d="M55,95 C50,70 58,50 48,25 S42,10 45,5" 
              fill="none" 
              stroke="#60a5fa" 
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Quebrada Santa Elena */}
            <path d="M80,45 Q65,50 53,40" fill="none" stroke="#93c5fd" strokeWidth="0.6" strokeDasharray="1,0.5" />
            {/* Quebrada La Iguaná */}
            <path d="M20,40 Q35,45 49,35" fill="none" stroke="#93c5fd" strokeWidth="0.6" strokeDasharray="1,0.5" />
          </g>
        )}

        {/* 6. Polígonos de Tratamiento (Data Points) */}
        {activeLayers.poligonos && data.map((zone) => {
          const color = getColor(zone.id);
          const status = zoneStatuses.get(zone.id);
          const isHovered = hoveredZone?.id === zone.id;
          
          return (
            <g 
              key={zone.id} 
              onMouseEnter={() => setHoveredZone(zone)}
              onMouseLeave={() => setHoveredZone(null)}
              className="cursor-pointer pointer-events-auto"
              style={{ transition: 'all 0.3s ease' }}
            >
              {/* Radius / Area of influence */}
              <circle
                cx={zone.coordinates.x}
                cy={zone.coordinates.y}
                r={isHovered ? 4 : 3}
                fill={color}
                opacity="0.15"
                stroke={color}
                strokeWidth="0.1"
              />

              {/* Core Marker */}
              <circle
                cx={zone.coordinates.x}
                cy={zone.coordinates.y}
                r={isHovered ? 1.8 : 1.2}
                fill={color}
                stroke="white"
                strokeWidth="0.5"
                opacity="0.9"
                className="transition-all duration-300"
              />
              
              {/* Center Dot */}
              <circle
                cx={zone.coordinates.x}
                cy={zone.coordinates.y}
                r={0.4}
                fill="white"
                opacity="0.8"
              />
            </g>
          );
        })}
      </svg>

      {/* 2. Map Controls (Right Side) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-white border border-slate-300 rounded-md shadow-sm flex flex-col overflow-hidden">
          <button className="p-2 hover:bg-slate-50 border-b border-slate-200 text-slate-600 transition-colors" title="Acercar">
            <Plus className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-slate-50 border-b border-slate-200 text-slate-600 transition-colors" title="Alejar">
            <Minus className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-slate-50 text-slate-600 transition-colors" title="Ver Todo">
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white border border-slate-300 rounded-md shadow-sm p-2 cursor-pointer hover:bg-slate-50 text-slate-600" title="Identificar">
          <MousePointer2 className="w-5 h-5" />
        </div>
        
        <div className="bg-white border border-slate-300 rounded-md shadow-sm p-2 cursor-pointer hover:bg-slate-50 text-slate-600" title="Imprimir">
          <Printer className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Legend (Bottom Left) */}
      <div className="absolute bottom-10 left-4 bg-white/95 backdrop-blur-sm border border-slate-300 p-3 rounded-md shadow-md shadow-slate-200/50">
         <h4 className="font-bold text-xs text-slate-800 mb-2 border-b border-slate-100 pb-1">Convenciones</h4>
         <div className="space-y-2 text-xs text-slate-600">
           {activeLayers.poligonos && (
             <>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm"></div>
                 <span>Bloqueo Normativo</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm"></div>
                 <span>Optimizado (Viable)</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm"></div>
                 <span>Alerta Gentrificación</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-300 border border-white shadow-sm"></div>
                 <span>Norma Vigente</span>
               </div>
             </>
           )}
           {activeLayers.riesgo && (
             <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
               <div className="w-3 h-3 bg-red-100 border border-red-300" style={{backgroundImage: 'linear-gradient(45deg, #fca5a5 25%, transparent 25%, transparent 50%, #fca5a5 50%, #fca5a5 75%, transparent 75%, transparent)', backgroundSize: '4px 4px'}}></div>
               <span>Amenaza Alta</span>
             </div>
           )}
           {activeLayers.expansion && (
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-blue-50 border border-blue-300 flex items-center justify-center">
                 <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
               </div>
               <span>Suelo de Expansión</span>
             </div>
           )}
         </div>
      </div>

      {/* 4. Scale Bar (Bottom Right) */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur border border-slate-300 px-3 py-1 text-[10px] text-slate-600 font-mono shadow-sm rounded pointer-events-none">
        <div>Escala 1:10,000</div>
        <div>EPSG:3116 | MAGNA-SIRGAS / Colombia Bogota</div>
      </div>

      {/* 5. Tooltip (Dynamic) */}
      {hoveredZone && activeLayers.poligonos && (
        <div 
          className="absolute z-50 pointer-events-none"
          style={{ 
            left: `${hoveredZone.coordinates.x}%`, 
            top: `${hoveredZone.coordinates.y}%`,
            transform: 'translate(10px, -50%)' 
          }}
        >
          <div className="bg-white border border-slate-300 text-slate-800 rounded shadow-xl text-xs w-56 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
               <span className="font-bold text-slate-700 truncate">{hoveredZone.name}</span>
            </div>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                 <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Alturas</span>
                    <span className="font-medium text-slate-800">{hoveredZone.currentHeight} Pisos</span>
                 </div>
                 <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Plan Parcial</span>
                    <span className={`font-medium ${hoveredZone.planParcialRequired ? 'text-red-600' : 'text-slate-500'}`}>
                        {hoveredZone.planParcialRequired ? 'Sí' : 'No'}
                    </span>
                 </div>
                 <div className="col-span-2 border-t border-slate-100 pt-1 mt-1">
                    <span className="block text-[10px] text-slate-400 uppercase">Valor Suelo</span>
                    <span className="font-mono text-slate-700">${(hoveredZone.landValue/1000000).toFixed(1)}M / m²</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};