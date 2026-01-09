import { type User, type InsertUser, type Course, type ElectronicComponent } from "@shared/schema";
import { randomUUID } from "crypto";

interface CourseLevel {
  id: string;
  name: string;
  description: string;
  youtubeUrl: string;
  notesUrl: string;
  duration: string;
  isCompleted: boolean;
}

interface ExtendedCourse extends Course {
  levels: CourseLevel[];
}

const mockCourses: ExtendedCourse[] = [
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
    image: "/IoT-Basics.png"
  },
  
];

const mockComponents: ElectronicComponent[] = [
  { id: "led", name: "LED", category: "base", icon: "led", description: "Light Emitting Diode - emits light when current flows through" },
  { id: "resistor", name: "Resistor", category: "base", icon: "resistor", description: "Limits the flow of electric current" },
  { id: "button", name: "Button", category: "base", icon: "button", description: "Momentary push button switch" },
  { id: "buzzer", name: "Buzzer", category: "base", icon: "buzzer", description: "Produces sound when powered" },
  { id: "potentiometer", name: "Potentiometer", category: "base", icon: "potentiometer", description: "Variable resistor for analog input" },
  { id: "ultrasonic", name: "Ultrasonic Sensor", category: "base", icon: "ultrasonic", description: "HC-SR04 ultrasonic distance sensor" },
  { id: "ir-sensor", name: "IR Sensor", category: "base", icon: "ir-sensor", description: "Infrared obstacle detection sensor" },
  { id: "dht11", name: "DHT11 Sensor", category: "base", icon: "dht11", description: "Temperature and humidity sensor" },
  { id: "servo", name: "Servo Motor", category: "base", icon: "servo", description: "Rotational actuator with position control" },
  { id: "5v", name: "5V Power", category: "power", icon: "power-5v", description: "5 Volt power supply connection" },
  { id: "gnd", name: "GND", category: "power", icon: "ground", description: "Ground connection" },
  { id: "object", name: "Object", category: "base", icon: "object", description: "Detectable object for proximity sensors" },
  { id: "arduino-uno", name: "Arduino UNO", category: "boards", icon: "arduino", description: "Arduino UNO microcontroller board" },
  { id: "esp32", name: "ESP32", category: "boards", icon: "esp32", description: "ESP32 WiFi & Bluetooth microcontroller" },
  { id: "breadboard", name: "Breadboard", category: "structure", icon: "breadboard", description: "Solderless breadboard for prototyping" },
  { id: "jumper-wire", name: "Jumper Wire", category: "structure", icon: "wire", description: "Connecting wire for circuits" }
];

export interface Testcase {
  input: string;
  expectedOutput: string;
}

export interface CodingQuestion {
  id: string;
  component: 'conditionals' | 'loops' | 'arrays' | 'strings' | 'functions';
  title: string;
  description: string;
  testcases: Testcase[];
}

