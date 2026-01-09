import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Sun, Activity, Zap, RotateCw, AlertCircle } from 'lucide-react';
import { SensorData, SensorType } from './store';
import { cn } from '@/lib/utils';

interface SensorCardProps {
  sensor: SensorData;
  isActive: boolean;
  onClick: () => void;
}

const getSensorIcon = (type: SensorType) => {
  switch (type) {
    case 'DHT Sensor': return Thermometer;
    case 'Touch Sensor': return Zap;
    case 'Ultrasonic Sensor': return Activity;
    case 'IR Sensor': return Activity;
    case 'LDR Sensor': return Sun;
    case 'Servo Motor': return RotateCw;
    default: return AlertCircle;
  }
};

const getStatusColor = (status: SensorData['status']) => {
  switch (status) {
    case 'normal': return 'bg-emerald-500 text-emerald-500 border-emerald-500/20';
    case 'warning': return 'bg-amber-500 text-amber-500 border-amber-500/20';
    case 'critical': return 'bg-red-500 text-red-500 border-red-500/20';
  }
};

export const SensorCard: React.FC<SensorCardProps> = ({ sensor, isActive, onClick }) => {
  const Icon = getSensorIcon(sensor.type);
  const statusColor = getStatusColor(sensor.status);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border transition-all cursor-pointer overflow-hidden group",
        isActive 
          ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
          : "bg-card border-border hover:border-foreground/20"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn("p-2 rounded-lg bg-opacity-10", statusColor.replace('text-', 'bg-').replace('border-', ''))}>
          <Icon className={cn("w-5 h-5", statusColor.split(' ')[1])} />
        </div>
        <div className={cn("w-2 h-2 rounded-full", statusColor.split(' ')[0])} />
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-0.5">{sensor.name}</h3>
        <div className="flex items-baseline gap-1 flex-wrap">
          {/* DHT Sensor: Display both temperature and humidity */}
          {sensor.type === 'DHT Sensor' ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">{sensor.value}</span>
                <span className="text-xs text-muted-foreground font-medium">{sensor.unit}</span>
              </div>
              <span className="text-muted-foreground mx-1">/</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">{sensor.secondaryValue || 0}</span>
                <span className="text-xs text-muted-foreground font-medium">{sensor.secondaryUnit}</span>
              </div>
            </>
          ) : sensor.type === 'IR Sensor' ? (
            // IR Sensor: Display detection status
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">
                {sensor.value === 1 ? 'Detected' : 'No Detection'}
              </span>
              <span className={cn(
                "w-2 h-2 rounded-full",
                sensor.value === 1 ? "bg-red-500" : "bg-gray-400"
              )} />
            </div>
          ) : sensor.type === 'Touch Sensor' ? (
            // Touch Sensor: Display count value
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{sensor.value}</span>
              <span className="text-xs text-muted-foreground font-medium">{sensor.unit}</span>
            </div>
          ) : sensor.type === 'Servo Motor' ? (
            // Servo Motor: Display angle
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{sensor.value}</span>
              <span className="text-xs text-muted-foreground font-medium">{sensor.unit}</span>
            </div>
          ) : (
            // Other sensors: Display value and unit
            <>
              <span className="text-xl font-bold text-foreground">{sensor.value}</span>
              <span className="text-xs text-muted-foreground font-medium">{sensor.unit}</span>
            </>
          )}
        </div>
      </div>

      {isActive && (
        <motion.div 
          layoutId="active-glow"
          className="absolute inset-0 rounded-xl bg-blue-500/5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
};
