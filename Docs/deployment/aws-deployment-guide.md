# Tixora — AWS Deployment Guide (Step-by-Step)

> First-time AWS deployment. Every step explained. No prior AWS experience needed.

## What We're Building

```
[Browser] → CloudFront (CDN) → S3 (React static files)
                ↓
[Browser] → App Runner (API) → RDS SQL Server (Database)
```

- **S3 + CloudFront** = hosts your React frontend (fast, globally cached)
- **App Runner** = runs your .NET API in a Docker container (auto-managed)
- **RDS** = managed SQL Server database (backups, patches handled by AWS)

## Prerequisites

Before starting:
1. AWS account with $200 credit activated
2. Git repo is public (fine — no secrets go in code)
3. Docker Desktop installed locally (for building the API image)
4. AWS CLI installed: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
5. .NET 10 SDK installed locally

---

## Phase 1: AWS Account Setup (~10 min)

### Step 1.1: Install & Configure AWS CLI

```bash
# After installing AWS CLI, configure it:
aws configure
```

It will ask for:
- **AWS Access Key ID** — get from AWS Console → IAM → Users → Your user → Security Credentials → Create Access Key
- **AWS Secret Access Key** — shown once when you create the key, save it
- **Default region** — enter `me-south-1` (Bahrain, closest to UAE)
- **Output format** — enter `json`

### Step 1.2: Enable me-south-1 Region

Bahrain (me-south-1) is an opt-in region. Enable it:
1. Go to AWS Console → top-right dropdown (your account name) → **Account**
2. Scroll to **AWS Regions** section
3. Find **Middle East (Bahrain)** → click **Enable**
4. Wait ~5 minutes for it to activate

---

## Phase 2: Database — RDS SQL Server (~15 min)

### Step 2.1: Create RDS Instance

