import React from 'react';
import { useSensorStore } from './store';
import { SensorGraph } from './SensorGraph';
import { StatusBadge } from './StatusBadge';
import { Info, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SensorDetailsPanel: React.FC = () => {
  const { sensors, selectedSensorId } = useSensorStore();
  const sensor = sensors.find(s => s.id === selectedSensorId);

  if (!sensor) return null;

  return (
    <div className="w-96 border-l border-border bg-card/30 flex flex-col h-full min-h-0 p-6 overflow-y-auto transition-colors duration-300">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
           <h2 className="text-2xl font-bold text-foreground">{sensor.name}</h2>
           <StatusBadge status={sensor.status} />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {sensor.description}
        </p>
      </div>

      <div className={cn(
        "grid gap-4 mb-8",
        sensor.type === 'DHT Sensor' ? "grid-cols-2" : "grid-cols-2"
      )}>
        {/* For DHT Sensor: Show Temperature and Humidity in separate cards */}
        {sensor.type === 'DHT Sensor' ? (
          <>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="text-muted-foreground text-xs font-medium mb-1 uppercase">Temperature</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{sensor.value}</span>
                <span className="text-sm text-muted-foreground">{sensor.unit}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="text-muted-foreground text-xs font-medium mb-1 uppercase">Humidity</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{sensor.secondaryValue ?? '--'}</span>
                <span className="text-sm text-muted-foreground">{sensor.secondaryUnit}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="text-muted-foreground text-xs font-medium mb-1 uppercase">Current Value</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{sensor.value}</span>
                <span className="text-sm text-muted-foreground">{sensor.unit}</span>
              </div>
              {sensor.type === 'IR Sensor' && (
                <div className="mt-2">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                    sensor.value === 1 ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-500"
                  )}>
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      sensor.value === 1 ? "bg-red-500" : "bg-gray-400"
                    )} />
                    {sensor.value === 1 ? 'Object Detected' : 'No Object'}
                  </div>
                </div>
              )}
              {sensor.type === 'Touch Sensor' && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Touch count: {sensor.value}
                </div>
              )}
              {sensor.type === 'Servo Motor' && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Current angle: {sensor.value}°
                </div>
              )}
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="text-muted-foreground text-xs font-medium mb-1 uppercase">Operating Range</div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">{sensor.min} - {sensor.max}</span>
                <span className="text-xs text-muted-foreground">{sensor.unit}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="space-y-4 mb-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
           <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border">
             <div className="p-2 rounded bg-blue-500/10 text-blue-500"><TrendingUp size={16} /></div>
             <div>
               <div className="text-xs text-muted-foreground">Max (24h)</div>
               <div className="font-mono text-sm">{sensor.max} {sensor.unit}</div>
             </div>
           </div>
           <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border">
             <div className="p-2 rounded bg-indigo-500/10 text-indigo-500"><TrendingDown size={16} /></div>
             <div>
               <div className="text-xs text-muted-foreground">Min (24h)</div>
               <div className="font-mono text-sm">{sensor.min} {sensor.unit}</div>
             </div>
           </div>
           <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border col-span-2">
             <div className="p-2 rounded bg-muted text-muted-foreground"><Clock size={16} /></div>
             <div>
               <div className="text-xs text-muted-foreground">Last Updated</div>
               <div className="font-mono text-sm">{new Date().toLocaleTimeString()}</div>
             </div>
           </div>
        </div>
      </div>

      <div className="mt-auto">
        <SensorGraph sensor={sensor} />
      </div>
    </div>
  );
};