export interface CodingComponent {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const mockCodingComponents: CodingComponent[] = [
  { id: "conditionals", name: "Conditionals", description: "Learn how to make decisions in your code using if-else statements", icon: "if" },
  { id: "loops", name: "Loops", description: "Master repetition and iteration to execute code multiple times efficiently", icon: "loop" },
  { id: "arrays", name: "Arrays", description: "Work with collections of data using arrays and lists", icon: "array" },
  { id: "strings", name: "Strings", description: "Manipulate and work with text data using string operations", icon: "string" },
  { id: "functions", name: "Functions", description: "Create reusable code blocks with functions and methods", icon: "function" },
];

const mockQuestions: CodingQuestion[] = [
  // Conditionals - 3 questions
  {
    id: "cond-1",
    component: "conditionals",
    title: "Check Even or Odd",
    description: "Write a program to check if a number is even or odd. If the number is even, print 'Even', otherwise print 'Odd'.",
    testcases: [
      { input: "6", expectedOutput: "Even" },
      { input: "7", expectedOutput: "Odd" },
      { input: "0", expectedOutput: "Even" },
      { input: "15", expectedOutput: "Odd" },
      { input: "100", expectedOutput: "Even" },
      { input: "1", expectedOutput: "Odd" },
    ],
  },
  {
    id: "cond-2",
    component: "conditionals",
    title: "Find Largest of Two Numbers",
    description: "Find the largest of two numbers. Read two integers and print the larger one.",
    testcases: [
      { input: "15\n23", expectedOutput: "23" },
      { input: "42\n17", expectedOutput: "42" },
      { input: "10\n10", expectedOutput: "10" },
      { input: "99\n1", expectedOutput: "99" },
      { input: "5\n8", expectedOutput: "8" },
      { input: "100\n50", expectedOutput: "100" },
    ],
  },
  {
    id: "cond-3",
    component: "conditionals",
    title: "Determine Grade",
    description: "Determine the grade based on score. If score >= 90, print 'A'; if score >= 80, print 'B'; if score >= 70, print 'C'; otherwise print 'F'.",
    testcases: [
      { input: "85", expectedOutput: "B" },
      { input: "95", expectedOutput: "A" },
      { input: "75", expectedOutput: "C" },
      { input: "65", expectedOutput: "F" },
      { input: "90", expectedOutput: "A" },
      { input: "80", expectedOutput: "B" },
    ],
  },
  // Loops - 3 questions
  {
    id: "loop-1",
    component: "loops",
    title: "Print Numbers 1 to N",
    description: "Print all numbers from 1 to N. Read an integer N and print numbers from 1 to N, each on a new line.",
    testcases: [
      { input: "5", expectedOutput: "1\n2\n3\n4\n5" },
      { input: "3", expectedOutput: "1\n2\n3" },
      { input: "10", expectedOutput: "1\n2\n3\n4\n5\n6\n7\n8\n9\n10" },
      { input: "1", expectedOutput: "1" },
      { input: "7", expectedOutput: "1\n2\n3\n4\n5\n6\n7" },
      { input: "15", expectedOutput: "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15" },
    ],
  },
  {
    id: "loop-2",
    component: "loops",
    title: "Multiplication Table",
    description: "Print the multiplication table of a number. Read a number and print its multiplication table from 1 to 10.",
    testcases: [
      { input: "7", expectedOutput: "7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70" },
      { input: "5", expectedOutput: "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50" },
      { input: "3", expectedOutput: "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30" },
      { input: "9", expectedOutput: "9 x 1 = 9\n9 x 2 = 18\n9 x 3 = 27\n9 x 4 = 36\n9 x 5 = 45\n9 x 6 = 54\n9 x 7 = 63\n9 x 8 = 72\n9 x 9 = 81\n9 x 10 = 90" },
      { input: "2", expectedOutput: "2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20" },
      { input: "11", expectedOutput: "11 x 1 = 11\n11 x 2 = 22\n11 x 3 = 33\n11 x 4 = 44\n11 x 5 = 55\n11 x 6 = 66\n11 x 7 = 77\n11 x 8 = 88\n11 x 9 = 99\n11 x 10 = 110" },
    ],
  },
  {
    id: "loop-3",
    component: "loops",
    title: "Sum of First N Natural Numbers",
    description: "Calculate the sum of first N natural numbers. Read N and calculate 1 + 2 + 3 + ... + N.",
    testcases: [
      { input: "10", expectedOutput: "55" },
      { input: "5", expectedOutput: "15" },
      { input: "100", expectedOutput: "5050" },
      { input: "1", expectedOutput: "1" },
      { input: "20", expectedOutput: "210" },
      { input: "50", expectedOutput: "1275" },
    ],
  },
  // Arrays - 3 questions
  {
    id: "array-1",
    component: "arrays",
    title: "Sum of Array Elements",
    description: "Calculate the sum of all elements in an array. Read N, then N integers, and print their sum.",
    testcases: [
      { input: "5\n10 20 30 40 50", expectedOutput: "150" },
      { input: "3\n1 2 3", expectedOutput: "6" },
      { input: "4\n5 10 15 20", expectedOutput: "50" },
      { input: "6\n1 1 1 1 1 1", expectedOutput: "6" },
      { input: "3\n100 200 300", expectedOutput: "600" },
      { input: "5\n-5 10 -3 7 1", expectedOutput: "10" },
    ],
  },
  {
    id: "array-2",
    component: "arrays",
    title: "Find Maximum Element",
    description: "Find the maximum element in an array. Read N, then N integers, and print the largest number.",
    testcases: [
      { input: "5\n34 12 78 45 23", expectedOutput: "78" },
      { input: "3\n10 20 15", expectedOutput: "20" },
      { input: "4\n1 1 1 1", expectedOutput: "1" },
      { input: "6\n100 50 200 150 75 300", expectedOutput: "300" },
      { input: "3\n-5 -10 -3", expectedOutput: "-3" },
      { input: "5\n5 4 3 2 1", expectedOutput: "5" },
    ],
  },
  {
    id: "array-3",
    component: "arrays",
    title: "Reverse Array",
    description: "Print array elements in reverse order. Read N, then N integers, and print them in reverse.",
    testcases: [
      { input: "5\n1 2 3 4 5", expectedOutput: "5 4 3 2 1" },
      { input: "3\n10 20 30", expectedOutput: "30 20 10" },
      { input: "4\n1 2 3 4", expectedOutput: "4 3 2 1" },
      { input: "6\n6 5 4 3 2 1", expectedOutput: "1 2 3 4 5 6" },
      { input: "3\n100 200 300", expectedOutput: "300 200 100" },
      { input: "5\n5 4 3 2 1", expectedOutput: "1 2 3 4 5" },
    ],
  },
  // Strings - 3 questions
  {
    id: "string-1",
    component: "strings",
    title: "Reverse a String",
    description: "Reverse a string. Read a string and print it in reverse order.",
    testcases: [
      { input: "Hello", expectedOutput: "olleH" },
      { input: "world", expectedOutput: "dlrow" },
      { input: "abc", expectedOutput: "cba" },
      { input: "12345", expectedOutput: "54321" },
      { input: "A", expectedOutput: "A" },
      { input: "Programming", expectedOutput: "gnimmargorP" },
    ],
  },
  {
    id: "string-2",
    component: "strings",
    title: "Count Vowels",
    description: "Count the number of vowels in a string. Read a string and count how many vowels (a, e, i, o, u) it contains (case-insensitive).",
    testcases: [
      { input: "Programming", expectedOutput: "3" },
      { input: "Hello", expectedOutput: "2" },
      { input: "AEIOU", expectedOutput: "5" },
      { input: "bcdfg", expectedOutput: "0" },
      { input: "a", expectedOutput: "1" },
      { input: "Education", expectedOutput: "5" },
    ],
  },
  {
    id: "string-3",
    component: "strings",
    title: "Check Palindrome",
    description: "Check if a string is a palindrome. Read a string and print 'Yes' if it reads the same forwards and backwards, otherwise print 'No'.",
    testcases: [
      { input: "racecar", expectedOutput: "Yes" },
      { input: "hello", expectedOutput: "No" },
      { input: "madam", expectedOutput: "Yes" },
      { input: "level", expectedOutput: "Yes" },
      { input: "python", expectedOutput: "No" },
      { input: "a", expectedOutput: "Yes" },
    ],
  },
  // Functions - 3 questions
  {
    id: "func-1",
    component: "functions",
    title: "Add Two Numbers",
    description: "Write a function to add two numbers. Create a function that takes two integers and returns their sum. Then call it with 15 and 27.",
    testcases: [
      { input: "", expectedOutput: "42" },
      { input: "", expectedOutput: "42" },
      { input: "", expectedOutput: "42" },
      { input: "", expectedOutput: "42" },
      { input: "", expectedOutput: "42" },
      { input: "", expectedOutput: "42" },
    ],
  },
  {
    id: "func-2",
    component: "functions",
    title: "Check Prime Number",
    description: "Write a function to check if a number is prime. Create a function that takes an integer and returns true if it's prime, false otherwise. Test with 17.",
    testcases: [
      { input: "", expectedOutput: "Prime" },
      { input: "", expectedOutput: "Prime" },
      { input: "", expectedOutput: "Prime" },
      { input: "", expectedOutput: "Prime" },
      { input: "", expectedOutput: "Prime" },
      { input: "", expectedOutput: "Prime" },
    ],
  },
  {
    id: "func-3",
    component: "functions",
    title: "Find Maximum of Two",
    description: "Write a function to find the maximum of two numbers. Create a function that takes two integers and returns the larger one. Test with 34 and 67.",
    testcases: [
      { input: "", expectedOutput: "67" },
      { input: "", expectedOutput: "67" },
      { input: "", expectedOutput: "67" },
      { input: "", expectedOutput: "67" },
      { input: "", expectedOutput: "67" },
      { input: "", expectedOutput: "67" },
    ],
  },
];


export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCourses(): Promise<ExtendedCourse[]>;
  getCourse(id: string): Promise<ExtendedCourse | undefined>;
  updateCourseProgress(id: string, progress: number): Promise<ExtendedCourse | undefined>;
  
