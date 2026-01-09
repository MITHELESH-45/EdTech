import { create } from 'zustand';

export type SensorType = 
  | 'DHT Sensor' 
  | 'Touch Sensor'
  | 'Ultrasonic Sensor' 
  | 'IR Sensor' 
  | 'LDR Sensor' 
  | 'Servo Motor';

export interface SensorData {
  id: string;
  type: SensorType;
  name: string;
  value: number;
  secondaryValue?: number; // For DHT sensor (temperature and humidity)
  unit: string;
  secondaryUnit?: string; // For DHT sensor
  min: number;
  max: number;
  status: 'normal' | 'warning' | 'critical';
  history: { time: string; value: number }[];
  description: string;
}

interface SensorStore {
  sensors: SensorData[];
  selectedSensorId: string | null;
  isSimulating: boolean;
  mqttConnected: boolean;
  sensorStatus: 'OK' | 'FAIL' | null;
  lastMessageTime: number;
  
  // Actions
  selectSensor: (id: string) => void;
  updateSensorValues: () => void;
  updateTemperatureFromMQTT: (temperature: number) => void;
  updateUltrasonicDistanceFromMQTT: (distance: number) => void;
  updateAllSensorsFromMQTT: (data: {
    status?: string;
    temperature?: number;
    humidity?: number;
    distance_cm?: number;
    touch_count?: number;
    servo_angle?: number;
    ir_sensor?: boolean;
    ldr?: number;
  }) => void;
  clearSensorValues: () => void;
  setMqttConnected: (connected: boolean) => void;
  setSensorStatus: (status: 'OK' | 'FAIL' | null) => void;
  setLastMessageTime: (time: number) => void;
  toggleSimulation: () => void;
}

const INITIAL_SENSORS: SensorData[] = [
  {
    id: 's1',
    type: 'DHT Sensor',
    name: 'DHT11 Sensor',
    value: 24, // Temperature
    secondaryValue: 45, // Humidity
    unit: '°C',
    secondaryUnit: '%',
    min: -10,
    max: 50,
    status: 'normal',
    history: [],
    description: 'Measures temperature and humidity in the environment.'
  },
  {
    id: 's2',
    type: 'Touch Sensor',
    name: 'Touch Sensor',
    value: 0, // Count value
    unit: 'count',
    min: 0,
    max: 9999,
    status: 'normal',
    history: [],
    description: 'Detects touch events and displays count value.'
  },
  {
    id: 's3',
    type: 'Ultrasonic Sensor',
    name: 'Ultrasonic Sensor',
    value: 150, // Distance
    unit: 'cm',
    min: 2,
    max: 400,
    status: 'normal',
    history: [],
    description: 'Measures distance to an object using ultrasonic waves.'
  },
  {
    id: 's4',
    type: 'IR Sensor',
    name: 'IR Sensor',
    value: 0, // Detection status (0 = no detection, 1 = detected)
    unit: 'status',
    min: 0,
    max: 1,
    status: 'normal',
    history: [],
    description: 'Detects objects using infrared light.'
  },
  {
    id: 's5',
    type: 'LDR Sensor',
    name: 'LDR Light Sensor',
    value: 500, // Light level
    unit: 'lux',
    min: 0,
    max: 1000,
    status: 'normal',
    history: [],
    description: 'Measures light intensity using a Light Dependent Resistor.'
  },
  {
    id: 's6',
    type: 'Servo Motor',
    name: 'Servo Motor',
    value: 90, // Angle
    unit: '°',
    min: 0,
    max: 180,
    status: 'normal',
    history: [],
    description: 'Rotational actuator with position control. Displays current angle.'
  }
];

