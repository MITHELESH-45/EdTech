# E-GROOTS Design Guidelines

## Design Approach

**Learning-First Electronics Lab Aesthetic**
- Professional SaaS platform aesthetic, not gaming or flashy futuristic UI
- Calm, minimal, and beginner-friendly experience
- Production-ready, investor-ready visual quality
- Modern digital electronics lab feeling

## Core Design Elements

### Color Palette
- **Background**: Light theme with off-white / soft gray (#F9FAFB, #F3F4F6)
- **Accent Colors**: Soft blue, teal, and green for electronics-inspired touches
- **No**: Glassmorphism, glowing neon, or dark mode

### Typography
- Clean, modern sans-serif (system fonts or Inter/DM Sans)
- Clear hierarchy for learning content
- Readable body text for course materials

### Layout System
- Consistent Tailwind spacing: primarily p-4, p-6, p-8, gap-4, gap-6
- Card-based layouts with subtle shadows
- Grid systems: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for course cards

### Component Library

**Cards**
- Clean white cards with subtle borders and shadows
- Rounded corners (rounded-lg)
- Hover: slight lift with GSAP fade (subtle)

**Buttons**
- Primary: Soft blue/teal background
- Secondary: Light gray with border
- States: Subtle hover scale or background shift (no heavy animation)
- Disabled: Grayed out with "Coming Soon" badges

**Badges**
- Difficulty levels with color coding (Beginner/Intermediate/Advanced)
- Status badges (Active, Coming Soon, Locked)

**Progress Bars**
- Horizontal bars showing course completion
- Soft fill color matching accent palette

## Page-Specific Layouts

### Global Header (Sticky)
- E-GROOTS logo (icon + text) on left
- Search input (centered or right-aligned, UI only)
- Profile avatar with dropdown on far right
- Clean, minimal design with subtle border-bottom

### Learning Dashboard (/dashboard)
- **Hero Section**: Welcome message, tagline, brief CTA (not full-screen)
- **Course Grid**: 3-column layout (responsive)
  - Course cards with: title, short description, difficulty badge, progress bar, "Start Learning" button
  - Example courses: Basics of Electronics, Digital Electronics, Arduino for Beginners, Sensors & Actuators
- **Side Panel** (Left): Vertical tool navigation
  - Electronic Simulation (active, navigable)
  - IoT Simulation (Coming Soon badge)
  - No-Code Editor (Coming Soon badge)

### Electronic Simulation (/electronic-simulation)
**3-Column Layout:**

**Left Panel** - Component Palette (20% width)
- Scrollable, categorized sections
- Component cards with SVG/image icons + labels
- Categories: Base (LED, Resistor, Button, Buzzer, Potentiometer), Power (5V, GND), Boards (Arduino UNO, ESP32), Structure (Breadboard, Jumper Wires)
- Visual icons, not text blocks

**Center Panel** - Circuit Canvas (60% width)
- Light grid background (#F5F5F5 with subtle grid lines)
- Breadboard visual placed on canvas
- Drag-and-drop component placement
- Manual wire connections: click pin → click pin → curved SVG wire
- Active wires change color subtly
- No heavy animations—usability first

**Right Panel** - Controls & Status (20% width)
- Control buttons: Run Simulation, Stop Simulation, Reset Circuit
- Status display showing: simulation state, LED ON/OFF indicators
- Error messages in calm red (e.g., "LED requires a resistor in series")

### Course Detail Pages
- Clean lesson layout with headings, text content, diagram placeholders
- End-of-lesson CTA: "Practice this concept in Electronic Simulation"

### About Us (/about)
- Clean informational page
- Sections: What is E-GROOTS, Who it's for, Problems it solves, Future vision
- Minimal layout with clear typography

## Animation Guidelines

**Use GSAP ONLY for:**
- Page fade transitions (fade-in on load)
- Panel slide-in effects
- Component placement fade-in
- Button hover micro-interactions (slight scale or lift)

**DO NOT:**
- Use flashy, pulsing, or continuous animations
- Distract from learning content
- Apply heavy motion effects

**Principle**: Minimal, calm, smooth, purposeful

## Images
- **Component Icons**: Use SVG/PNG icons for electronic components (realistic representations, not abstract blocks)
- **Breadboard Visual**: Realistic breadboard image as canvas background
- **Course Thumbnails**: Electronics-themed illustrations (circuits, components, Arduino boards)
- **About Page**: Optional subtle illustration of learning/electronics lab

**No large hero image required** - platform is tool-focused, not marketing-heavy

## Critical Requirements
- All interactions are UI-only (no backend)
- Mock simulation logic using React state
- Professional SaaS quality throughout
- Scalable component architecture for future backend integration
- Clean, modern, learning-focused aesthetic at all times