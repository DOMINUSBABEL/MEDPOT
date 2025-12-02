import React from 'react';
import { SimulationResult } from '../types';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface MetricsPanelProps {
  simulationResult: SimulationResult;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ simulationResult }) => {
  return (
    <div className="flex flex-col">
      {/* Metric Row 1 */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Vivienda Nueva</p>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              +{simulationResult.unlockedUnits.toLocaleString()}
              {simulationResult.unlockedUnits > 0 && (
                <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">+18%</span>
              )}
            </h3>
          </div>
        </div>
        {/* Mini Sparkline Simulation */}
        <div className="flex items-end gap-1 h-8 w-16 opacity-50">
           <div className="w-2 bg-emerald-500 h-[20%] rounded-t-sm"></div>
           <div className="w-2 bg-emerald-500 h-[40%] rounded-t-sm"></div>
           <div className="w-2 bg-emerald-500 h-[30%] rounded-t-sm"></div>
           <div className="w-2 bg-emerald-500 h-[80%] rounded-t-sm"></div>
           <div className="w-2 bg-emerald-500 h-[100%] rounded-t-sm"></div>
        </div>
      </div>

      {/* Metric Row 2 */}
      <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 p-2 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Riesgo Gentrificación</p>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {simulationResult.gentrificationRisk.toFixed(1)}%
              <span className="text-xs font-normal text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">Alto</span>
            </h3>
          </div>
        </div>
         {/* Mini Sparkline Simulation */}
         <div className="flex items-end gap-1 h-8 w-16 opacity-50">
           <div className="w-2 bg-red-500 h-[40%] rounded-t-sm"></div>
           <div className="w-2 bg-red-500 h-[50%] rounded-t-sm"></div>
           <div className="w-2 bg-red-500 h-[60%] rounded-t-sm"></div>
           <div className="w-2 bg-red-500 h-[80%] rounded-t-sm"></div>
           <div className="w-2 bg-red-500 h-[90%] rounded-t-sm"></div>
        </div>
      </div>
    </div>
  );
};