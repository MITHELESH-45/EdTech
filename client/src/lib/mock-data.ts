import type { Course, ElectronicComponent, Lesson } from "@shared/schema";

export const mockCourses: Course[] = [
  {
    id: "1",
    title: "Basics of Electronics",
    description: "Learn fundamental concepts of electronics including voltage, current, and resistance.",
    difficulty: "beginner",
    progress: 45,
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
    ]
  },
  {
    id: "2",
    title: "Digital Electronics Fundamentals",
    description: "Master the fundamentals of digital circuits, logic gates, and binary systems.",
    difficulty: "intermediate",
    progress: 20,
    isLocked: false,
    lessons: [
      {
        id: "2-1",
        title: "Binary Number System",
        content: "The binary numeral system is a base-2 numeral system that typically uses just two symbols: 0 and 1.",
        diagramPlaceholder: "binary-diagram"
      }
    ]
  },
  {
    id: "3",
    title: "Arduino for Beginners",
    description: "Get started with Arduino microcontrollers and build your first projects.",
    difficulty: "beginner",
    progress: 0,
    isLocked: false,
    lessons: [
      {
        id: "3-1",
        title: "What is Arduino?",
        content: "Arduino is an open-source electronics platform based on easy-to-use hardware and software.",
        diagramPlaceholder: "arduino-board"
      }
    ]
  },
  {
    id: "4",
    title: "Sensors & Actuators",
    description: "Explore various sensors and actuators used in electronic projects and IoT.",
    difficulty: "intermediate",
    progress: 0,
    isLocked: false,
    lessons: [
      {
        id: "4-1",
        title: "Introduction to Sensors",
        content: "A sensor is a device that detects and responds to some type of input from the physical environment.",
        diagramPlaceholder: "sensor-types"
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
    lessons: []
  },
  {
    id: "6",
    title: "PCB Design Principles",
    description: "Understand the principles behind designing printed circuit boards.",
    difficulty: "advanced",
    progress: 0,
    isLocked: true,
    lessons: []
  }
];

export const mockComponents: ElectronicComponent[] = [
  // Base components
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
  // Power components
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
  // Board components
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
  // Structure components
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
