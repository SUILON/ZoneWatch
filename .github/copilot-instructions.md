# ZoneWatch Copilot Instructions

## Project Overview
ZoneWatch is a full-stack emergency dispatch prediction system with ML capabilities. It features a React frontend with geospatial visualization, FastAPI backend with SQLAlchemy 2.0, and DAGsHub integration for ML model tracking.

## Architecture & Key Concepts

### Service Architecture
- **Frontend**: React 19-rc + TypeScript + Vite + Material-UI v7 + TailwindCSS v4 + Leaflet maps
- **Backend**: FastAPI + SQLAlchemy 2.0 (async) + Alembic + Pydantic v2
- **Database**: PostgreSQL 15 with UUID primary keys and modern async patterns
- **ML Platform**: DAGsHub (remote MLflow) for experiment tracking
- **Infrastructure**: Docker Compose with hot-reload for development

### Critical Development Patterns

#### Backend Layered Architecture
```
app/
├── core/           # Config, DB connection, security
├── api/routers/    # FastAPI route handlers
├── models/         # SQLAlchemy 2.0 async models
├── schemas/        # Pydantic request/response models
├── repositories/   # Data access layer
└── services/       # Business logic with DAGsHub integration
```

#### Frontend Component Organization
```
src/components/
├── common/         # Reusable UI components (ScrollableContainer, NavigationGuard)
├── layout/         # Page layout components (PageLayout, sidebar)
└── heatmap/        # Feature-specific components (Heatmap, LegendComponent, DateControl)
```

## Essential Development Commands

### Environment Setup (Always Required First)
```bash
# Copy environment template and configure
cp .env.example .env
# Start all services with hot-reload
docker compose up
```

### Frontend Development (Port 5173)
```bash
cd frontend
npm run dev     # Vite dev server with HMR
npm run build   # TypeScript compilation + Vite build
npm run lint    # ESLint with TypeScript rules
```

### Backend Development (Port 8000)
```bash
cd backend
uv sync                 # Install dependencies (preferred over pip)
alembic upgrade head    # Apply database migrations
# API docs available at http://localhost:8000/docs
```

### Database Operations
```bash
docker compose exec postgres psql -U user -d mydatabase
cd backend && alembic revision --autogenerate -m "description"
```

## Project-Specific Conventions

### Configuration Management
- **Backend**: Environment-based settings class in `app/core/config.py` with typed properties
- **Frontend**: Vite env variables with TypeScript definitions in `src/config.ts`
- All services configurable via `.env` file used by docker-compose

### Database Patterns
- **SQLAlchemy 2.0 modern async syntax** throughout (no legacy ORM patterns)
- **UUID primary keys** with `uuid4()` defaults
- **Alembic migrations** for all schema changes
- **Repository pattern** for data access abstraction

### API Design Patterns
- **Pydantic v2 schemas** with strict type validation and Field descriptions
- **Layered service architecture**: Router → Service → Repository → Model
- **Japanese comments** in code with English API documentation
- **Structured error handling** with HTTP status codes and detailed messages

### Frontend Architecture
- **Absolute imports** using `@/` path mapping (configured in tsconfig)
- **Material-UI v7 + TailwindCSS v4** hybrid styling approach
- **React 19-rc features** including modern hooks and concurrent features
- **Leaflet + React-Leaflet** for geospatial visualization with GeoJSON support

### ML Integration Patterns
- **DAGsHub integration** for remote MLflow tracking (not local MLflow)
- **Model versioning** with run IDs and confidence scores
- **Prediction storage** in PostgreSQL with full audit trail
- **Async prediction services** with proper error handling

## Testing & Quality

### Backend Testing
```bash
cd backend && python -m pytest tests/ -v
```
- **TestClient** for FastAPI integration tests
- **Mock services** for external dependencies (DAGsHub, models)
- **Database fixtures** with proper cleanup

### Frontend Testing
- **ESLint** with TypeScript strict rules
- **Type-safe** component props and event handlers
- **Material-UI theming** consistency across components

## Integration Points

### Critical External Dependencies
- **DAGsHub API**: Model registry and experiment tracking (requires DAGSHUB_USER_TOKEN)
- **PostgreSQL**: Primary data store with UUID-based relationships
- **GeoJSON files**: Static geographic data in `frontend/public/data/`

### Cross-Service Communication
- **API base URL**: Configurable via VITE_API_BASE_URL (default: localhost:8000)
- **CORS configuration**: Managed in backend config with frontend origin whitelist
- **Authentication**: JWT-based (configured but not yet implemented in routes)

## File Naming & Structure Conventions
- **Backend**: Snake_case for Python files, descriptive module names
- **Frontend**: PascalCase for components, camelCase for utilities
- **Database**: Snake_case table names with descriptive prefixes
- **Environment**: ALL_CAPS for environment variables with service prefixes

When making changes, always consider the async nature of the backend, the type safety requirements of the frontend, and the integration patterns with DAGsHub for ML functionality.