# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zone Watch is a full-stack web application with machine learning capabilities for zone monitoring and analysis. The project uses a microservices architecture with Docker Compose orchestration.

## Development Commands

### Starting the Development Environment
```bash
# Start all services (recommended for development)
docker compose up

# Start specific services only
docker compose up backend frontend postgres
```

### Frontend Development (React + TypeScript + Vite)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend Development (FastAPI + Python)
```bash
cd backend
uv sync                # Install dependencies using uv (recommended)
# OR
pip install -e .       # Install using pip with pyproject.toml
uvicorn main:app --reload --host 0.0.0.0 --port 8000    # Start development server
```

### Database Operations
```bash
# Access PostgreSQL database
docker compose exec postgres psql -U user -d mydatabase

# Run Alembic migrations (from backend directory)
cd backend
alembic upgrade head    # Apply migrations
alembic revision --autogenerate -m "description"    # Create new migration
```

## Architecture Overview

### Service Architecture
- **Frontend**: React 19 with TypeScript, Vite, Material-UI, TailwindCSS, and React Leaflet for mapping
- **Backend**: FastAPI with SQLAlchemy, Alembic for migrations, JWT authentication
- **Database**: PostgreSQL for primary data storage
- **ML Platform**: DAGsHub for experiment tracking and model management (remote)
- **Notebooks**: Jupyter for data analysis and model development

### Backend Structure
- `main.py`: FastAPI application entry point with CORS and health endpoints
- `app/core/`: Core functionality (database, config, security)
- `app/api/routers/`: API route handlers
- `app/models/`: SQLAlchemy database models
- `app/schemas/`: Pydantic request/response schemas
- `app/repositories/`: Data access layer
- `app/services/`: Business logic layer
- `alembic/`: Database migration scripts
- `tests/`: Test suites

### Frontend Structure
- `src/main.tsx`: Application entry point
- `src/components/`: React components organized by feature
  - `common/`: Shared components (theme, navigation, containers)
  - `layout/`: Layout components (PageLayout, sidebar)
  - `heatmap/`: Heatmap visualization components
- `src/types/`: TypeScript type definitions
- `src/utils/`: Utility functions

### Configuration Management
The application uses environment-based configuration:
- `.env.example`: Template with all required environment variables
- `backend/app/core/config.py`: Settings class using environment variables
- All services are configurable via environment variables in docker-compose.yml

### Key Technologies
- **Frontend**: React 19-rc, TypeScript, Vite, Material-UI v7, TailwindCSS v4, Leaflet maps
- **Backend**: FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, python-jose for JWT
- **Infrastructure**: Docker, PostgreSQL 15, Jupyter, DAGsHub (remote MLflow)

### Development Workflow
1. Copy `.env.example` to `.env` and configure as needed
2. Use `docker compose up` to start all services
3. Frontend available at http://localhost:5173
4. Backend API at http://localhost:8000 (with auto-docs at /docs)
5. Jupyter at http://localhost:8888
6. MLflow tracking via DAGsHub (remote)

### Database Schema
The application uses Alembic for database migrations. The backend uses SQLAlchemy 2.0 modern syntax with async support.

### Authentication
JWT-based authentication is configured but not yet implemented in the routes. Security settings are centralized in `app/core/config.py`.

### ML Integration
MLflow tracking is integrated via DAGsHub for remote experiment tracking and model management. Jupyter notebooks are available for data analysis and model development.