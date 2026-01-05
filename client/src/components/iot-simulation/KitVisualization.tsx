import React from 'react';
import { motion } from 'framer-motion';
import { useSensorStore } from './store';
import { VirtualLCD } from './VirtualLCD';
import { Cpu } from 'lucide-react';

export const KitVisualization: React.FC = () => {
  const { sensors, selectedSensorId, selectSensor } = useSensorStore();
  const selectedSensor = sensors.find(s => s.id === selectedSensorId);

  // Positions for 8 sensors in a circle/layout around the board
  // We can calculate this dynamically or hardcode for better layout control
  // Let's place them in a semi-circle or rectangular layout
  const sensorPositions = [
    { x: '10%', y: '10%' },
    { x: '35%', y: '5%' },
    { x: '65%', y: '5%' },
    { x: '90%', y: '10%' },
    { x: '90%', y: '90%' },
    { x: '65%', y: '95%' },
    { x: '35%', y: '95%' },
    { x: '10%', y: '90%' },
  ];

  return (
    <div className="relative w-full h-full bg-card/20 rounded-3xl border border-border p-8 overflow-visible flex items-center justify-center transition-colors duration-300">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Microcontroller Board */}
      <div className="relative z-10 w-96 h-64 bg-emerald-900/90 dark:bg-emerald-900/80 rounded-xl border-2 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] backdrop-blur-sm flex flex-col items-center p-4">
        {/* Board Details */}
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-neutral-400" />
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-neutral-400" />
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-neutral-400" />
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-neutral-400" />
        
        <div className="flex items-center gap-2 mb-4 w-full">
          <Cpu className="w-8 h-8 text-emerald-400" />
          <div className="flex-1 h-0.5 bg-emerald-500/20" />
          <div className="text-[10px] font-mono text-emerald-500/50">IOT-CONTROLLER-V1</div>
        </div>

        <VirtualLCD sensor={selectedSensor} />

        <div className="mt-auto w-full flex justify-between px-4">
           {/* Fake Pins */}
           {[...Array(12)].map((_, i) => (
             <div key={i} className="w-1.5 h-3 bg-yellow-600 rounded-sm" />
           ))}
        </div>
      </div>

      {/* Sensor Nodes & Connections */}
      {sensors.map((sensor, index) => {
        const isActive = selectedSensorId === sensor.id;
        const pos = sensorPositions[index];
        // Check if sensor is at the bottom (y >= 50%)
        const isBottomSensor = parseFloat(pos.y) >= 50;
        
        // Check if this is one of the bottom sensors that needs to be moved up slightly (Ultrasonic, Sound, PIR, Barometer)
        const needsMoveUp = sensor.type === 'Proximity' || // Ultrasonic
                           sensor.type === 'Sound' ||
                           sensor.type === 'Motion' || // PIR
                           sensor.type === 'Pressure'; // Barometer
        
        // Calculate top position - move up slightly (1cm) if needed
        const topPosition = needsMoveUp 
          ? `calc(${pos.y} - 1cm)`
          : pos.y;
        
        return (
          <React.Fragment key={sensor.id}>
             {/* Sensor Node */}
             <motion.button
               className={`absolute w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all z-20
                 ${isActive 
                   ? 'bg-background border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110' 
                   : 'bg-card/80 border-border hover:border-foreground/50'
                 }`}
               style={{ left: pos.x, top: topPosition, transform: 'translate(-50%, -50%)' }}
               onClick={() => selectSensor(sensor.id)}
               whileHover={{ scale: 1.1 }}
             >
                <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-blue-500 animate-pulse' : 'bg-neutral-600 dark:bg-neutral-400'}`} />
                <span className={`absolute text-xs font-mono text-muted-foreground whitespace-nowrap bg-popover/80 px-2 py-0.5 rounded shadow-sm backdrop-blur-sm ${
                  isBottomSensor ? '-top-6' : '-bottom-6'
                }`}>
                  {sensor.name.split(' ')[0]}
                </span>
             </motion.button>
          </React.Fragment>
        );
      })}
      
      {/* Animated Data Particles (Decoration) */}
      <div className="absolute inset-0 pointer-events-none">
        {selectedSensorId && (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-[400px] h-[400px] border border-blue-500/5 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
             <div className="w-[300px] h-[300px] border border-blue-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
           </div>
        )}
      </div>

    </div>
  );
};
