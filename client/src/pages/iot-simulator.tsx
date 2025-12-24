import React, { useEffect } from 'react';
import mqtt from 'mqtt';
import { DashboardLayout } from '../components/iot-simulation/DashboardLayout';
import { Header } from '../components/iot-simulation/Header';
import { SensorSidebar } from '../components/iot-simulation/SensorSidebar';
import { KitVisualization } from '../components/iot-simulation/KitVisualization';
import { SensorDetailsPanel } from '../components/iot-simulation/SensorDetailsPanel';
import { useSensorStore } from '../components/iot-simulation/store';

export default function IoTSimulatorPage() {
  const updateSensorValues = useSensorStore(state => state.updateSensorValues);
  const updateTemperatureFromMQTT = useSensorStore(state => state.updateTemperatureFromMQTT);

  useEffect(() => {
    // MQTT Connection for Temperature Sensor
    const brokerUrl = "wss://broker.hivemq.com:8884/mqtt";
    const options = {
      clientId: "webclient_" + Math.random().toString(16).substr(2, 8),
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000
    };

    const client = mqtt.connect(brokerUrl, options);

    client.on("connect", function() {
      console.log("MQTT Connected");
      client.subscribe("esp32/dht/temperature");
    });

    client.on("message", function(topic, message) {
      try {
        const data = JSON.parse(message.toString());
        console.log(data);

        if (data.status === "ok" && typeof data.temperature === 'number') {
          // Update ONLY the Temperature sensor value
          updateTemperatureFromMQTT(data.temperature);
        }
      } catch (error) {
        console.error("Error parsing MQTT message:", error);
      }
    });

    client.on("error", function(error) {
      console.log("MQTT Error:", error);
    });

    // Update other sensors (not Temperature) every second
    const interval = setInterval(() => {
      updateSensorValues();
    }, 1000);

    return () => {
      client.end();
      clearInterval(interval);
    };
  }, [updateSensorValues, updateTemperatureFromMQTT]);

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
