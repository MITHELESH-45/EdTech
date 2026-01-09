import React, { useEffect } from 'react';
import mqtt from 'mqtt';
import { DashboardLayout } from '../components/iot-simulation/DashboardLayout';
import { SensorSidebar } from '../components/iot-simulation/SensorSidebar';
import { KitVisualization } from '../components/iot-simulation/KitVisualization';
import { SensorDetailsPanel } from '../components/iot-simulation/SensorDetailsPanel';
import { useSensorStore } from '../components/iot-simulation/store';

export default function IoTSimulatorPage() {
  const updateSensorValues = useSensorStore(state => state.updateSensorValues);
  const updateAllSensorsFromMQTT = useSensorStore(state => state.updateAllSensorsFromMQTT);
  const setMqttConnected = useSensorStore(state => state.setMqttConnected);
  const setSensorStatus = useSensorStore(state => state.setSensorStatus);

  useEffect(() => {
    // MQTT Connection Configuration
    const brokerUrl = "wss://broker.hivemq.com:8884/mqtt";
    const topic = "esp32/multisensor/data";
    
    const options = {
      clientId: "webclient_" + Math.random().toString(16).substr(2, 8),
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000
    };

    const client = mqtt.connect(brokerUrl, options);

    client.on("connect", function() {
      console.log("MQTT Connected");
      setMqttConnected(true);
      client.subscribe(topic);
    });

    client.on("message", function(topic, message) {
      try {
        const data = JSON.parse(message.toString());
        console.log("MQTT Data:", data);

        // Update all sensors from MQTT payload
        updateAllSensorsFromMQTT({
          status: data.status,
          temperature: data.temperature,
          humidity: data.humidity,
          distance_cm: data.distance_cm,
          touch_count: data.touch_count,
          servo_angle: data.servo_angle,
          ir_sensor: data.ir_sensor,
          ldr: data.ldr
        });
      } catch (error) {
        console.error("Error parsing MQTT message:", error);
      }
    });

    client.on("error", function(error) {
      console.error("MQTT Error:", error);
      setMqttConnected(false);
    });

    client.on("offline", function() {
      console.log("MQTT Offline");
      setMqttConnected(false);
    });

    client.on("reconnect", function() {
      console.log("MQTT Reconnecting...");
      setMqttConnected(false);
    });

    // Update sensors that don't have MQTT data (fallback simulation)
    const interval = setInterval(() => {
      updateSensorValues();
    }, 1000);

    return () => {
      client.end();
      clearInterval(interval);
      setMqttConnected(false);
      setSensorStatus(null);
    };
  }, [updateSensorValues, updateAllSensorsFromMQTT, setMqttConnected, setSensorStatus]);

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
