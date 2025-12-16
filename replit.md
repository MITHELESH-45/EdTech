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
- Mock simulation logic for basic circuits

## Recent Changes
- December 16, 2025: Initial MVP implementation
  - Created all core pages (Dashboard, Electronic Simulation, Course Detail, About)
  - Implemented component palette with electronic components (LED, Resistor, Button, etc.)
  - Built circuit canvas with drag-and-drop placement and wire drawing
  - Added mock simulation logic (LED + Resistor + 5V + GND = LED ON)
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
│   │   └── control-panel.tsx      # Simulation controls & status
│   └── ui/                    # Shadcn UI components
├── pages/
│   ├── dashboard.tsx          # Main learning dashboard
│   ├── electronic-simulation.tsx  # Simulation workspace
│   ├── course-detail.tsx      # Course content viewer
│   ├── about.tsx              # About page
│   └── not-found.tsx          # 404 page
├── lib/
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

## User Preferences
- Light theme (no dark mode for this project)
- Professional SaaS aesthetic
- Minimal animations (calm, smooth, purposeful)
- Clean, learning-focused design

## Running the Project
The app runs on port 5000 with `npm run dev` which starts both the Express backend and Vite frontend.
