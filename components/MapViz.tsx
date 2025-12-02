import React, { useState } from 'react';
import { UrbanZone, ZoneStatus } from '../types';

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
      case ZoneStatus.LOCKED: return '#ef4444'; // Red-500 (Bloqueado)
      case ZoneStatus.OPTIMIZED: return '#10b981'; // Emerald-500 (Optimizado)
      case ZoneStatus.AT_RISK: return '#f59e0b'; // Amber-500 (Riesgo)
      default: return '#3b82f6'; // Blue-500 (Viable)
    }
  };

  const handleMouseMove = (e: React.MouseEvent, zone: UrbanZone) => {
    // Calculate position relative to viewport
    setMousePos({
      x: e.clientX,
      y: e.clientY
    });
    setHoveredZone(zone);
  };

  return (
    <div className="w-full h-full bg-[#e2e8f0] relative overflow-hidden group">
      {/* Background Texture - Technical Map Style */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
            backgroundImage: `linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
        }}
      ></div>

      {/* SVG Map Container */}
      <svg 
        className="w-full h-full"
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
            <feOffset dx="0.5" dy="0.5" result="offsetblur"/>
            <feFlood floodColor="rgba(0,0,0,0.2)"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Aburrá Valley Silhouette - Abstract Geography */}
        <path 
          d="M5,5 Q50,-10 95,5 L90,95 Q50,110 10,95 Z" 
          fill="#cbd5e1" 
          stroke="#94a3b8"
          strokeWidth="0.5"
        />
        
        {/* River Medellín */}
        <path
          d="M30,95 Q48,55 52,45 T65,5"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />

        {/* Zones rendered as Technical Polygons */}
        {data.map((zone) => {
          const color = getColor(zone.id);
          const status = zoneStatuses.get(zone.id);
          const isOptimized = status === ZoneStatus.OPTIMIZED;
          const isHovered = hoveredZone?.id === zone.id;
          
          return (
            <g 
              key={zone.id} 
              onMouseEnter={(e) => handleMouseMove(e as any, zone)}
              onMouseLeave={() => setHoveredZone(null)}
              className="cursor-pointer"
            >
              {/* Simulation of a polygon shape around the point */}
              <circle
                cx={zone.coordinates.x}
                cy={zone.coordinates.y}
                r={isOptimized ? 3.5 : 2.5}
                fill={color}
                fillOpacity={isOptimized ? 0.3 : 0.2}
                stroke={color}
                strokeWidth={0.1}
              />
              
              {/* Core Centroid */}
              <circle
                cx={zone.coordinates.x}
                cy={zone.coordinates.y}
                r={isHovered ? 1.2 : 0.8}
                fill={color}
                stroke="white"
                strokeWidth="0.2"
                filter="url(#shadow)"
                className="transition-all duration-300"
              />
            </g>
          );
        })}
      </svg>

      {/* Map Scale & Info (Bottom Right) */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur border border-slate-300 px-3 py-1 text-[10px] text-slate-600 font-mono shadow-sm rounded pointer-events-none">
        <div>Escala 1:10,000</div>
        <div>EPSG:3116 | MAGNA-SIRGAS / Colombia Bogota</div>
      </div>

      {/* Floating Tooltip - GIS Identify Style */}
      {hoveredZone && (
        <div 
          className="fixed z-[100] pointer-events-none transform translate-x-4 -translate-y-4"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="bg-white border border-slate-300 text-slate-800 p-0 rounded shadow-xl text-xs w-64 overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
               <span className="font-bold text-slate-700">{hoveredZone.name}</span>
               <span className="font-mono text-[10px] text-slate-500">{hoveredZone.id}</span>
            </div>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                 <div>
                    <span className="block text-[10px] text-slate-500">Norma Actual</span>
                    <span className="font-medium">{hoveredZone.currentHeight} Pisos</span>
                 </div>
                 <div>
                    <span className="block text-[10px] text-slate-500">Plan Parcial</span>
                    <span className={`font-medium ${hoveredZone.planParcialRequired ? 'text-red-600' : 'text-slate-700'}`}>
                        {hoveredZone.planParcialRequired ? 'Requerido' : 'No Aplica'}
                    </span>
                 </div>
                 <div>
                    <span className="block text-[10px] text-slate-500">Valor Suelo / m²</span>
                    <span className="font-mono">${(hoveredZone.landValue/1000000).toFixed(1)}M</span>
                 </div>
                 <div>
                    <span className="block text-[10px] text-slate-500">Índice Airbnb</span>
                    <span className="font-mono">{hoveredZone.touristPressure.toFixed(0)} / 100</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};