  getComponents(): Promise<ElectronicComponent[]>;
  getComponent(id: string): Promise<ElectronicComponent | undefined>;
  
  getCodingComponents(): Promise<CodingComponent[]>;
  getCodingComponent(id: string): Promise<CodingComponent | undefined>;
  getQuestionsByComponent(componentId: string): Promise<CodingQuestion[]>;
  getQuestion(id: string): Promise<CodingQuestion | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private courses: Map<string, ExtendedCourse>;
  private components: Map<string, ElectronicComponent>;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.components = new Map();
    
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

  async getCourses(): Promise<ExtendedCourse[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: string): Promise<ExtendedCourse | undefined> {
    return this.courses.get(id);
  }

  async updateCourseProgress(id: string, progress: number): Promise<ExtendedCourse | undefined> {
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

  async getCodingComponents(): Promise<CodingComponent[]> {
    return mockCodingComponents;
  }

  async getCodingComponent(id: string): Promise<CodingComponent | undefined> {
    return mockCodingComponents.find(c => c.id === id);
  }

  async getQuestionsByComponent(componentId: string): Promise<CodingQuestion[]> {
    return mockQuestions.filter(q => q.component === componentId);
  }

  async getQuestion(id: string): Promise<CodingQuestion | undefined> {
    return mockQuestions.find(q => q.id === id);
  }
}

export const storage = new MemStorage();