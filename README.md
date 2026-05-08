# MindCare - Mental Health Application

## Project Structure

This project has been organized into separate frontend and backend directories for better maintainability.

```
mindcare/
├── backend/                 # Python Flask backend server
│   ├── server.py           # Main server file
│   ├── requirements.txt    # Python dependencies
│   ├── package.json        # Scripts for running Python server
│   └── .env.example        # Environment variables template
├── frontend/               # React frontend application
│   ├── src/                # React source code
│   │   ├── App.tsx         # Main React component
│   │   ├── main.tsx        # Entry point
│   │   ├── lib/            # Frontend utilities
│   │   └── types.ts        # TypeScript types
│   ├── components/         # Reusable UI components
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # Shared utilities
│   ├── index.html          # HTML template
│   ├── vite.config.ts      # Vite configuration
│   ├── package.json        # Frontend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── package.json            # Root package.json with scripts
└── README.md              # This file
```

## Development

### Prerequisites
- Node.js installed (for frontend)
- Python 3.8+ installed (for backend)
- npm or yarn

### Installation
```bash
npm run install:all
```

Or install separately:
```bash
# Install backend dependencies
npm run install:backend

# Install frontend dependencies
npm run install:frontend
```

### API Key Setup

1. Copy the environment template:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Set your GEMINI_API_KEY in `backend/.env`:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. The API key will be automatically provided to the frontend via the `/api/config` endpoint.

### Development Mode
Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
# Backend only (port 3000) - Python Flask
npm run dev:backend

# Frontend only (port 5173) - React with Vite
npm run dev:frontend
```

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm run start
```

## Architecture

- **Backend**: Python Flask server running on port 3000, serves API endpoints and static frontend files
- **Frontend**: React SPA built with Vite, runs on port 5173 in development
- **API Proxy**: Frontend proxies `/api/*` requests to backend during development

## Backend API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/config` - Provides frontend configuration including GEMINI_API_KEY
- `POST /api/upload` - File upload endpoint (supports up to 16MB files)
- `POST /api/analyze` - Data analysis endpoint

## Features

- AI-powered mental health support
- Facial recognition capabilities
- Audio processing and analysis
- Internationalization support
- Modern UI with TailwindCSS and shadcn/ui components
