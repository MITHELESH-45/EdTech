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
  const clearSensorValues = useSensorStore(state => state.clearSensorValues);

  // Sensor timeout constant (5 seconds)
  const SENSOR_TIMEOUT = 5000;

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
      // Only process messages from the correct topic
      if (topic !== "esp32/multisensor/data") return;

      try {
        const data = JSON.parse(message.toString());
        console.log("MQTT Data:", data);

        // Update all sensors from MQTT payload (this also updates lastMessageTime)
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

    // Watchdog: Check for sensor timeout and clear values if no message received
    // Access store state directly inside the interval to get latest values
    const watchdogInterval = setInterval(() => {
      const state = useSensorStore.getState();
      const currentTime = Date.now();
      const timeSinceLastMessage = currentTime - state.lastMessageTime;
      
      // If MQTT is connected but no message received for timeout period, clear values
      if (state.mqttConnected && state.lastMessageTime > 0 && timeSinceLastMessage > SENSOR_TIMEOUT) {
        console.log("Sensor timeout - clearing values");
        clearSensorValues();
        setSensorStatus('FAIL');
      }
    }, 1000);

    // Simulation mode: Only run when MQTT is NOT connected
    // This allows demo/simulation when MQTT is unavailable
    const simulationInterval = setInterval(() => {
      const state = useSensorStore.getState();
      if (!state.mqttConnected) {
        updateSensorValues();
      }
    }, 1000);

    return () => {
      client.end();
      clearInterval(watchdogInterval);
      clearInterval(simulationInterval);
      setMqttConnected(false);
      setSensorStatus(null);
    };
  }, [updateSensorValues, updateAllSensorsFromMQTT, setMqttConnected, setSensorStatus, clearSensorValues]);

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
