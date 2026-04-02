# Fake Auth + Basic Endpoints — Design Spec

## Goal

Add JWT-based fake authentication using seeded users with BCrypt password validation, and expose basic read endpoints for products and partners. This provides the auth foundation that MVP 2 will swap to real SSO.

## Tech Stack

- .NET 10, ASP.NET Core Web API, EF Core 10
- `Microsoft.AspNetCore.Authentication.JwtBearer` (already in csproj)
- `System.IdentityModel.Tokens.Jwt` (already in csproj)
- `BCrypt.Net-Next` (already in Infrastructure csproj)

---

## 1. JWT Configuration

**appsettings.json** — add `Jwt` section:
```json
{
  "Jwt": {
    "Key": "TixoraDev_SuperSecret_Key_2026_MustBe32Chars!!",
    "Issuer": "Tixora.API",
    "Audience": "Tixora.Client",
    "ExpiryHours": 24
  }
}
```

**Program.cs** — configure JWT Bearer auth before `builder.Build()`:
- Read `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` from config
- Add `Authentication` with `JwtBearerDefaults.AuthenticationScheme`
- Validate issuer, audience, lifetime, signing key
- Add `app.UseAuthentication()` before `app.UseAuthorization()`

## 2. Auth Service

**Interface:** `src/Tixora.Application/Interfaces/IAuthService.cs`
```csharp
public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
}
```

**Implementation:** `src/Tixora.Application/Services/AuthService.cs`
- Injects `ITixoraDbContext` and `IConfiguration`
- `LoginAsync`: find user by email (case-insensitive), verify BCrypt hash, generate JWT with claims
- Claims: `sub` (user Id), `email`, `role` (UserRole int value as string), `name` (FullName)
- Returns null if user not found or password wrong

## 3. DTOs

All in `src/Tixora.Application/DTOs/`:

**Auth/LoginRequest.cs**
```csharp
public record LoginRequest(string Email, string Password);
```

**Auth/LoginResponse.cs**
```csharp
public record LoginResponse(string Token, UserProfileResponse User);
```

**Auth/UserProfileResponse.cs**
```csharp
public record UserProfileResponse(Guid Id, string FullName, string Email, string Role);
```

**Products/ProductResponse.cs**
```csharp
public record ProductResponse(string Code, string Name, string Description, string PortalType);
```

**Partners/PartnerListResponse.cs**
```csharp
public record PartnerListResponse(Guid Id, string Name, string? Alias, List<PartnerProductInfo> Products);
public record PartnerProductInfo(string ProductCode, string ProductName, string LifecycleState, string? CompanyCode);
```

## 4. Controllers

All in `src/Tixora.API/Controllers/`, using `[ApiController]` and `[Route("api/[controller]")]`.

### AuthController
- `POST /api/auth/login` — accepts `LoginRequest`, returns `LoginResponse` or 401
- `GET /api/auth/me` — `[Authorize]`, reads claims from `HttpContext.User`, returns `UserProfileResponse`

### ProductsController
- `GET /api/products` — no auth required, queries `ITixoraDbContext.Products`, maps to `ProductResponse` list

### PartnersController
- `GET /api/partners` — `[Authorize]`, queries partners with `.Include(p => p.PartnerProducts).ThenInclude(pp => pp.Product)`, maps to `PartnerListResponse` list

## 5. DI Registration

- Register `IAuthService` → `AuthService` as scoped in `AddInfrastructure` (or a new `AddApplication` extension method)
- JWT auth configured in `Program.cs`

## 6. Tests

Using existing `tests/Tixora.API.Tests/` project with `WebApplicationFactory<Program>`.

**AuthControllerTests:**
- Login with valid credentials → 200 + token + user data
- Login with wrong password → 401
- Login with non-existent email → 401
- GET /me with valid token → 200 + user profile
- GET /me without token → 401

**ProductsControllerTests:**
- GET /products → 200 + 4 products with correct codes

**PartnersControllerTests:**
- GET /partners with valid token → 200 + 3 partners with 6 partner-products
- GET /partners without token → 401
