# IIS Deployment Guide — Tixora

## Domain
`ninja-libs-latest-dev.slashdatauae.com`

## Architecture
```
IIS Site (root)          → Frontend (static files from dist/)
  └── /api (virtual dir) → .NET 10 API (publish/ folder)
```

## Prerequisites
- Windows Server with IIS
- .NET 10 Hosting Bundle installed
- IIS URL Rewrite module installed (for SPA routing)
- SQL Server accessible from server

## Build Commands

### API
```bash
dotnet publish src/Tixora.API -c Release -o ./publish
```

### Frontend
```bash
cd frontend
npm run build
```

### Zip for Transfer
```powershell
Compress-Archive -Path publish/* -DestinationPath publish.zip -Force
Compress-Archive -Path frontend/dist/* -DestinationPath frontend-dist.zip -Force
```

## Deployment Steps

### 1. Frontend
- Unzip `frontend-dist.zip` into the IIS site root folder
- `web.config` is included (handles SPA routing — all non-file requests → `index.html`)
- No additional IIS config needed for the root site

### 2. API
- Create virtual directory `/api` under the site, pointing to a folder on the server
- Unzip `publish.zip` into that folder
- Edit `appsettings.json` on the server:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=10.117.1.205;Database=test;User Id=test.user;Password=welcome2026;Encrypt=True;TrustServerCertificate=True"
  },
  "AllowedOrigins": "https://ninja-libs-latest-dev.slashdatauae.com"
}
```

### 3. Database Migration
Run once from dev machine (or server if SDK installed):
```bash
dotnet ef database update --project src/Tixora.Infrastructure --startup-project src/Tixora.API --connection "Server=10.117.1.205;Database=test;User ID=test.user;Password=welcome2026;Encrypt=True;TrustServerCertificate=True;"
```

### 4. IIS App Pool
- Set the app pool for the `/api` virtual directory to **No Managed Code**
- Enable 32-bit apps: **False**

## URL Routing
- Frontend base URL: `https://ninja-libs-latest-dev.slashdatauae.com/api/api`
- Virtual directory `/api` passes requests to the .NET app
- Controller routes: `[Route("api/[controller]")]`
- Full request path example: `domain.com/api/api/auth/login` → IIS virtual dir `/api` → app sees `/api/auth/login` → matches controller

## Environment Files
- `frontend/.env.production`: `VITE_API_URL=https://ninja-libs-latest-dev.slashdatauae.com/api/api`
- `frontend/.env.development`: `VITE_API_URL=https://localhost:7255/api`

## Redeployment
```bash
# Rebuild + zip
dotnet publish src/Tixora.API -c Release -o ./publish
cd frontend && npm run build && cd ..
powershell -command "Compress-Archive -Path publish/* -DestinationPath publish.zip -Force"
powershell -command "Compress-Archive -Path frontend/dist/* -DestinationPath frontend-dist.zip -Force"

# Copy to server and unzip into respective IIS folders
```

## Troubleshooting
- **SPA routes 404**: Check IIS URL Rewrite module is installed and `web.config` is in site root
- **API 500**: Check `logs/` folder in the API directory for Serilog output
- **CORS errors**: Ensure `AllowedOrigins` in `appsettings.json` matches the exact domain (with https)
- **DB connection fails**: Verify SQL Server allows remote connections and firewall is open
