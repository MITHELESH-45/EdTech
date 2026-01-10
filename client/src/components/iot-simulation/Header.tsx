import React, { useEffect, useState } from 'react';
import { Wifi, Clock, Activity } from 'lucide-react';
import { useSensorStore } from './store';

export const Header: React.FC = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const isSimulating = useSensorStore(state => state.isSimulating);
  const mqttConnected = useSensorStore(state => state.mqttConnected);
  const sensorStatus = useSensorStore(state => state.sensorStatus);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Activity className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            IoT Simulator Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">Real-Time Virtual Sensor Monitoring</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        {/* MQTT Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          mqttConnected 
            ? 'bg-emerald-500/10 border-emerald-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className={`w-2 h-2 rounded-full ${mqttConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={`text-xs font-medium ${mqttConnected ? 'text-emerald-500' : 'text-red-500'}`}>
            {mqttConnected ? '✅ Connected to MQTT' : '❌ MQTT Error'}
          </span>
        </div>

        {/* Sensor Status */}
        {sensorStatus && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            sensorStatus === 'OK'
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <span className={`text-xs font-medium ${
              sensorStatus === 'OK' ? 'text-emerald-500' : 'text-red-500'
            }`}>
              {sensorStatus === 'OK' ? 'SENSOR OK' : 'SENSOR FAIL'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-medium text-emerald-500">
            {isSimulating ? 'System Online' : 'System Paused'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{time}</span>
        </div>
        
        <Wifi className={`w-5 h-5 ${mqttConnected ? 'text-emerald-500' : 'text-red-500'}`} />
      </div>
    </header>
  );
};
