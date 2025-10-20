# Claim Management System

## Overview

This is a multi-department claim management system designed for Sales, Technical, and Factory teams to collaborate on customer defect tracking and resolution. The application provides a comprehensive workflow for managing claims from initial receipt through technical review, factory investigation, and final resolution. Built with React, Express, and PostgreSQL, it features a Material Design-inspired interface with full internationalization support (Japanese/English).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query for server state management and caching

**UI Component Strategy**
- shadcn/ui component library built on Radix UI primitives
- Material Design principles adapted for enterprise productivity
- Tailwind CSS with custom design tokens for consistent theming
- Dark/light mode support with localStorage persistence
- Responsive layout with mobile breakpoint at 768px

**State Management**
- TanStack Query for server state (claims, user data)
- React hooks (useState, useEffect) for local UI state
- Form state managed via react-hook-form with Zod validation
- i18next for internationalization with locale persistence

**Design System**
- Custom color palette defined in CSS variables for theme switching
- Status-based color coding (NEW: amber, WAITING_TECH: blue, etc.)
- Elevation system using rgba overlays for hover/active states
- Typography using system font stack for performance

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for API routes
- ESM module system for modern JavaScript features
- Custom middleware for request logging and error handling
- Vite integration in development for HMR support

**Data Layer**
- Drizzle ORM for type-safe database queries
- PostgreSQL as primary database (via Neon serverless)
- Schema-first approach with Drizzle migrations
- Zod schemas derived from Drizzle for runtime validation

**API Design**
- RESTful conventions with /api prefix for all routes
- JSON request/response format
- Session-based authentication (prepared with connect-pg-simple)
- Error responses with standardized structure

**Current Implementation Status**
- Database schema defined for claims and users tables
- Storage interface abstraction (currently using in-memory implementation)
- Routes registered but endpoints not yet implemented
- Frontend mockup with static data for UI development

### Database Schema

**Claims Table**
- Primary key: UUID (auto-generated)
- Unique identifier: tcarNo (claim tracking number)
- Customer information: name, defect ID, part number, DC code
- Defect details: name, count, occurrence date
- Workflow tracking: status, received date, due date
- Assignment fields: assignee, assigneeTech, assigneeFactory
- Resolution tracking: correctiveAction, preventiveAction
- Metadata: createdBy, createdAt, updatedAt

**Users Table**
- Primary key: UUID (auto-generated)
- Credentials: username (unique), password
- Prepared for role-based access control expansion

**Status Workflow**
- NEW → WAITING_TECH → REQUESTED_FACTORY → WAITING_FACTORY_REPORT → TECH_REVIEW → FACTORY_REWORK → COMPLETED
- Each status has distinct color coding for visual recognition

### Code Organization

**Monorepo Structure**
- `/client` - React frontend application
- `/server` - Express backend API
- `/shared` - Shared types and schemas between frontend/backend
- `/migrations` - Drizzle database migrations

**Path Aliases**
- `@/` - Client source directory
- `@shared/` - Shared schemas and types
- `@assets/` - Static assets directory

**Key Architectural Patterns**
- Component composition with prop-based API
- Presentation/container component separation
- Custom hooks for reusable logic (use-toast, use-mobile)
- Schema validation at API boundaries using Zod

## External Dependencies

### Database & ORM
- **Neon Database** (@neondatabase/serverless) - Serverless PostgreSQL hosting
- **Drizzle ORM** (drizzle-orm, drizzle-kit) - Type-safe SQL query builder
- **drizzle-zod** - Zod schema generation from Drizzle schemas

### UI Component Libraries
- **Radix UI** - Unstyled, accessible component primitives (20+ components)
- **shadcn/ui** - Pre-built component patterns using Radix
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### State & Data Management
- **TanStack Query** (@tanstack/react-query) - Server state management
- **React Hook Form** (@hookform/resolvers) - Form state and validation
- **Zod** - Runtime type validation and schema generation

### Internationalization
- **i18next** - Internationalization framework
- **react-i18next** - React bindings for i18next
- Supported languages: Japanese (ja), English (en)
- Translation keys organized by feature area

### Development Tools
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety across entire stack
- **ESBuild** - Production bundling for server code
- **Replit Plugins** - Development experience enhancements (cartographer, dev-banner, runtime-error-modal)

### Utility Libraries
- **date-fns** - Date manipulation and formatting
- **clsx** & **tailwind-merge** - Conditional className composition
- **class-variance-authority** - Component variant management
- **nanoid** - Unique ID generation

### Session Management (Prepared)
- **connect-pg-simple** - PostgreSQL session store for Express
- Authentication system scaffolded but not yet implemented