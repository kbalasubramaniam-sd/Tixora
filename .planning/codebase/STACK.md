# Technology Stack

**Analysis Date:** 2026-04-01

## Languages

**Primary:**
- C# / .NET 8 - Backend API and business logic (ASP.NET Core Web API)
- TypeScript 5.9.3 - Frontend React application and type safety
- JavaScript - Build tooling and dev dependencies

**Secondary:**
- SQL (T-SQL) - SQL Server database queries via Entity Framework Core

## Runtime

**Backend Environment:**
- .NET 8 runtime (via ASP.NET Core)

**Frontend Environment:**
- Node.js (via npm for package management)
- Modern browser environments (ES2023 target)

**Package Manager:**
- npm (frontend) - `package.json` and `package-lock.json` present
- NuGet (backend, not yet scaffolded but referenced in commands)

## Frameworks

**Core Backend:**
- ASP.NET Core 8 (Web API) - HTTP API framework and routing
- Entity Framework Core - ORM for SQL Server database access
- Clean Architecture pattern - Layered domain/application/infrastructure/API structure

**Core Frontend:**
- React 19.2.4 - UI component framework and state management
- Vite 8.0.1 - Build tool and development server with HMR
- React DOM 19.2.4 - DOM rendering

**Testing:**
- Testing framework not yet scaffolded (planned for future phases)

**Build/Dev:**
- Vite 8.0.1 - ES modules-based build tool
- TypeScript compiler (tsc) - Strict type checking
- ESLint (flat config with Composer v9.39.4) - Linting and code quality
- TypeScript ESLint 8.57.0 - TypeScript-specific linting rules

## Key Dependencies

**Backend (Future Scaffolding):**
- Entity Framework Core - Database ORM and migrations
- Custom WorkflowEngine.cs - Seeded workflow rules engine (no external packages)

**Frontend:**
- `react` 19.2.4 - Core UI library
- `react-dom` 19.2.4 - DOM integration
- `vite` 8.0.1 - Build and dev server
- `typescript` 5.9.3 - Type system
- `@vitejs/plugin-react` 6.0.1 - React JSX support in Vite
- `eslint` 9.39.4 - Code linting
- `typescript-eslint` 8.57.0 - TypeScript linting integration
- `eslint-plugin-react-hooks` 7.0.1 - React Hooks best practices
- `eslint-plugin-react-refresh` 0.5.2 - Fast Refresh validation
- `globals` 17.4.0 - Global variable definitions
- `@types/react` 19.2.14 - Type definitions for React
- `@types/react-dom` 19.2.3 - Type definitions for React DOM
- `@types/node` 24.12.0 - Node.js type definitions for build tools

## Configuration

**Environment:**
- Environment variables via `.env` files (referenced in `.gitignore` - present in development)
- Separate configuration for development and production builds
- Backend uses `appsettings.json` and `appsettings.Development.json` (latter in `.gitignore`)

**Build Configuration:**
- Frontend: `vite.config.ts` - React plugin configuration with HMR enabled
- Frontend: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript project references
- Frontend: `eslint.config.js` - Flat config ESLint with React and TypeScript rules
- Backend: Solution file `src/Tixora.sln` (not yet created)
- Backend: Project files for `Tixora.Domain`, `Tixora.Application`, `Tixora.Infrastructure`, `Tixora.API` (scaffolding pending)

**TypeScript Compiler Options:**
- Target: ES2023
- Module: ESNext
- JSX: react-jsx (new automatic JSX transform)
- Strict mode enabled
- No unused locals or parameters allowed
- Skip lib checks enabled for faster compilation
- Bundler module resolution

## Platform Requirements

**Development:**
- Node.js (for npm and Vite dev server)
- .NET 8 SDK (for C# backend development)
- SQL Server (local dev instance or connection string via environment)
- Recommended: Visual Studio 2022 or VS Code with C# extension
- Vite dev server runs on default port (5173 typical)

**Production:**
- ASP.NET Core 8 capable hosting (Azure App Service, IIS, Linux container, etc.)
- SQL Server database (cloud or on-premises)
- Frontend built static assets served by backend or CDN
- No external email service (MVP 1 uses in-app notifications only)
- JWT authentication tokens (no external SSO integration in MVP 1)

**Browsers:**
- Modern browsers supporting ES2023 (Chrome 2023+, Firefox, Safari, Edge)
- No polyfills required for target ES version

---

*Stack analysis: 2026-04-01*
