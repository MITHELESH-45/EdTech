import type { Course, ElectronicComponent, Lesson } from "@shared/schema";
export interface CourseLevel {
  id: string;
  name: string;
  description: string;
  youtubeUrl: string;
  notesUrl: string;
  duration: string;
  isCompleted: boolean;
}

export interface ExtendedCourse extends Course {
  levels: CourseLevel[];
}

export const mockCourses: ExtendedCourse[] = [
  {
    id: "1",
    title: "Basics of Electronics",
    description: "Learn fundamental concepts of electronics including voltage, current, and resistance.",
    difficulty: "beginner",
    progress: 45,
    image: "/Basics-of-Electronics.png",
    isLocked: false,
    lessons: [
      {
        id: "1-1",
        title: "Introduction to Electronics",
        content: "Electronics is the branch of physics and technology concerned with the design of circuits using transistors and microchips, and with the behavior and movement of electrons in a semiconductor, conductor, vacuum, or gas.",
        diagramPlaceholder: "basic-circuit-diagram"
      },
      {
        id: "1-2",
        title: "Understanding Voltage",
        content: "Voltage, also called electromotive force, is the pressure from an electrical circuit's power source that pushes charged electrons through a conducting loop.",
        diagramPlaceholder: "voltage-diagram"
      }
    ],
    levels: [
      {
        id: "1-level-1",
        name: "Level 1: What is Electronics?",
        description: "Introduction to the world of electronics and its applications",
        youtubeUrl: "https://www.youtube.com/watch?v=mc979OhitAg",
        notesUrl: "/notes/electronics-basics-level1.pdf",
        duration: "15 min",
        isCompleted: true
      },
      {
        id: "1-level-2",
        name: "Level 2: Voltage and Current",
        description: "Understanding voltage, current, and their relationship",
        youtubeUrl: "https://www.youtube.com/watch?v=w82aSjLuD_8",
        notesUrl: "/notes/electronics-basics-level2.pdf",
        duration: "20 min",
        isCompleted: false
      },
      {
        id: "1-level-3",
        name: "Level 3: Resistance and Ohm's Law",
        description: "Learn about resistance and the fundamental Ohm's Law",
        youtubeUrl: "https://www.youtube.com/watch?v=HsLLq6Rm5tU",
        notesUrl: "/notes/electronics-basics-level3.pdf",
        duration: "25 min",
        isCompleted: false
      }
    ]
  },
  {
    id: "2",
    title: "Digital Electronics Fundamentals",
    description: "Master the fundamentals of digital circuits, logic gates, and binary systems.",
    difficulty: "intermediate",
    progress: 20,
    image: "/Digital-Electronics-Fundamentals.png",
    isLocked: false,
    lessons: [
      {
        id: "2-1",
        title: "Binary Number System",
        content: "The binary numeral system is a base-2 numeral system that typically uses just two symbols: 0 and 1.",
        diagramPlaceholder: "binary-diagram"
      }
    ],
    levels: [
      {
        id: "2-level-1",
        name: "Level 1: Binary Numbers",
        description: "Understanding the binary number system",
        youtubeUrl: "https://www.youtube.com/watch?v=LpuPe81bc2w",
        notesUrl: "/notes/digital-electronics-level1.pdf",
        duration: "18 min",
        isCompleted: true
      },
      {
        id: "2-level-2",
        name: "Level 2: Logic Gates",
        description: "AND, OR, NOT, NAND, NOR, XOR gates explained",
        youtubeUrl: "https://www.youtube.com/watch?v=gI-qXk7XojA",
        notesUrl: "/notes/digital-electronics-level2.pdf",
        duration: "30 min",
        isCompleted: false
      }
    ]
  },
  {
    id: "3",
    title: "Arduino for Beginners",
    description: "Get started with Arduino microcontrollers and build your first projects.",
    difficulty: "beginner",
    progress: 0,
    image: "/Arduino-for-Beginners.png",
    isLocked: false,
    lessons: [
      {
        id: "3-1",
        title: "What is Arduino?",
        content: "Arduino is an open-source electronics platform based on easy-to-use hardware and software.",
        diagramPlaceholder: "arduino-board"
      }
    ],
    levels: [
      {
        id: "3-level-1",
        name: "Level 1: Arduino Introduction",
        description: "What is Arduino and why use it?",
        youtubeUrl: "https://www.youtube.com/watch?v=nL34zDTPkcs",
        notesUrl: "/notes/arduino-level1.pdf",
        duration: "12 min",
        isCompleted: false
      },
      {
        id: "3-level-2",
        name: "Level 2: First Program - Blink LED",
        description: "Write your first Arduino program",
        youtubeUrl: "https://www.youtube.com/watch?v=fJWR7dBuc18",
        notesUrl: "/notes/arduino-level2.pdf",
        duration: "20 min",
        isCompleted: false
      }
    ]
  },
 
  {
    id: "5",
    title: "IoT Basics",
    description: "Learn the fundamentals of Internet of Things and connected devices.",
    difficulty: "advanced",
    progress: 0,
    isLocked: true,
    lessons: [],
    levels: [],
    image: "/IoT-Basics.png",
  },
  
];

