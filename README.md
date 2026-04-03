# Tixora - Strategic Partner Management Portal

Internal operations portal for managing partner-facing requests across 4 government-integrated platforms in the UAE. All users are internal employees.

[![.NET](https://github.com/kbalasubramaniam-sd/Tixora/actions/workflows/dotnet.yml/badge.svg)](https://github.com/kbalasubramaniam-sd/Tixora/actions/workflows/dotnet.yml)

## Products

| Product | Code | Access Type | Description |
|---------|------|-------------|-------------|
| Rabet   | RBT  | Portal + API | Insurance data to ICP |
| Rhoon   | RHN  | Portal + API | Mortgage transactions |
| Wtheeq  | WTQ  | API only     | Document verification |
| Mulem   | MLM  | API only     | Motor vehicle data |

## Tech Stack

**Backend:** .NET 10 (ASP.NET Core Web API), Clean Architecture, SQL Server, EF Core 10, JWT Auth

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Query, React Hook Form, Zod

**Testing:** xUnit (backend), Playwright (E2E)

## Architecture

Clean Architecture monolith with 4 layers:

```
src/
  Tixora.Domain/          # Entities, enums, value objects
  Tixora.Application/     # Use cases, interfaces, DTOs, validators
  Tixora.Infrastructure/  # EF Core, DbContext, repositories, services
  Tixora.API/             # Controllers, middleware, DI config
frontend/                 # React SPA (built separately)
```

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- SQL Server (LocalDB or Express)

### Backend

```bash
# Build
dotnet build src/Tixora.sln

# Apply database migrations
dotnet ef database update --project src/Tixora.Infrastructure --startup-project src/Tixora.API

# Run API (https://localhost:7255)
dotnet run --project src/Tixora.API
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Dev server (http://localhost:5173)
npm run dev

# Production build
npm run build
```

### Environment

- Backend config: `src/Tixora.API/appsettings.json`
- Frontend API URL: `frontend/.env.development` (`VITE_API_URL`)

## Running Tests

### Backend

```bash
# All tests
dotnet test

# Unit tests only
dotnet test tests/Tixora.Domain.Tests
dotnet test tests/Tixora.Application.Tests
```

### Frontend E2E (requires API running)

```bash
cd frontend

# Run all Playwright tests
npx playwright test

# Interactive UI mode
npx playwright test --ui

# View test report
npx playwright show-report
```

## Partner Lifecycle

```
None --> [T-01 Agreement] --> Onboarded --> [T-02 UAT] --> UatActive --> [T-03 Production] --> Live
```

- **T-01:** Agreement Validation & Sign-off
- **T-02:** UAT Access Creation
- **T-03:** Production Account Creation
- **T-04:** Access & Credential Support (available when Live)

## Ticket ID Format

```
SPM-[PRODUCT]-[TASK]-[YYYYMMDD]-[SEQ]
```

Example: `SPM-RBT-T01-20260403-001`
