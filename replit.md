# Chatly - Multi-Platform Chat Application

## Overview

Chatly is a modern real-time chat application inspired by Instagram and Discord's design patterns. It provides direct messaging, group channels, and real-time presence features with a clean, photo-centric aesthetic. The application uses a React frontend with TypeScript, Express backend, WebSocket for real-time communication, and PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and dev server for fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing (alternative to React Router)

**UI Component System**
- **shadcn/ui** components built on Radix UI primitives for accessible, customizable components
- **Tailwind CSS** for utility-first styling with custom design tokens
- **class-variance-authority (CVA)** for managing component variants
- Design system follows Instagram's clean aesthetic with Discord-inspired navigation patterns

**State Management & Data Fetching**
- **TanStack Query (React Query)** for server state management, caching, and automatic refetching
- Custom query client with 401 handling for authentication flows
- WebSocket hook (`useWebSocket`) for real-time message delivery, typing indicators, and presence

**Real-time Communication**
- WebSocket connection managed through custom hook
- Handles: online/offline status, typing indicators, new messages, reactions
- Automatic reconnection and authentication on connect

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript for API routes and middleware
- **HTTP + WebSocket** hybrid server for REST endpoints and real-time features
- Session-based authentication using **Replit Auth** (OpenID Connect)

**API Design**
- RESTful endpoints for CRUD operations (channels, messages, friendships)
- WebSocket events for real-time features (typing, presence, message broadcasts)
- Middleware for authentication checks and request logging

**Real-time Features**
- WebSocket server tracks connected clients by user ID
- Broadcast mechanisms for channel-specific and global events
- Typing indicators with timeout cleanup
- Online/offline presence tracking

### Database Architecture

**ORM & Schema**
- **Drizzle ORM** for type-safe database queries and migrations
- PostgreSQL as the database (via Neon serverless driver)
- Schema defined in `shared/schema.ts` for client-server type sharing

**Data Models**
- **users**: Profile data, status, bio, authentication info
- **channels**: Direct messages, group chats, server channels with privacy settings
- **channelMembers**: Many-to-many relationship with role-based permissions (owner, admin, member)
- **messages**: Content, sender, channel, reply threads, timestamps
- **reactions**: Emoji reactions linked to messages and users
- **friendships**: User relationships with status tracking (pending, accepted, blocked)
- **sessions**: Express session storage for authentication persistence

**Storage Layer**
- Abstraction interface (`IStorage`) in `server/storage.ts`
- Provides methods for all database operations
- Returns typed entities matching shared schema definitions

### Authentication & Authorization

**Authentication Strategy**
- **Replit Auth** integration using OpenID Connect with Passport.js
- Session-based authentication with PostgreSQL session store (`connect-pg-simple`)
- Sessions persist for 7 days with HTTP-only, secure cookies
- Token refresh handled automatically via OIDC library

**Authorization Patterns**
- `isAuthenticated` middleware protects routes requiring login
- Channel membership verification before message access
- Role-based permissions for channel operations (owner/admin privileges)

### Build & Deployment

**Development Mode**
- Vite dev server with HMR for client
- tsx for running TypeScript server directly
- Concurrent development with client and server hot reload

**Production Build**
- Client: Vite builds to `dist/public` with code splitting and optimization
- Server: esbuild bundles to single `dist/index.cjs` with selective dependency bundling
- Build script (`script/build.ts`) coordinates both builds
- Selected dependencies bundled to reduce cold start times (openat syscall optimization)

## External Dependencies

### Third-party Services

**Replit Platform**
- **Replit Auth**: Primary authentication provider using OpenID Connect
- Provides user identity, profile information, and session management
- Environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

**Database**
- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL database
- WebSocket-based connection pooling via `@neondatabase/serverless`
- Connection string via `DATABASE_URL` environment variable
- Drizzle ORM handles schema migrations and type-safe queries

### Key Libraries

**Frontend**
- `@tanstack/react-query`: Server state management and caching
- `@radix-ui/*`: Accessible UI primitives (dialogs, dropdowns, tooltips, etc.)
- `date-fns`: Date formatting and manipulation
- `lucide-react`: Icon library
- `react-hook-form` + `@hookform/resolvers`: Form handling with Zod validation
- `zod`: Schema validation shared between client and server

**Backend**
- `express`: Web server framework
- `ws`: WebSocket server implementation
- `passport` + `passport-local` + `openid-client`: Authentication
- `express-session` + `connect-pg-simple`: Session management
- `drizzle-orm` + `drizzle-zod`: Database ORM and schema validation
- `zod-validation-error`: User-friendly validation error messages

**Shared**
- TypeScript for end-to-end type safety
- Path aliases (`@/`, `@shared/`) for clean imports
- Monorepo structure with `client/`, `server/`, and `shared/` directories