export const useSensorStore = create<SensorStore>((set) => ({
  sensors: INITIAL_SENSORS,
  selectedSensorId: INITIAL_SENSORS[0].id,
  isSimulating: true,
  mqttConnected: false,
  sensorStatus: null,
  lastMessageTime: 0,

  selectSensor: (id) => set({ selectedSensorId: id }),
  
  setMqttConnected: (connected) => set({ mqttConnected: connected }),
  
  setSensorStatus: (status) => set({ sensorStatus: status }),
  
  setLastMessageTime: (time) => set({ lastMessageTime: time }),

  updateSensorValues: () => set((state) => {
    if (!state.isSimulating) return state;

    const now = new Date().toLocaleTimeString();

    const newSensors: SensorData[] = state.sensors.map((sensor): SensorData => {
      let change = (Math.random() - 0.5) * 2; // Random change
      
      // Handle DHT Sensor (temperature and humidity)
      if (sensor.type === 'DHT Sensor') {
        const tempChange = (Math.random() - 0.5) * 1.5;
        const humChange = (Math.random() - 0.5) * 2;
        
        let newTemp = sensor.value + tempChange;
        let newHum = (sensor.secondaryValue || 0) + humChange;
        
        newTemp = Math.max(sensor.min, Math.min(sensor.max, newTemp));
        newHum = Math.max(0, Math.min(100, newHum));
        
        const range = sensor.max - sensor.min;
        const tempPercent = (newTemp - sensor.min) / range;
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        
        if (tempPercent < 0.1 || tempPercent > 0.9) status = 'critical';
        else if (tempPercent < 0.2 || tempPercent > 0.8) status = 'warning';
        
      return {
        ...sensor,
        value: Number(newTemp.toFixed(1)),
        secondaryValue: Number(newHum.toFixed(1)),
        status: status as 'normal' | 'warning' | 'critical',
        history: [...sensor.history, { time: now, value: newTemp }].slice(-20)
      };
      }
      
      // Handle Touch Sensor - skip random updates, only update from explicit input (MQTT)
      if (sensor.type === 'Touch Sensor') {
        // Keep current value, don't randomly increment
        return sensor;
      }
      
      // Handle IR Sensor (0 or 1 - detection status)
      if (sensor.type === 'IR Sensor') {
        const detected = Math.random() > 0.6 ? 1 : 0;
        return {
          ...sensor,
          value: detected,
          status: (detected === 1 ? 'warning' : 'normal') as 'normal' | 'warning' | 'critical',
          history: [...sensor.history, { time: now, value: detected }].slice(-20)
        };
      }
      
      // Handle Ultrasonic Sensor
      if (sensor.type === 'Ultrasonic Sensor') {
        change *= 5; // Larger changes for distance
        let newValue = sensor.value + change;
        newValue = Math.max(sensor.min, Math.min(sensor.max, newValue));
        
        const range = sensor.max - sensor.min;
        const percent = (newValue - sensor.min) / range;
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        
        if (percent < 0.1 || percent > 0.9) status = 'critical';
        else if (percent < 0.2 || percent > 0.8) status = 'warning';
        
        return {
          ...sensor,
          value: Number(newValue.toFixed(1)),
          status: status as 'normal' | 'warning' | 'critical',
          history: [...sensor.history, { time: now, value: newValue }].slice(-20)
        };
      }
      
      // Handle LDR Sensor
      if (sensor.type === 'LDR Sensor') {
        change *= 20;
        let newValue = sensor.value + change;
        newValue = Math.max(sensor.min, Math.min(sensor.max, newValue));
        
        const range = sensor.max - sensor.min;
        const percent = (newValue - sensor.min) / range;
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        
        if (percent < 0.1 || percent > 0.9) status = 'critical';
        else if (percent < 0.2 || percent > 0.8) status = 'warning';
        
        return {
          ...sensor,
          value: Number(newValue.toFixed(1)),
          status: status as 'normal' | 'warning' | 'critical',
          history: [...sensor.history, { time: now, value: newValue }].slice(-20)
        };
      }
      
      // Handle Servo Motor (angle)
      if (sensor.type === 'Servo Motor') {
        change *= 5; // Angle changes
        let newAngle = sensor.value + change;
        newAngle = Math.max(sensor.min, Math.min(sensor.max, newAngle));
        
        return {
          ...sensor,
          value: Number(newAngle.toFixed(0)),
          history: [...sensor.history, { time: now, value: newAngle }].slice(-20)
        };
      }

      return sensor;
    });

    return { sensors: newSensors };
  }),

  updateTemperatureFromMQTT: (temperature: number) => set((state) => {
    const now = new Date().toLocaleTimeString();
    
    const newSensors = state.sensors.map(sensor => {
      // Update DHT Sensor temperature value
      if (sensor.type === 'DHT Sensor') {
        const clampedValue = Math.max(sensor.min, Math.min(sensor.max, temperature));
        
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        const range = sensor.max - sensor.min;
        const percent = (clampedValue - sensor.min) / range;
        
        if (percent < 0.1 || percent > 0.9) status = 'critical';
        else if (percent < 0.2 || percent > 0.8) status = 'warning';

        return {
          ...sensor,
          value: Number(clampedValue.toFixed(1)),
          status,
          history: [...sensor.history, { time: now, value: clampedValue }].slice(-20)
        };
      }
      return sensor;
    });

    return { sensors: newSensors };
  }),

  updateUltrasonicDistanceFromMQTT: (distance: number) => set((state) => {
    const now = new Date().toLocaleTimeString();
    
    const newSensors = state.sensors.map(sensor => {
      // Update Ultrasonic Sensor distance
      if (sensor.type === 'Ultrasonic Sensor') {
        const clampedValue = Math.max(sensor.min, Math.min(sensor.max, distance));
        
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        const range = sensor.max - sensor.min;
        const percent = (clampedValue - sensor.min) / range;
        
        if (percent < 0.1 || percent > 0.9) status = 'critical';
        else if (percent < 0.2 || percent > 0.8) status = 'warning';

        return {
          ...sensor,
          value: Number(clampedValue.toFixed(1)),
          status,
          history: [...sensor.history, { time: now, value: clampedValue }].slice(-20)
        };
      }
      return sensor;
    });

    return { sensors: newSensors };
  }),

  updateAllSensorsFromMQTT: (data) => set((state) => {
    const now = new Date().toLocaleTimeString();
    const currentTime = Date.now();
    
    // Update last message time
    set({ lastMessageTime: currentTime });
    
    // Update sensor status
    if (data.status === 'OK' || data.status === 'FAIL') {
      set({ sensorStatus: data.status });
    }
    
    // If status is FAIL, don't update sensor values
    if (data.status === 'FAIL') {
      return state;
    }
    
    // Only update sensors with valid MQTT data - NO fallback to old values
    const newSensors: SensorData[] = state.sensors.map((sensor): SensorData => {
      // Update DHT Sensor (temperature and humidity)
      if (sensor.type === 'DHT Sensor') {
        // Only update if both temperature and humidity are provided
        if (data.temperature !== undefined && data.temperature !== null && 
            data.humidity !== undefined && data.humidity !== null) {
          const clampedTemp = Math.max(sensor.min, Math.min(sensor.max, data.temperature));
          const clampedHum = Math.max(0, Math.min(100, data.humidity));
          
          const range = sensor.max - sensor.min;
          const tempPercent = (clampedTemp - sensor.min) / range;
          let status: 'normal' | 'warning' | 'critical' = 'normal';
          
          if (tempPercent < 0.1 || tempPercent > 0.9) status = 'critical';
          else if (tempPercent < 0.2 || tempPercent > 0.8) status = 'warning';
          
          return {
            ...sensor,
            value: Number(clampedTemp.toFixed(1)),
            secondaryValue: Number(clampedHum.toFixed(1)),
            status,
            history: [...sensor.history, { time: now, value: clampedTemp }].slice(-20)
          };
        }
        // If data missing, return sensor unchanged (will be cleared by timeout)
        return sensor;
      }
      
      // Update Touch Sensor (count) - ONLY from MQTT, no auto-increment
      if (sensor.type === 'Touch Sensor') {
        if (data.touch_count !== undefined && data.touch_count !== null) {
          const count = Math.max(sensor.min, Math.min(sensor.max, data.touch_count));
          return {
            ...sensor,
            value: count,
            history: [...sensor.history, { time: now, value: count }].slice(-20)
          };
        }
        return sensor;
      }
      
      // Update Ultrasonic Sensor (distance)
      if (sensor.type === 'Ultrasonic Sensor') {
        if (data.distance_cm !== undefined && data.distance_cm !== null) {
          const distance = Math.max(sensor.min, Math.min(sensor.max, data.distance_cm));
          const range = sensor.max - sensor.min;
          const percent = (distance - sensor.min) / range;
          let status: 'normal' | 'warning' | 'critical' = 'normal';
          
          if (percent < 0.1 || percent > 0.9) status = 'critical';
          else if (percent < 0.2 || percent > 0.8) status = 'warning';
          
          return {
            ...sensor,
            value: Number(distance.toFixed(1)),
            status,
            history: [...sensor.history, { time: now, value: distance }].slice(-20)
          };
        }
        return sensor;
      }
      
      // Update IR Sensor (boolean)
      if (sensor.type === 'IR Sensor') {
        if (data.ir_sensor !== undefined && data.ir_sensor !== null) {
          const detected = data.ir_sensor ? 1 : 0;
          return {
            ...sensor,
            value: detected,
            status: detected === 1 ? 'warning' : 'normal',
            history: [...sensor.history, { time: now, value: detected }].slice(-20)
          };
        }
        return sensor;
      }
      
      // Update LDR Sensor (light level)
      if (sensor.type === 'LDR Sensor') {
        if (data.ldr !== undefined && data.ldr !== null) {
          const ldr = Math.max(sensor.min, Math.min(sensor.max, data.ldr));
          const range = sensor.max - sensor.min;
          const percent = (ldr - sensor.min) / range;
          let status: 'normal' | 'warning' | 'critical' = 'normal';
          
          if (percent < 0.1 || percent > 0.9) status = 'critical';
          else if (percent < 0.2 || percent > 0.8) status = 'warning';
          
          return {
            ...sensor,
            value: Number(ldr.toFixed(1)),
            status,
            history: [...sensor.history, { time: now, value: ldr }].slice(-20)
          };
        }
        return sensor;
      }
      
      // Update Servo Motor (angle)
      if (sensor.type === 'Servo Motor') {
        if (data.servo_angle !== undefined && data.servo_angle !== null) {
          const angle = Math.max(sensor.min, Math.min(sensor.max, data.servo_angle));
          return {
            ...sensor,
            value: Number(angle.toFixed(0)),
            history: [...sensor.history, { time: now, value: angle }].slice(-20)
          };
        }
        return sensor;
      }
      
      return sensor;
    });

    return { sensors: newSensors };
  }),

  clearSensorValues: () => set((state) => {
    // Clear all sensor values and set status to FAIL
    const clearedSensors: SensorData[] = state.sensors.map((sensor): SensorData => {
      // For DHT Sensor, clear both temperature and humidity
      if (sensor.type === 'DHT Sensor') {
        return {
          ...sensor,
          value: 0, // Will display as "----" in UI when status is FAIL
          secondaryValue: 0,
          status: 'normal' as const,
          history: [] // Clear history
        };
      }
      // For all other sensors, clear the value
      return {
        ...sensor,
        value: 0, // Will display as "----" in UI when status is FAIL
        status: 'normal' as const,
        history: [] // Clear history
      };
    });

    return { 
      sensors: clearedSensors,
      sensorStatus: 'FAIL' as const
    };
  }),

  toggleSimulation: () => set((state) => ({ isSimulating: !state.isSimulating }))
}));
