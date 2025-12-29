import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Wind, Sun, Gauge, Activity, Mic, Move, AlertCircle } from 'lucide-react';
import { SensorData, SensorType } from './store';
import { cn } from '@/lib/utils';

interface SensorCardProps {
  sensor: SensorData;
  isActive: boolean;
  onClick: () => void;
}

const getSensorIcon = (type: SensorType) => {
  switch (type) {
    case 'Temperature': return Thermometer;
    case 'Humidity Sensor': return Droplets;
    case 'Gas': return Wind;
    case 'Light': return Sun;
    case 'Pressure': return Gauge;
    case 'Motion': return Move;
    case 'Sound': return Mic;
    case 'Proximity': return Activity;
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
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-foreground">{sensor.value}</span>
          <span className="text-xs text-muted-foreground font-medium">{sensor.unit}</span>
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
