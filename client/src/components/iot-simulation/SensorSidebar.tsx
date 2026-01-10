import React from 'react';
import { useSensorStore } from './store';
import { SensorCard } from './SensorCard';
import { ScrollArea } from '@/components/ui/scroll-area';

export const SensorSidebar: React.FC = () => {
  const { sensors, selectedSensorId, selectSensor } = useSensorStore();

  return (
    <div className="w-80 border-r border-border bg-card/30 flex flex-col h-full min-h-0 transition-colors duration-300">
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Connected Sensors</h2>
      </div>
      
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-3">
          {sensors.map((sensor) => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              isActive={selectedSensorId === sensor.id}
              onClick={() => selectSensor(sensor.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
