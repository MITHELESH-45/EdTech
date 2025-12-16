# E-GROOTS - Electronics & IoT Learning Platform

## Overview
E-GROOTS is a learning-first electronics and IoT education platform where users can:
- Learn electronics through structured courses
- Practice concepts using an interactive electronic simulator
- (Coming Soon) Explore IoT and no-code workflows

**Tagline:** Learn Electronics. Simulate Visually. Build Confidently.

## Current State
The MVP includes:
- Learning Dashboard with course grid
- Electronic Simulation module with 3-column layout
- Course detail pages with lesson content
- About page with platform information
- **Graph-based electrical simulation engine**

## Recent Changes

### December 16, 2025: Major Simulation Engine Upgrade
- **Graph-based Simulation Engine** (`client/src/lib/simulation-engine.ts`)
  - Net building and grouping for electrical connectivity
  - Circuit detection for multiple independent circuits
  - Voltage propagation through networks
  - Component state evaluation (LED, buzzer, servo, etc.)
  
- **Error Detection System**
  - No ground connection detection
  - No power source detection
  - Short circuit detection (power to ground)
  - Reverse polarity detection (LED)
  - Missing resistor warning for LEDs
  
- **Debug Panel** (`client/src/components/simulation/debug-panel.tsx`)
  - Shows detected circuits and their status
  - Displays net voltages and connections
  - Lists component states and properties
  - Real-time error/warning display
  
- **Improved Component Terminals**
  - Arduino UNO: 16 pins (5V, 3.3V, GND, VIN, A0-A2, D6-D13)
  - ESP32: 10 pins (3.3V, GND, EN, VP, VN, D25, D32-D35)
  - Breadboard: 260+ terminals with internal row/column connectivity
  - All components have properly positioned terminals

### December 16, 2025: Initial MVP implementation
- Created all core pages (Dashboard, Electronic Simulation, Course Detail, About)
- Implemented component palette with electronic components (LED, Resistor, Button, etc.)
- Built circuit canvas with drag-and-drop placement and wire drawing
- Set up backend API for courses and components
- Added loading states with skeletons
- Light theme with professional SaaS aesthetic

## Project Architecture

### Frontend Structure
```
client/src/
├── components/
│   ├── layout/
│   │   ├── header.tsx         # Global header with logo, search, profile
│   │   └── tool-sidebar.tsx   # Left navigation for tools
│   ├── dashboard/
│   │   └── course-card.tsx    # Course card component
│   ├── simulation/
│   │   ├── component-palette.tsx  # Component selection panel
│   │   ├── circuit-canvas.tsx     # SVG-based circuit builder
│   │   ├── control-panel.tsx      # Simulation controls & status
│   │   └── debug-panel.tsx        # Debug info panel (nets, voltages)
│   └── ui/                    # Shadcn UI components
├── pages/
│   ├── dashboard.tsx          # Main learning dashboard
│   ├── electronic-simulation.tsx  # Simulation workspace
│   ├── course-detail.tsx      # Course content viewer
│   ├── about.tsx              # About page
│   └── not-found.tsx          # 404 page
├── lib/
│   ├── simulation-engine.ts   # Graph-based electrical simulation
│   ├── circuit-types.ts       # Component metadata and terminals
│   ├── mock-data.ts           # Mock data for courses & components
│   ├── queryClient.ts         # TanStack Query config
│   └── utils.ts               # Utility functions
└── App.tsx                    # Main app with routing
```

### Backend Structure
```
server/
├── index.ts          # Express server entry
├── routes.ts         # API endpoints
├── storage.ts        # In-memory storage with mock data
└── vite.ts           # Vite dev server integration

shared/
└── schema.ts         # TypeScript types & Drizzle schemas
```

### Key API Endpoints
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `PATCH /api/courses/:id/progress` - Update course progress
- `GET /api/components` - List electronic components
- `GET /api/components/:id` - Get component details

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, TanStack Query, Wouter
- **Backend:** Express.js, In-memory storage
- **UI Components:** Shadcn/ui
- **Icons:** Lucide React
- **Simulation:** Custom graph-based electrical engine

## User Preferences
- Light theme (no dark mode for this project)
- Professional SaaS aesthetic
- Minimal animations (calm, smooth, purposeful)
- Clean, learning-focused design

## Running the Project
The app runs on port 5000 with `npm run dev` which starts both the Express backend and Vite frontend.

---

## Running Locally in VS Code

### Prerequisites
- Node.js 20+ installed
- npm or yarn package manager
- Git

### Setup Steps

1. **Clone or download the project**
   ```bash
   git clone <your-repo-url>
   cd <project-folder>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5000`

### VS Code Recommended Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer
- ES7+ React/Redux/React-Native snippets

### Project Scripts
- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run check` - Type check with TypeScript

### Environment Variables
No environment variables are required for local development. The app uses in-memory storage.

### Folder Structure for Development
When working locally:
- Frontend code: `client/src/`
- Backend code: `server/`
- Shared types: `shared/`
- UI components: `client/src/components/ui/`

### Debugging Tips
1. Use the Debug Panel (toggle from Control Panel) to see:
   - Detected circuits and their power/ground status
   - Net voltages across the circuit
   - Component states (LED glowing, buzzer active, etc.)
   - Errors like missing ground, short circuits

2. Browser DevTools console shows any runtime errors

3. TypeScript errors appear in VS Code's Problems panel