export const mockComponents: ElectronicComponent[] = [
  {
    id: "led",
    name: "LED",
    category: "base",
    icon: "led",
    description: "Light Emitting Diode - emits light when current flows through"
  },
  {
    id: "resistor",
    name: "Resistor",
    category: "base",
    icon: "resistor",
    description: "Limits the flow of electric current"
  },
  {
    id: "button",
    name: "Button",
    category: "base",
    icon: "button",
    description: "Momentary push button switch"
  },
  {
    id: "buzzer",
    name: "Buzzer",
    category: "base",
    icon: "buzzer",
    description: "Produces sound when powered"
  },
  {
    id: "potentiometer",
    name: "Potentiometer",
    category: "base",
    icon: "potentiometer",
    description: "Variable resistor for analog input"
  },
  {
    id: "ultrasonic",
    name: "Ultrasonic Sensor",
    category: "base",
    icon: "ultrasonic",
    description: "HC-SR04 ultrasonic distance sensor"
  },
  {
    id: "ir-sensor",
    name: "IR Sensor",
    category: "base",
    icon: "ir-sensor",
    description: "Infrared obstacle detection sensor"
  },
  {
    id: "dht11",
    name: "DHT11 Sensor",
    category: "base",
    icon: "dht11",
    description: "Temperature and humidity sensor"
  },
  {
    id: "servo",
    name: "Servo Motor",
    category: "base",
    icon: "servo",
    description: "Rotational actuator with position control"
  },
  {
    id: "5v",
    name: "5V Power",
    category: "power",
    icon: "power-5v",
    description: "5 Volt power supply connection"
  },
  {
    id: "gnd",
    name: "GND",
    category: "power",
    icon: "ground",
    description: "Ground connection"
  },
  {
    id: "object",
    name: "Object",
    category: "base",
    icon: "object",
    description: "Detectable object for proximity sensors"
  },
  {
    id: "arduino-uno",
    name: "Arduino UNO",
    category: "boards",
    icon: "arduino",
    description: "Arduino UNO microcontroller board"
  },
  {
    id: "esp32",
    name: "ESP32",
    category: "boards",
    icon: "esp32",
    description: "ESP32 WiFi & Bluetooth microcontroller"
  },
  {
    id: "breadboard",
    name: "Breadboard",
    category: "structure",
    icon: "breadboard",
    description: "Solderless breadboard for prototyping"
  },
  {
    id: "jumper-wire",
    name: "Jumper Wire",
    category: "structure",
    icon: "wire",
    description: "Connecting wire for circuits"
  }
];

export const componentCategories = [
  { id: "base", label: "Base Components" },
  { id: "power", label: "Power" },
  { id: "boards", label: "Boards" },
  { id: "structure", label: "Structure" }
] as const;