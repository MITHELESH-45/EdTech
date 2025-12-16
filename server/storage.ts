import { type User, type InsertUser, type Course, type ElectronicComponent } from "@shared/schema";
import { randomUUID } from "crypto";

// Mock courses data
const mockCourses: Course[] = [
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

const mockComponents: ElectronicComponent[] = [
  { id: "led", name: "LED", category: "base", icon: "led", description: "Light Emitting Diode" },
  { id: "resistor", name: "Resistor", category: "base", icon: "resistor", description: "Limits current flow" },
  { id: "button", name: "Button", category: "base", icon: "button", description: "Momentary push button" },
  { id: "buzzer", name: "Buzzer", category: "base", icon: "buzzer", description: "Produces sound when powered" },
  { id: "potentiometer", name: "Potentiometer", category: "base", icon: "potentiometer", description: "Variable resistor" },
  { id: "5v", name: "5V Power", category: "power", icon: "power-5v", description: "5 Volt power supply" },
  { id: "gnd", name: "GND", category: "power", icon: "ground", description: "Ground connection" },
  { id: "arduino-uno", name: "Arduino UNO", category: "boards", icon: "arduino", description: "Arduino UNO board" },
  { id: "esp32", name: "ESP32", category: "boards", icon: "esp32", description: "ESP32 WiFi microcontroller" },
  { id: "breadboard", name: "Breadboard", category: "structure", icon: "breadboard", description: "Solderless breadboard" },
  { id: "jumper-wire", name: "Jumper Wire", category: "structure", icon: "wire", description: "Connecting wire" }
];

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  updateCourseProgress(id: string, progress: number): Promise<Course | undefined>;
  
  getComponents(): Promise<ElectronicComponent[]>;
  getComponent(id: string): Promise<ElectronicComponent | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private courses: Map<string, Course>;
  private components: Map<string, ElectronicComponent>;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.components = new Map();
    
    // Initialize with mock data
    mockCourses.forEach(course => {
      this.courses.set(course.id, course);
    });
    
    mockComponents.forEach(component => {
      this.components.set(component.id, component);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async updateCourseProgress(id: string, progress: number): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (course) {
      const updatedCourse = { ...course, progress };
      this.courses.set(id, updatedCourse);
      return updatedCourse;
    }
    return undefined;
  }

  async getComponents(): Promise<ElectronicComponent[]> {
    return Array.from(this.components.values());
  }

  async getComponent(id: string): Promise<ElectronicComponent | undefined> {
    return this.components.get(id);
  }
}

export const storage = new MemStorage();
