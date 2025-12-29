import { create } from 'zustand';

export type SensorType = 
  | 'Temperature' 
  | 'Humidity Sensor'
  | 'Ultrasonic Sensor' 
  | 'Gas' 
  | 'Light' 
  | 'Pressure' 
  | 'Motion' 
  | 'Sound' 
  | 'Proximity';

export interface SensorData {
  id: string;
  type: SensorType;
  name: string;
  value: number;
  unit: string;
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
  
  // Actions
  selectSensor: (id: string) => void;
  updateSensorValues: () => void;
  updateTemperatureFromMQTT: (temperature: number) => void;
  updateUltrasonicDistanceFromMQTT: (distance: number) => void;
  toggleSimulation: () => void;
}

const INITIAL_SENSORS: SensorData[] = [
  {
    id: 's1',
    type: 'Temperature',
    name: 'Temperature Sensor',
    value: 24,
    unit: '°C',
    min: -10,
    max: 50,
    status: 'normal',
    history: [],
    description: 'Measures ambient temperature in the environment.'
  },
  {
    id: 's2',
    type: 'Humidity Sensor',
    name: 'Humidity Sensor',
    value: 45,
    unit: '%',
    min: 0,
    max: 100,
    status: 'normal',
    history: [],
    description: 'Detects moisture levels in the air.'
  },
  {
    id: 's3',
    type: 'Gas',
    name: 'Gas Sensor',
    value: 120,
    unit: 'ppm',
    min: 0,
    max: 1000,
    status: 'normal',
    history: [],
    description: 'Detects presence of hazardous gases like LPG, CO, or smoke.'
  },
  {
    id: 's4',
    type: 'Light',
    name: 'LDR Light Sensor',
    value: 500,
    unit: 'lux',
    min: 0,
    max: 1000,
    status: 'normal',
    history: [],
    description: 'Measures light intensity.'
  },
  {
    id: 's5',
    type: 'Pressure',
    name: 'Barometric Pressure',
    value: 1013,
    unit: 'hPa',
    min: 900,
    max: 1100,
    status: 'normal',
    history: [],
    description: 'Measures atmospheric pressure.'
  },
  {
    id: 's6',
    type: 'Motion',
    name: 'PIR Motion Sensor',
    value: 0,
    unit: 'activity',
    min: 0,
    max: 1,
    status: 'normal',
    history: [],
    description: 'Detects movement in the surrounding area.'
  },
  {
    id: 's7',
    type: 'Sound',
    name: 'Sound Sensor',
    value: 40,
    unit: 'dB',
    min: 30,
    max: 120,
    status: 'normal',
    history: [],
    description: 'Measures noise levels.'
  },
  {
    id: 's8',
    type: 'Proximity',
    name: 'Ultrasonic Sensor',
    value: 150,
    unit: 'cm',
    min: 2,
    max: 400,
    status: 'normal',
    history: [],
    description: 'Measures distance to an object.'
  }
];

export const useSensorStore = create<SensorStore>((set) => ({
  sensors: INITIAL_SENSORS,
  selectedSensorId: INITIAL_SENSORS[0].id,
  isSimulating: true,

  selectSensor: (id) => set({ selectedSensorId: id }),

  updateSensorValues: () => set((state) => {
    if (!state.isSimulating) return {};

    const now = new Date().toLocaleTimeString();

    const newSensors = state.sensors.map(sensor => {
      // Skip Temperature sensor - it's updated via MQTT
      if (sensor.type === 'Temperature') {
        return sensor;
      }
      // Skip Ultrasonic Distance sensor (Proximity type with unit 'cm') - it's updated via MQTT
      if (sensor.type === 'Proximity' && sensor.unit === 'cm') {
        return sensor;
      }

      let change = (Math.random() - 0.5) * 2; // Random change
      
      // Adjust change magnitude based on sensor type
      if (sensor.type === 'Gas') change *= 10;
      if (sensor.type === 'Light') change *= 20;
      if (sensor.type === 'Pressure') change *= 0.5;
      if (sensor.type === 'Motion') {
         // Motion is mostly 0 or 1, but we can simulate activity level
         change = Math.random() > 0.8 ? 1 : 0;
         return {
            ...sensor,
            value: change,
            history: [...sensor.history, { time: now, value: change }].slice(-20)
         };
      }

      let newValue = sensor.value + change;
      
      // Clamp values
      newValue = Math.max(sensor.min, Math.min(sensor.max, newValue));
      
      // Determine status
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      const range = sensor.max - sensor.min;
      const percent = (newValue - sensor.min) / range;
      
      if (percent < 0.1 || percent > 0.9) status = 'critical';
      else if (percent < 0.2 || percent > 0.8) status = 'warning';

      return {
        ...sensor,
        value: Number(newValue.toFixed(1)),
        status,
        history: [...sensor.history, { time: now, value: newValue }].slice(-20) // Keep last 20 points
      };
    });

    return { sensors: newSensors };
  }),

  updateTemperatureFromMQTT: (temperature: number) => set((state) => {
    const now = new Date().toLocaleTimeString();
    
    const newSensors = state.sensors.map(sensor => {
      if (sensor.type === 'Temperature') {
        // Clamp temperature value
        const clampedValue = Math.max(sensor.min, Math.min(sensor.max, temperature));
        
        // Determine status
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
      // Update only the Ultrasonic Distance sensor (Proximity type with unit 'cm')
      if (sensor.type === 'Proximity' && sensor.unit === 'cm') {
        // Clamp distance value
        const clampedValue = Math.max(sensor.min, Math.min(sensor.max, distance));
        
        // Determine status
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

  toggleSimulation: () => set((state) => ({ isSimulating: !state.isSimulating }))
}));
