import React, { useEffect } from 'react';
import mqtt from 'mqtt';
import { DashboardLayout } from '../components/iot-simulation/DashboardLayout';
import { SensorSidebar } from '../components/iot-simulation/SensorSidebar';
import { KitVisualization } from '../components/iot-simulation/KitVisualization';
import { SensorDetailsPanel } from '../components/iot-simulation/SensorDetailsPanel';
import { useSensorStore } from '../components/iot-simulation/store';

export default function IoTSimulatorPage() {
  const updateSensorValues = useSensorStore(state => state.updateSensorValues);
  const updateTemperatureFromMQTT = useSensorStore(state => state.updateTemperatureFromMQTT);
  const updateUltrasonicDistanceFromMQTT = useSensorStore(state => state.updateUltrasonicDistanceFromMQTT);

  useEffect(() => {
    // MQTT Connection for Temperature and Ultrasonic Distance Sensors
    const brokerUrl = "wss://broker.hivemq.com:8884/mqtt";
    const options = {
      clientId: "webclient_" + Math.random().toString(16).substr(2, 8),
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 1000
    };

    const client = mqtt.connect(brokerUrl, options);

    client.on("connect", function() {
      console.log("MQTT Connected");
      // Subscribe only to esp32/dht/temperature (same topic provides both temperature and distance)
      client.subscribe("esp32/dht/temperature");
    });

    client.on("message", function(topic, message) {
      try {
        const data = JSON.parse(message.toString());
        console.log(data);

        // Handle both temperature and distance from the same message (like HTML code)
        if (data.status === "fail") {
          // Sensor read failed - don't update values
          return;
        }

        // Update temperature if present
        if (data.temperature !== undefined && typeof data.temperature === 'number') {
          updateTemperatureFromMQTT(data.temperature);
        }

        // Update distance if present
        if (data.distance_cm !== undefined && typeof data.distance_cm === 'number') {
          updateUltrasonicDistanceFromMQTT(data.distance_cm);
        }
      } catch (error) {
        console.error("Error parsing MQTT message:", error);
      }
    });

    client.on("error", function(error) {
      console.log("MQTT Error:", error);
    });

    // Update other sensors (not Temperature, not Ultrasonic Distance) every second
    const interval = setInterval(() => {
      updateSensorValues();
    }, 1000);

    return () => {
      client.end();
      clearInterval(interval);
    };
  }, [updateSensorValues, updateTemperatureFromMQTT, updateUltrasonicDistanceFromMQTT]);

  return (
    <DashboardLayout>
      <div className="flex h-full overflow-hidden">
        <SensorSidebar />
        <main className="flex-1 relative overflow-hidden bg-neutral-950 p-8 flex items-center justify-center min-w-0">
          <KitVisualization />
        </main>
        <SensorDetailsPanel />
      </div>
    </DashboardLayout>
  );
}
