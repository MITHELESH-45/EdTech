import React, { useEffect } from 'react';
import { DashboardLayout } from '../components/iot-simulation/DashboardLayout';
import { Header } from '../components/iot-simulation/Header';
import { SensorSidebar } from '../components/iot-simulation/SensorSidebar';
import { KitVisualization } from '../components/iot-simulation/KitVisualization';
import { SensorDetailsPanel } from '../components/iot-simulation/SensorDetailsPanel';
import { useSensorStore } from '../components/iot-simulation/store';

export default function IoTSimulatorPage() {
  const updateSensorValues = useSensorStore(state => state.updateSensorValues);

  useEffect(() => {
    const interval = setInterval(() => {
      updateSensorValues();
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [updateSensorValues]);

  return (
    <DashboardLayout>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SensorSidebar />
        <main className="flex-1 relative overflow-hidden bg-neutral-950 p-6 flex items-center justify-center">
          <KitVisualization />
        </main>
        <SensorDetailsPanel />
      </div>
    </DashboardLayout>
  );
}
