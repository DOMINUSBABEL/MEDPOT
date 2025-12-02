import React, { useState } from 'react';
import { UrbanZone, ZoneStatus } from '../types';
import { Plus, Minus, Maximize, MousePointer2, Printer } from 'lucide-react';

interface MapVizProps {
  data: UrbanZone[];
  zoneStatuses: Map<string, ZoneStatus>;
}

export const MapViz: React.FC<MapVizProps> = ({ data, zoneStatuses }) => {
  const [hoveredZone, setHoveredZone] = useState<UrbanZone | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const getColor = (zoneId: string) => {
    const status = zoneStatuses.get(zoneId);
    switch (status) {
      case ZoneStatus.LOCKED: return '#ef4444'; // Red (Bloqueado)
      case ZoneStatus.OPTIMIZED: return '#10b981'; // Emerald (Optimizado)
      case ZoneStatus.AT_RISK: return '#f59e0b'; // Amber (Riesgo)
      default: return '#93c5fd'; // Light Blue (Norma Vigente)
    }
  };

  const handleMouseMove = (e: React.MouseEvent, zone: UrbanZone) => {
    const rect = (e.target as Element).getBoundingClientRect();
    setMousePos({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 100 // Offset upward
    });
    setHoveredZone(zone);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#dfe6ed] group">
      {/* 1. Map Canvas (SVG) */}
      <svg 
        className="w-full h-full pointer-events-none md:pointer-events-auto"
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Aburrá Valley Geography (Stylized) */}
        {/* Mountains (Side slopes) */}
        <path d="M0,0 L30,0 L20,30 L0,50 Z" fill="#cbd5e1" opacity="0.3" />
        <path d="M70,0 L100,0 L100,60 L80,40 Z" fill="#cbd5e1" opacity="0.3" />
        <path d="M0,80 L20,100 L0,100 Z" fill="#cbd5e1" opacity="0.3" />
        
        {/* River Medellín (South to North) */}
        <path 
          d="M60,105 C55,80 58,60 50,45 S40,20 45,-5" 
          fill="none" 
          stroke="#93c5fd" 
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Main Highway (Regional) */}
        <path 
          d="M62,105 C57,80 60,60 52,45 S42,20 47,-5" 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Zones (Data Points) */}
        {data.map((zone) => {
          const color = getColor(zone.id);
          const status = zoneStatuses.get(zone.id);
          const isOptimized = status === ZoneStatus.OPTIMIZED;
          const isLocked = status === ZoneStatus.LOCKED;
          const isHovered = hoveredZone?.id === zone.id;
          
          return (
            <g 
              key={zone.id} 
              onMouseEnter={(e) => handleMouseMove(e as any, zone)}
              onMouseLeave={() => setHoveredZone(null)}
              className="cursor-pointer pointer-events-auto"
              style={{ transition: 'all 0.3s ease' }}
            >
              {/* Outer Glow for specific statuses */}
              {isOptimized && (
                <circle cx={zone.coordinates.x} cy={zone.coordinates.y} r={4} fill={color} opacity="0.2" className="animate-pulse" />
              )}
              {isLocked && (
                <circle cx={zone.coordinates.x} cy={zone.coordinates.y} r={3.5} fill={color} opacity="0.1" />
              )}

              {/* Main Zone Marker */}
              <circle
                cx={zone.coordinates.x}
                cy={zone.coordinates.y}
                r={isHovered ? 2 : 1.5}
                fill={color}
                stroke="white"
                strokeWidth="0.3"
                opacity="0.8"
                className="transition-all duration-300"
              />
              
              {/* Center Dot */}
              <circle
                cx={zone.coordinates.x}
                cy={zone.coordinates.y}
                r={0.4}
                fill="white"
                opacity="0.5"
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
      <div className="absolute bottom-10 left-4 bg-white/95 backdrop-blur-sm border border-slate-300 p-3 rounded-md shadow-md">
         <h4 className="font-bold text-xs text-slate-800 mb-2 border-b border-slate-100 pb-1">Convenciones</h4>
         <div className="space-y-2 text-xs text-slate-600">
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
         </div>
      </div>

      {/* 4. Scale Bar (Bottom Right) */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur border border-slate-300 px-3 py-1 text-[10px] text-slate-600 font-mono shadow-sm rounded pointer-events-none">
        <div>Escala 1:10,000</div>
        <div>EPSG:3116 | MAGNA-SIRGAS / Colombia Bogota</div>
      </div>

      {/* 5. Tooltip (Dynamic) */}
      {hoveredZone && (
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