1. Go to AWS Console → search **RDS** → click **Create database**
2. Choose:
   - **Engine:** Microsoft SQL Server
   - **Edition:** SQL Server Express (free tier eligible)
   - **Templates:** Free tier
   - **DB instance identifier:** `tixora-db`
   - **Master username:** `tixoraadmin`
   - **Master password:** choose something strong, **write it down**
   - **DB instance class:** `db.t3.micro` (free tier)
   - **Storage:** 20 GB General Purpose SSD (default)
   - **Connectivity:** 
     - VPC: Default VPC
     - Public access: **Yes** (for initial setup — we'll lock it down later)
     - Security group: Create new → name it `tixora-db-sg`
   - **Database name:** leave blank (we'll create it via EF migration)
3. Click **Create database** — takes 5-10 minutes

### Step 2.2: Configure Security Group

While RDS is creating:
1. Go to **EC2** → **Security Groups** → find `tixora-db-sg`
2. **Inbound rules** → Edit → Add rule:
   - Type: **MSSQL** (port 1433)
   - Source: **My IP** (for local access during setup)
   - Add another rule: Source: **Custom** → the App Runner security group (we'll add this later)
3. Save

### Step 2.3: Get the Connection String

Once RDS is ready:
1. Go to RDS → Databases → `tixora-db`
2. Copy the **Endpoint** (e.g., `tixora-db.abc123.me-south-1.rds.amazonaws.com`)
3. Your connection string will be:

```
Server=tixora-db.abc123.me-south-1.rds.amazonaws.com,1433;Database=TixoraDb;User Id=tixoraadmin;Password=YOUR_PASSWORD;TrustServerCertificate=True;
```

### Step 2.4: Run EF Migration

From your local machine, pointing at the RDS instance:

```bash
# Set the connection string temporarily
export ConnectionStrings__DefaultConnection="Server=tixora-db.abc123.me-south-1.rds.amazonaws.com,1433;Database=TixoraDb;User Id=tixoraadmin;Password=YOUR_PASSWORD;TrustServerCertificate=True;"

# Generate migration for all E3/E4/FedEx entities
cd C:/Claude/Tixora
dotnet ef migrations add E3E4FedExEntities --project src/Tixora.Infrastructure --startup-project src/Tixora.API

# Apply migration to RDS
dotnet ef database update --project src/Tixora.Infrastructure --startup-project src/Tixora.API
```

This creates the database and all tables with seed data on RDS.

---

## Phase 3: Backend — Docker + ECR + App Runner (~20 min)

### Step 3.1: Create Dockerfile

Create `src/Tixora.API/Dockerfile`:

```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files
COPY Tixora.sln .
COPY Tixora.Domain/Tixora.Domain.csproj Tixora.Domain/
COPY Tixora.Application/Tixora.Application.csproj Tixora.Application/
COPY Tixora.Infrastructure/Tixora.Infrastructure.csproj Tixora.Infrastructure/
COPY Tixora.API/Tixora.API.csproj Tixora.API/

# Restore
RUN dotnet restore Tixora.API/Tixora.API.csproj

# Copy everything and build
COPY . .
RUN dotnet publish Tixora.API/Tixora.API.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Tixora.API.dll"]
```

### Step 3.2: Build & Test Docker Image Locally

```bash
cd C:/Claude/Tixora/src
docker build -t tixora-api -f Tixora.API/Dockerfile .

# Test it runs
docker run -p 8080:8080 \
  -e "ConnectionStrings__DefaultConnection=YOUR_RDS_CONNECTION_STRING" \
  -e "Jwt__Key=TixoraProd_SuperSecret_Key_2026_MustBe32Chars!!" \
  -e "Jwt__Issuer=Tixora.API" \
  -e "Jwt__Audience=Tixora.Client" \
  tixora-api

# Visit http://localhost:8080/scalar/v1 — should see API docs
```

### Step 3.3: Create ECR Repository (Container Registry)

```bash
# Create a repository to store your Docker image
aws ecr create-repository --repository-name tixora-api --region me-south-1

# Login to ECR
aws ecr get-login-password --region me-south-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.me-south-1.amazonaws.com
```

Find your account ID:
```bash
aws sts get-caller-identity --query Account --output text
```

### Step 3.4: Push Docker Image to ECR

```bash
# Tag the image
docker tag tixora-api:latest YOUR_ACCOUNT_ID.dkr.ecr.me-south-1.amazonaws.com/tixora-api:latest

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.me-south-1.amazonaws.com/tixora-api:latest
```

### Step 3.5: Create App Runner Service

1. Go to AWS Console → search **App Runner** → **Create service**
2. **Source:**
   - Repository type: **Amazon ECR**
   - Image URI: `YOUR_ACCOUNT_ID.dkr.ecr.me-south-1.amazonaws.com/tixora-api:latest`
   - Deployment trigger: **Manual** (we'll push and deploy on demand)
3. **Configure service:**
   - Service name: `tixora-api`
   - CPU: 1 vCPU
   - Memory: 2 GB
   - Port: `8080`
   - **Environment variables** (click "Add environment variable"):

| Key | Value |
|-----|-------|
| `ConnectionStrings__DefaultConnection` | `Server=tixora-db.abc123...;Database=TixoraDb;User Id=tixoraadmin;Password=...;TrustServerCertificate=True;` |
| `Jwt__Key` | `TixoraProd_SuperSecret_Key_2026_MustBe32Chars!!` |
| `Jwt__Issuer` | `Tixora.API` |
| `Jwt__Audience` | `Tixora.Client` |
| `Jwt__ExpiryHours` | `24` |
| `Email__Provider` | `None` |
| `Shipping__Provider` | `None` |
| `ASPNETCORE_ENVIRONMENT` | `Production` |

4. Click **Create & deploy** — takes 3-5 minutes
5. Once deployed, you'll get a URL like: `https://abc123.me-south-1.awsapprunner.com`
6. Test: visit `https://abc123.me-south-1.awsapprunner.com/scalar/v1`

---

## Phase 4: Frontend — S3 + CloudFront (~15 min)

### Step 4.1: Build the React App

```bash
cd C:/Claude/Tixora/frontend

# Set the production API URL
echo "VITE_API_URL=https://abc123.me-south-1.awsapprunner.com/api" > .env.production

# Build
npm run build
```

This creates a `dist/` folder with static HTML/JS/CSS.

### Step 4.2: Create S3 Bucket

```bash
# Create bucket (name must be globally unique)
aws s3 mb s3://tixora-frontend --region me-south-1

# Enable static website hosting
aws s3 website s3://tixora-frontend --index-document index.html --error-document index.html
```

The `--error-document index.html` is important — it makes React Router work (all paths serve index.html).

### Step 4.3: Upload the Build

```bash
# Sync the dist folder to S3
aws s3 sync frontend/dist/ s3://tixora-frontend --delete

# Make it publicly readable
aws s3api put-bucket-policy --bucket tixora-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::tixora-frontend/*"
  }]
}'
```

### Step 4.4: Create CloudFront Distribution

1. Go to AWS Console → **CloudFront** → **Create distribution**
2. **Origin:**
   - Origin domain: select your S3 bucket (`tixora-frontend.s3.me-south-1.amazonaws.com`)
   - Origin access: **Origin access control settings (recommended)** → Create new OAI
3. **Default cache behavior:**
   - Viewer protocol policy: **Redirect HTTP to HTTPS**
   - Cache policy: **CachingOptimized**
4. **Settings:**
   - Default root object: `index.html`
5. **Custom error responses** (important for React Router!):
   - Error code: 403 → Response page: `/index.html` → Response code: 200
   - Error code: 404 → Response page: `/index.html` → Response code: 200
6. Click **Create distribution** — takes 5-10 minutes to deploy globally
7. You'll get a URL like: `https://d1234abcd.cloudfront.net`

### Step 4.5: Test

Visit `https://d1234abcd.cloudfront.net` — you should see the Tixora login page!

---

## Phase 5: CORS Configuration

The API needs to allow requests from your CloudFront domain.

### Step 5.1: Update CORS in the API

Add your CloudFront URL to the CORS configuration. You have two options:

**Option A: Environment variable (recommended)**

Add an env var in App Runner:
| Key | Value |
|-----|-------|
| `AllowedOrigins` | `https://d1234abcd.cloudfront.net` |

Then update `Program.cs` to read from config:
```csharp
var allowedOrigins = builder.Configuration.GetValue<string>("AllowedOrigins")?.Split(',') 
    ?? new[] { "http://localhost:5173" };
```

**Option B: Hardcode temporarily**

In `Program.cs`, add the CloudFront URL to the existing CORS origins array.

### Step 5.2: Redeploy the API

```bash
# Rebuild and push
cd C:/Claude/Tixora/src
docker build -t tixora-api -f Tixora.API/Dockerfile .
docker tag tixora-api:latest YOUR_ACCOUNT_ID.dkr.ecr.me-south-1.amazonaws.com/tixora-api:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.me-south-1.amazonaws.com/tixora-api:latest

# Trigger deploy in App Runner Console → Deployments → Deploy
```

---

## Phase 6: Custom Domain (Optional)

### Step 6.1: Buy a Domain

- **Route 53:** AWS Console → Route 53 → Register domain → search for your name
- **Or any registrar:** Namecheap, GoDaddy, etc. — then point nameservers to Route 53

### Step 6.2: Create Hosted Zone (if domain bought elsewhere)

```bash
aws route53 create-hosted-zone --name tixora.ae --caller-reference $(date +%s)
```

Copy the 4 nameserver records shown → update them at your domain registrar.

### Step 6.3: Get HTTPS Certificate

1. Go to AWS Console → **ACM** (Certificate Manager) → **Request certificate**
2. **Important:** For CloudFront, request the cert in **us-east-1** (Virginia) — CloudFront only works with certs from that region
3. Domain names: `tixora.ae` and `*.tixora.ae` (wildcard)
4. Validation: **DNS validation** → click "Create records in Route 53" → auto-validates in ~5 min

### Step 6.4: Point Domain to CloudFront

1. CloudFront → your distribution → **Edit**
2. **Alternate domain name (CNAME):** add `tixora.ae` and `app.tixora.ae`
3. **SSL certificate:** select the ACM cert you just created
4. Save

5. Route 53 → Hosted zone → **Create record:**
   - Name: `app` (for app.tixora.ae)
   - Type: **A — Alias**
   - Route traffic to: **CloudFront distribution** → select yours

### Step 6.5: Point API Subdomain to App Runner

1. App Runner → your service → **Custom domains** → Link domain
2. Enter: `api.tixora.ae`
3. It gives you CNAME records → add them in Route 53
4. Update your frontend `.env.production`: `VITE_API_URL=https://api.tixora.ae/api`
5. Rebuild and redeploy frontend

---

## Deployment Cheat Sheet

### Redeploy Backend (after code changes)

```bash
cd C:/Claude/Tixora/src
docker build -t tixora-api -f Tixora.API/Dockerfile .
docker tag tixora-api:latest YOUR_ACCOUNT_ID.dkr.ecr.me-south-1.amazonaws.com/tixora-api:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.me-south-1.amazonaws.com/tixora-api:latest
# Then: App Runner Console → Deploy
```

### Redeploy Frontend (after code changes)

```bash
cd C:/Claude/Tixora/frontend
npm run build
aws s3 sync dist/ s3://tixora-frontend --delete
# CloudFront cache invalidation (optional, for instant update):
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Run EF Migration (after entity changes)

```bash
export ConnectionStrings__DefaultConnection="YOUR_RDS_CONNECTION_STRING"
dotnet ef database update --project src/Tixora.Infrastructure --startup-project src/Tixora.API
```

---

## Security Checklist

- [ ] RDS security group: only allows App Runner + your IP (remove "My IP" after setup)
- [ ] JWT secret key: use a strong 32+ char key, different from dev
- [ ] S3 bucket: public read only (no write)
- [ ] No secrets in git (all via env vars)
- [ ] CORS: only your CloudFront domain, not `*`
- [ ] When ready for Brevo: set `Email__Provider=Brevo` and `Email__Brevo__ApiKey=...` in App Runner env vars
- [ ] When ready for FedEx: set `Shipping__Provider=FedEx` and FedEx credentials in App Runner env vars

---

## Cost Breakdown (Monthly)

| Service | Cost |
|---------|------|
| App Runner (1 vCPU, 2GB) | ~$12/mo |
| RDS SQL Server Express (db.t3.micro) | Free tier (12 months) |
| S3 (static hosting) | ~$0.10/mo |
| CloudFront (CDN) | ~$1/mo |
| Route 53 (DNS) | $0.50/mo |
| ACM (HTTPS cert) | Free |
| ECR (container registry) | ~$0.50/mo |
| **Total** | **~$15/mo** |

Your $200 credit lasts ~13 months.
