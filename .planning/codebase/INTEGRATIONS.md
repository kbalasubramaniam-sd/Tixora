# External Integrations

**Analysis Date:** 2026-04-01

## APIs & External Services

**Government Authority Platforms:**
- Rabet - Platform for Federal Authority for Identity, Citizenship, Customs & Port Security (ICP)
  - Data flow: Health insurance company data to ICP system
  - Integration sensitivity: High (real-time data transfer to federal authority)
  - Scope: MVP 1 supports transactional access; integration details deferred to MVP 2

- Rhoon - Platform for Abu Dhabi Police (ADP) and Integrated Transport Centre (ITC)
  - Data flow: Mortgage-related transactions for 180+ financing entities
  - Integration sensitivity: High (live transactional data to government authorities)
  - Scope: MVP 1 transactional support; API/portal full integration in later phases

- Wtheeq - Vehicle Insurance Data Platform (ADP/ITC)
  - Data flow: Insurance data from 38+ insurance companies to ADP/ITC
  - Integration sensitivity: High (unified government vehicle database)
  - Scope: API read-only access; portal access not required

- Mulem - Unified Motor Insurance Data Platform
  - Data flow: Direct API access to government driver/vehicle/accident history
  - Integration sensitivity: High (personal and vehicle data)
  - Scope: API read-only access; credential security required

**Architectural Approach:**
- No external workflow orchestration packages (custom WorkflowEngine.cs implementation)
- Workflow rules are seeded in database (static in MVP 1, configurable in future)
- No external SaaS integrations for core MVP 1 functionality

## Data Storage

**Databases:**
- SQL Server - Primary relational database
  - Connection: Via connection string in `appsettings.json` / environment variables
  - Client: Entity Framework Core 8 (ORM for .NET)
  - Schema: Clean Architecture domain entities mapped via EF Core DbContext
  - Migrations: Managed via `dotnet ef` CLI (Entity Framework Core migrations)
  - Location: Database scaffolding in `Tixora.Infrastructure` project

**File Storage:**
- Local filesystem only (MVP 1)
- Document handling deferred to MVP 2
- No cloud storage integration (S3, Azure Blob, etc.) in current scope

**Caching:**
- None detected or configured in MVP 1
- Deferred to future optimization phases

## Authentication & Identity

**Auth Provider:**
- Custom implementation (not external SSO in MVP 1)
  - Implementation: Fake auth middleware with seeded users + JWT token generation
  - Seeded Users: Test user accounts in database seed
  - Token Generation: JWT tokens issued on successful authentication
  - Location: `Tixora.API` middleware layer

**Real SSO Integration:**
- Deferred to MVP 2
- Design anticipates integration with enterprise SSO (likely Azure AD or similar)
- JWT token structure designed for easy SSO provider swap

## Monitoring & Observability

**Error Tracking:**
- Not detected in MVP 1 scope
- Deferred to future phases

**Logging:**
- Application logging via standard .NET Core `ILogger` interface
- Configuration via `appsettings.json`
- Console output for development; production logger configuration TBD

**Audit Trail:**
- In-app audit records via domain events (custom implementation)
- Ticket status changes and approvals tracked in database
- No external audit logging service (MVP 1)

## CI/CD & Deployment

**Hosting:**
- Not yet configured (infrastructure scaffolding pending)
- Expected targets: Azure App Service, IIS, or Docker container
- ASP.NET Core ready for containerized deployment

**CI Pipeline:**
- Not yet configured
- `.gitignore` includes `launchSettings.json` (Visual Studio launch profiles for development)
- Future: GitHub Actions or Azure Pipelines expected

**Build Commands:**
- Backend build: `dotnet build src/Tixora.sln`
- Frontend build: `npm run build` (TypeScript compilation + Vite bundling)
- Testing: `dotnet test` (backend unit/integration tests)

## Environment Configuration

**Required Backend Environment Variables:**
- `ASPNETCORE_ENVIRONMENT` - Execution environment (Development/Production)
- Database connection string - SQL Server connection details
- JWT signing key - Secret for token generation
- (Additional SLA/product config will move to seeded database in MVP 1)

**Required Frontend Environment Variables:**
- API base URL - Backend API endpoint (e.g., `http://localhost:5000` for dev)

**Secrets Location:**
- Local development: `.env` files (git-ignored, never committed)
- Backend: `appsettings.Development.json` (git-ignored, Visual Studio only)
- Production: Environment variables via hosting platform (Azure Key Vault, Docker secrets, etc.)
- Never committed: `.env`, `appsettings.Development.json`, or any credential files

## Webhooks & Callbacks

**Incoming Webhooks:**
- None planned for MVP 1
- External partner systems do not push data to SPM (pull-based integration expected)

**Outgoing Webhooks:**
- Email notifications deferred to MVP 2
- In-app notifications only for MVP 1
- Future: Partner notification webhooks may be added post-launch

## Partner Integration Scope (MVP 1)

**Portal Access (Transactional Products):**
- Rabet (RBT) - Both portal + API
- Rhoon (RHN) - Both portal + API
- Direct partner access to ticket status, document uploads, and request submission

**API-Only Products:**
- Wtheeq (WTQ) - API read-only
- Mulem (MLM) - API read-only
- Credentials provisioning; no portal UI visibility

**No External Partner Visibility:**
- SPM is fully internal; partners never access or see the portal
- Partner contact references are internal relationship owners
- All partner communication deferred to MVP 2 (email notifications)

---

*Integration audit: 2026-04-01*
