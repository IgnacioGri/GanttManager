# Gantt Manager - Project Management Tool

## Overview

Gantt Manager is a modern web application for creating and managing Gantt charts with smart date handling, weekend controls, and dependency calculations. The application provides an intuitive interface for project planning with features like task management, file attachments, progress tracking, and Excel export capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.
Default timeline scale: Days (changed from Week to provide more detailed daily view by default)

## Recent Changes

### Deployment Health Check Fix - COMPLETED (January 27, 2025)
- Added health check routes for deployment systems at `/`, `/health`, and `/api/health`
- Root route returns simple "OK" text response for deployment health monitoring
- Additional health endpoints provide JSON responses with system status information
- Routes configured to load before static file serving to ensure proper priority
- Addresses deployment failure issues related to health check timeouts

### Dark Mode for Gantt Chart - COMPLETED (January 27, 2025)
- Complete dark mode implementation for frappe-gantt library elements
- SVG-specific CSS selectors targeting .gantt elements (grid-header, grid-row, arrows, text)
- Dark color variants for task bars in dark mode (darker purple, blue, etc.)
- Fixed visibility issues: dates, numbers, arrows, and labels now visible in dark theme
- Text styling with proper contrast: white text with shadows on task bars
- Grid and timeline elements adapted with proper stroke and fill colors
- User preference: All text elements clearly visible with proper contrast ratios

### Excel Import/Export System - COMPLETED (January 27, 2025)
- Complete Excel import functionality for creating projects from spreadsheets
- Excel template generation with proper formatting and column structure
- Smart date parsing supporting DD/MM/YYYY format from Excel
- Automatic project, task, and tag creation from Excel data
- Minimal required columns (only name, start date, end date are mandatory)
- Optional columns for progress, dependencies, tags, and comments
- Integration in sidebar with dedicated import button
- User preference: Only 3 columns mandatory, rest optional with no assumptions

### Multi-User Authentication System - COMPLETED (January 27, 2025)
- Full Replit Auth integration with PostgreSQL user management
- Complete data isolation between users (projects, tasks, tags)
- Landing page for non-authenticated users
- Secure session management with database storage
- Authentication middleware on all protected routes
- User-specific data access patterns throughout application

### Tags System Implementation - COMPLETED (January 27, 2025)
- Full tags system implemented with complete CRUD operations
- Backend schema and storage layer for tags with project association
- TagManager component for creating and managing tags with custom colors
- Task modal integration for selecting multiple tags per task
- Space-efficient visualization using colored circles with tooltips
- Tags displayed in task list with hover information

### Documentation and User Manual - COMPLETED (January 27, 2025)
- Comprehensive user manual created at `/help` route accessible from sidebar
- Detailed documentation covering all features and workflows
- MANUAL-USUARIO.md file with complete Spanish documentation
- Help button integrated in both collapsed and expanded sidebar states
- Manual covers: projects, tasks, tags, dependencies, synchronization, progress tracking
- Added Excel import/export documentation with detailed usage instructions
- Includes template download process, file structure, and troubleshooting tips

### Weekend Control Feature - REMOVED (January 26, 2025)
- Feature completely removed after multiple failed implementation attempts
- Issue: Frappe Gantt library does not support weekend hiding functionality
- User decision: Remove feature entirely to focus on core Gantt functionality

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Frappe Gantt library for interactive Gantt chart visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design with structured error handling
- **File Handling**: Multer middleware for file upload processing
- **Storage**: In-memory storage implementation with interface for future database integration

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL
- **Schema**: Structured tables for projects and tasks with JSON fields for complex data
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### Data Models
- **Projects**: Core project entities with name, start/end dates, and timestamps
- **Tasks**: Individual tasks with dependencies, progress tracking, attachments, and weekend handling options
- **Attachments**: File storage as base64-encoded JSON with metadata

### UI Components
- **GanttChart**: Interactive visualization using Frappe Gantt with custom styling
- **TaskModal**: Comprehensive task creation/editing with date pickers and dependency management
- **CommentsModal**: Dedicated interface for task comments and notes
- **ProjectListModal**: Project browsing with search and progress indicators
- **Sidebar**: Navigation and project controls with timeline scale options

### Business Logic
- **Date Utilities**: Weekend detection, business day calculations, and date formatting
- **Gantt Utilities**: Task transformation for chart library compatibility
- **Excel Export**: XLSX generation with formatted task data and styling

## Data Flow

### Client-Server Communication
1. **API Requests**: RESTful endpoints for CRUD operations on projects and tasks
2. **File Uploads**: Base64 encoding for attachments with size limits
3. **Query Management**: TanStack Query for caching, synchronization, and optimistic updates
4. **Error Handling**: Centralized error management with user-friendly toast notifications

### State Management
1. **Server State**: Managed by TanStack Query with automatic caching and invalidation
2. **Local State**: React hooks for component-specific state (modals, forms, UI toggles)
3. **Form State**: React Hook Form with Zod validation for type-safe form handling

## External Dependencies

### Core Libraries
- **UI Framework**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS for utility-first styling
- **Charts**: Frappe Gantt for interactive timeline visualization
- **Forms**: React Hook Form with Hookform Resolvers for validation
- **Validation**: Zod for runtime type validation and schema generation

### Development Tools
- **Build**: Vite with React plugin and TypeScript support
- **Database**: Drizzle ORM with PostgreSQL adapter
- **File Processing**: Multer for multipart form handling
- **Excel Export**: SheetJS (xlsx) for spreadsheet generation

### Replit Integration
- **Development**: Replit-specific plugins for error handling and cartographer integration
- **Deployment**: Configured for Replit's environment with appropriate build scripts

## Deployment Strategy

### Development Environment
- **Server**: Express.js with Vite middleware for HMR and asset serving
- **Database**: Neon Database with connection pooling
- **Build**: Development server with hot module replacement

### Production Build
- **Frontend**: Static assets built with Vite and served by Express
- **Backend**: Bundled Node.js application with ESBuild
- **Database**: Production PostgreSQL with connection string from environment variables
- **Deployment**: Single-server architecture suitable for Replit hosting

### Configuration Management
- **Environment Variables**: Database connection strings and feature flags
- **Build Scripts**: Separate development and production workflows
- **Static Assets**: Optimized bundling with asset fingerprinting for caching