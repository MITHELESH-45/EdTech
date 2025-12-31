import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SensorData } from './store';
import { useTheme } from '@/components/theme-provider';

interface VirtualLCDProps {
  sensor: SensorData | undefined;
}

export const VirtualLCD: React.FC<VirtualLCDProps> = ({ sensor }) => {
  const { theme, systemTheme } = useTheme();
  
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  // LCD Styles based on theme
  const frameClass = isDark 
    ? "bg-zinc-800 border-zinc-700" 
    : "bg-[#9ea7bb] border-[#5f6a85]";
    
  const screenClass = isDark
    ? "bg-black text-green-500 shadow-[inset_0_0_20px_rgba(0,255,0,0.1)]"
    : "bg-[#78886e] text-[#1a1f16] shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]";

  const dividerClass = isDark
    ? "border-green-500/30"
    : "border-[#65735b]";

  return (
    <div className={`relative w-64 h-32 rounded-md p-1 shadow-inner border-4 transition-colors duration-300 ${frameClass}`}>
      <div className={`w-full h-full p-3 font-mono text-sm leading-relaxed overflow-hidden relative transition-colors duration-300 ${screenClass}`}>
        {/* LCD Grid Effect - Overlay that simulates pixels/scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,6px_100%]" />
        
        <div className="relative z-20 opacity-90 font-bold h-full">
          <AnimatePresence mode="wait">
            {sensor ? (
              <motion.div
                key={sensor.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                <div className={`flex justify-between border-b pb-1 mb-1 ${dividerClass}`}>
                  <span>SENSOR:</span>
                  <span>{sensor.type.toUpperCase().substring(0, 8)}</span>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-2xl">{sensor.value}</span>
                  <span className="mb-1">{sensor.unit}</span>
                </div>
                <div className="mt-auto text-xs uppercase flex justify-between">
                  <span>STATUS:</span>
                  <span className={
                    sensor.status === 'critical' ? 'animate-pulse font-black' : ''
                  }>{sensor.status}</span>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="animate-pulse">SYSTEM READY...</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
