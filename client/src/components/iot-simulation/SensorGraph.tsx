import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SensorData } from './store';
import { useTheme } from '@/components/theme-provider';

interface SensorGraphProps {
  sensor: SensorData;
}

export const SensorGraph: React.FC<SensorGraphProps> = ({ sensor }) => {
  const { theme, systemTheme } = useTheme();
  
  // Resolve effective theme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  const data = sensor.history.map((point) => ({
    time: point.time,
    value: point.value,
  }));

  // Calculate domain with some padding
  const min = Math.min(...data.map(d => d.value), sensor.min);
  const max = Math.max(...data.map(d => d.value), sensor.max);
  const padding = (max - min) * 0.1;

  // Chart colors
  const gridColor = isDark ? "#333" : "#e5e7eb"; 
  const axisColor = isDark ? "#666" : "#9ca3af";
  const tooltipBg = isDark ? "#171717" : "#ffffff";
  const tooltipBorder = isDark ? "#333" : "#e5e7eb";
  const tooltipText = isDark ? "#fff" : "#09090b";

  return (
    <div className="w-full h-64 bg-card/50 rounded-xl border border-border p-4 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Real-Time Data</h3>
        <div className="flex gap-2">
           <button className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-500 border border-blue-500/30">Live</button>
           <button className="px-2 py-1 text-xs rounded hover:bg-muted text-muted-foreground">1H</button>
           <button className="px-2 py-1 text-xs rounded hover:bg-muted text-muted-foreground">24H</button>
        </div>
      </div>
      
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke={axisColor}
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke={axisColor}
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              domain={[min - padding, max + padding]}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '8px' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              isAnimationActive={false} // Disable animation for smoother real-time updates
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
