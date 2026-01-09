export interface CircuitTutorial {
  id: string;
  title: string;
  description: string;
  youtubeId: string; // YouTube video ID
  componentIds: string[]; // Related component IDs
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string; // e.g., "5:30"
  tags: string[];
}

export const circuitTutorials: CircuitTutorial[] = [
  {
    id: 'led-blink',
    title: 'LED Blink Circuit',
    description: 'Learn how to create a simple LED blink circuit using Arduino. This tutorial covers basic wiring, resistor selection, and Arduino programming.',
    youtubeId: 'Zf4UPzpbdvY', // Arduino LED Blink Tutorial
    componentIds: ['led', 'resistor', 'arduino-uno', '5v', 'gnd'],
    difficulty: 'beginner',
    duration: '5:30',
    tags: ['led', 'arduino', 'beginner', 'blink']
  },
  {
    id: 'button-led',
    title: 'Button Controlled LED',
    description: 'Build an interactive circuit where pressing a button controls an LED. Learn about digital inputs, pull-up resistors, and button debouncing.',
    youtubeId: 'EdirF3-bmxs', // Arduino Button Tutorial
    componentIds: ['led', 'resistor', 'button', 'arduino-uno', '5v', 'gnd'],
    difficulty: 'beginner',
    duration: '7:15',
    tags: ['button', 'led', 'arduino', 'input', 'interactive']
  },
  {
    id: 'potentiometer-dimmer',
    title: 'Potentiometer LED Dimmer',
    description: 'Create a dimmable LED circuit using a potentiometer. Understand analog inputs, PWM signals, and voltage division.',
    youtubeId: 'dQw4w9WgXcQ', // Placeholder - replace with actual tutorial video ID
    componentIds: ['led', 'resistor', 'potentiometer', 'arduino-uno', '5v', 'gnd'],
    difficulty: 'intermediate',
    duration: '8:45',
    tags: ['potentiometer', 'led', 'analog', 'pwm', 'dimmer']
  },
  {
    id: 'ultrasonic-sensor',
    title: 'Ultrasonic Distance Sensor',
    description: 'Build a distance measurement system using an ultrasonic sensor. Learn about sensor interfacing, timing calculations, and serial communication.',
    youtubeId: 'dQw4w9WgXcQ', // Placeholder - replace with actual tutorial video ID
    componentIds: ['ultrasonic', 'arduino-uno', '5v', 'gnd'],
    difficulty: 'intermediate',
    duration: '12:20',
    tags: ['ultrasonic', 'sensor', 'distance', 'measurement', 'arduino']
  },
  {
    id: 'dht11-sensor',
    title: 'DHT11 Temperature & Humidity Sensor',
    description: 'Interface a DHT11 sensor to measure temperature and humidity. Learn about digital sensor protocols and data reading.',
    youtubeId: 'dQw4w9WgXcQ', // Placeholder - replace with actual tutorial video ID
    componentIds: ['dht11', 'arduino-uno', '5v', 'gnd'],
    difficulty: 'intermediate',
    duration: '10:30',
    tags: ['dht11', 'temperature', 'humidity', 'sensor', 'arduino']
  },
  {
    id: 'servo-motor',
    title: 'Servo Motor Control',
    description: 'Control a servo motor with Arduino. Learn about PWM control, angle positioning, and servo motor applications.',
    youtubeId: 'dQw4w9WgXcQ', // Placeholder - replace with actual tutorial video ID
    componentIds: ['servo', 'arduino-uno', '5v', 'gnd'],
    difficulty: 'intermediate',
    duration: '9:15',
    tags: ['servo', 'motor', 'pwm', 'control', 'arduino']
  },
  {
    id: 'ir-sensor',
    title: 'IR Sensor Circuit',
    description: 'Build an IR sensor circuit for object detection. Understand digital sensors, threshold values, and detection logic.',
    youtubeId: 'dQw4w9WgXcQ', // Placeholder - replace with actual tutorial video ID
    componentIds: ['ir-sensor', 'led', 'resistor', 'arduino-uno', '5v', 'gnd'],
    difficulty: 'beginner',
    duration: '6:45',
    tags: ['ir-sensor', 'detection', 'sensor', 'arduino', 'digital']
  },
  {
    id: 'buzzer-alarm',
    title: 'Buzzer Alarm Circuit',
    description: 'Create an alarm system using a buzzer. Learn about audio output, frequency control, and alarm patterns.',
    youtubeId: 'dQw4w9WgXcQ', // Placeholder - replace with actual tutorial video ID
    componentIds: ['buzzer', 'arduino-uno', '5v', 'gnd'],
    difficulty: 'beginner',
    duration: '5:20',
    tags: ['buzzer', 'alarm', 'audio', 'arduino', 'output']
  }
];

export function getTutorialById(id: string): CircuitTutorial | undefined {
  return circuitTutorials.find(tutorial => tutorial.id === id);
}

export function getTutorialsByComponent(componentId: string): CircuitTutorial[] {
  return circuitTutorials.filter(tutorial => 
    tutorial.componentIds.includes(componentId)
  );
}

export function getTutorialsByDifficulty(difficulty: CircuitTutorial['difficulty']): CircuitTutorial[] {
  return circuitTutorials.filter(tutorial => tutorial.difficulty === difficulty);
}

