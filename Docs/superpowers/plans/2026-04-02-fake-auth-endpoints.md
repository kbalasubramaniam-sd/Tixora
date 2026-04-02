# Fake Auth + Basic Endpoints — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add JWT-based fake authentication using the 12 seeded users with BCrypt password validation, expose `/api/auth/login` and `/api/auth/me` endpoints, plus read-only endpoints for products and partners. This provides the auth foundation that MVP 2 will swap to real SSO.

**Architecture:** Clean Architecture monolith with `Domain` <- `Application` <- `Infrastructure` <- `API` layers. `IAuthService` interface in Application; `AuthService` implementation in Infrastructure (depends on BCrypt.Net-Next). DTOs in Application/DTOs. Controllers in API/Controllers.

**Tech Stack:** .NET 10, EF Core 10, SQL Server, BCrypt.Net-Next, JWT Bearer Auth, Scalar, xUnit, WebApplicationFactory, InMemory provider

---

## Task 1: Auth DTOs

### Step 1.1 — Create LoginRequest DTO

- [ ] Create `src/Tixora.Application/DTOs/Auth/LoginRequest.cs`

```csharp
// File: src/Tixora.Application/DTOs/Auth/LoginRequest.cs
namespace Tixora.Application.DTOs.Auth;

public record LoginRequest(string Email, string Password);
```

### Step 1.2 — Create UserProfileResponse DTO

- [ ] Create `src/Tixora.Application/DTOs/Auth/UserProfileResponse.cs`

```csharp
// File: src/Tixora.Application/DTOs/Auth/UserProfileResponse.cs
namespace Tixora.Application.DTOs.Auth;

public record UserProfileResponse(Guid Id, string FullName, string Email, string Role);
```

### Step 1.3 — Create LoginResponse DTO

- [ ] Create `src/Tixora.Application/DTOs/Auth/LoginResponse.cs`

```csharp
// File: src/Tixora.Application/DTOs/Auth/LoginResponse.cs
namespace Tixora.Application.DTOs.Auth;

public record LoginResponse(string Token, UserProfileResponse User);
```

### Step 1.4 — Build verification

- [ ] Run `dotnet build src/Tixora.Application/Tixora.Application.csproj` and confirm no errors.

### Step 1.5 — Commit

- [ ] Commit:
```bash
git add src/Tixora.Application/DTOs/Auth/LoginRequest.cs src/Tixora.Application/DTOs/Auth/UserProfileResponse.cs src/Tixora.Application/DTOs/Auth/LoginResponse.cs
git commit -m "$(cat <<'EOF'
feat: add auth DTOs — LoginRequest, LoginResponse, UserProfileResponse

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Product and Partner DTOs

### Step 2.1 — Create ProductResponse DTO

- [ ] Create `src/Tixora.Application/DTOs/Products/ProductResponse.cs`

```csharp
// File: src/Tixora.Application/DTOs/Products/ProductResponse.cs
namespace Tixora.Application.DTOs.Products;

public record ProductResponse(string Code, string Name, string Description, string PortalType);
```

### Step 2.2 — Create PartnerListResponse DTO

- [ ] Create `src/Tixora.Application/DTOs/Partners/PartnerListResponse.cs`

```csharp
// File: src/Tixora.Application/DTOs/Partners/PartnerListResponse.cs
namespace Tixora.Application.DTOs.Partners;

public record PartnerListResponse(Guid Id, string Name, string? Alias, List<PartnerProductInfo> Products);

public record PartnerProductInfo(string ProductCode, string ProductName, string LifecycleState, string? CompanyCode);
```

### Step 2.3 — Build verification

- [ ] Run `dotnet build src/Tixora.Application/Tixora.Application.csproj` and confirm no errors.

### Step 2.4 — Commit

- [ ] Commit:
```bash
git add src/Tixora.Application/DTOs/Products/ProductResponse.cs src/Tixora.Application/DTOs/Partners/PartnerListResponse.cs
git commit -m "$(cat <<'EOF'
feat: add product and partner DTOs — ProductResponse, PartnerListResponse

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: IAuthService Interface

### Step 3.1 — Create IAuthService

- [ ] Create `src/Tixora.Application/Interfaces/IAuthService.cs`

```csharp
// File: src/Tixora.Application/Interfaces/IAuthService.cs
using Tixora.Application.DTOs.Auth;

namespace Tixora.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
}
```

### Step 3.2 — Build verification

- [ ] Run `dotnet build src/Tixora.Application/Tixora.Application.csproj` and confirm no errors.

### Step 3.3 — Commit

- [ ] Commit:
```bash
git add src/Tixora.Application/Interfaces/IAuthService.cs
git commit -m "$(cat <<'EOF'
feat: add IAuthService interface in Application layer

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: AuthService Implementation

### Step 4.1 — Add package references to Infrastructure

BCrypt.Net-Next is already in Infrastructure.csproj. We also need `System.IdentityModel.Tokens.Jwt` and `Microsoft.AspNetCore.Authentication.JwtBearer` for token generation. However, these are already in the API project. For Infrastructure, we only need `System.IdentityModel.Tokens.Jwt` (the token creation library). We also need `Microsoft.Extensions.Configuration.Abstractions` to inject `IConfiguration`.

- [ ] Add packages to `src/Tixora.Infrastructure/Tixora.Infrastructure.csproj`:

```xml
<!-- Add these two PackageReferences to the existing <ItemGroup> with packages -->
<PackageReference Include="Microsoft.Extensions.Configuration.Abstractions" Version="10.0.5" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.3.0" />
```

The full `<ItemGroup>` with packages should now be:

```xml
<ItemGroup>
    <PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="10.0.5" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="10.0.5" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.0.5">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.Extensions.Configuration.Abstractions" Version="10.0.5" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.3.0" />
</ItemGroup>
```

### Step 4.2 — Create AuthService

- [ ] Create `src/Tixora.Infrastructure/Services/AuthService.cs`

```csharp
// File: src/Tixora.Infrastructure/Services/AuthService.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Tixora.Application.DTOs.Auth;
using Tixora.Application.Interfaces;

namespace Tixora.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly ITixoraDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthService(ITixoraDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user is null || !user.IsActive)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        var token = GenerateJwtToken(user);

        var profile = new UserProfileResponse(
            user.Id,
            user.FullName,
            user.Email,
            user.Role.ToString());

        return new LoginResponse(token, profile);
    }

    private string GenerateJwtToken(Domain.Entities.User user)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key is not configured.");
        var issuer = _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
        var audience = _configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
        var expiryHours = int.Parse(
            _configuration["Jwt:ExpiryHours"]
            ?? throw new InvalidOperationException("Jwt:ExpiryHours is not configured."));

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, ((int)user.Role).ToString()),
            new Claim(ClaimTypes.Name, user.FullName)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

### Step 4.3 — Build verification

- [ ] Run `dotnet build src/Tixora.Infrastructure/Tixora.Infrastructure.csproj` and confirm no errors.

### Step 4.4 — Commit

- [ ] Commit:
```bash
git add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj src/Tixora.Infrastructure/Services/AuthService.cs
git commit -m "$(cat <<'EOF'
feat: add AuthService with BCrypt verification and JWT generation

AuthService lives in Infrastructure (depends on BCrypt.Net-Next).
Validates user credentials, generates JWT with sub/email/role/name claims.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: JWT Configuration + Program.cs

### Step 5.1 — Add Jwt section to appsettings.json

- [ ] Edit `src/Tixora.API/appsettings.json` to add the `Jwt` section. The final file should be:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=SDSHJ-KARTHIKEY\\SQLEXPRESS;Database=TixoraDb;Integrated Security=True;Persist Security Info=False;Pooling=False;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Command Timeout=0"
  },
  "Jwt": {
    "Key": "TixoraDev_SuperSecret_Key_2026_MustBe32Chars!!",
    "Issuer": "Tixora.API",
    "Audience": "Tixora.Client",
    "ExpiryHours": 24
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Step 5.2 — Register AuthService in DependencyInjection.cs

- [ ] Edit `src/Tixora.Infrastructure/DependencyInjection.cs` to register `IAuthService`:

```csharp
// File: src/Tixora.Infrastructure/DependencyInjection.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Tixora.Application.Interfaces;
using Tixora.Infrastructure.Data;
using Tixora.Infrastructure.Services;

namespace Tixora.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<TixoraDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(TixoraDbContext).Assembly.FullName)));

        services.AddScoped<ITixoraDbContext>(provider => provider.GetRequiredService<TixoraDbContext>());
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
```

### Step 5.3 — Add JWT Bearer auth to Program.cs

- [ ] Edit `src/Tixora.API/Program.cs` to configure JWT authentication:

```csharp
// File: src/Tixora.API/Program.cs
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using Tixora.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience is not configured.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});
builder.Services.AddAuthorization();

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Make Program class accessible to integration tests
public partial class Program { }
```

### Step 5.4 — Build verification

- [ ] Run `dotnet build src/Tixora.API/Tixora.API.csproj` and confirm no errors.

### Step 5.5 — Commit

- [ ] Commit:
```bash
git add src/Tixora.API/appsettings.json src/Tixora.Infrastructure/DependencyInjection.cs src/Tixora.API/Program.cs
git commit -m "$(cat <<'EOF'
feat: configure JWT Bearer authentication in Program.cs

Add Jwt config to appsettings.json, register AuthService in DI,
add UseAuthentication before UseAuthorization in pipeline.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: AuthController

### Step 6.1 — Create AuthController

- [ ] Create `src/Tixora.API/Controllers/AuthController.cs`

```csharp
// File: src/Tixora.API/Controllers/AuthController.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs.Auth;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Authenticate with email and password. Returns a JWT token and user profile.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (result is null)
            return Unauthorized(new { message = "Invalid email or password." });

        return Ok(result);
    }

    /// <summary>
    /// Get the current authenticated user's profile from JWT claims.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Me()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = User.FindFirstValue(JwtRegisteredClaimNames.Email)
            ?? User.FindFirstValue(ClaimTypes.Email);
        var role = User.FindFirstValue(ClaimTypes.Role);
        var name = User.FindFirstValue(ClaimTypes.Name);

        if (userId is null || email is null || role is null || name is null)
            return Unauthorized();

        var profile = new UserProfileResponse(
            Guid.Parse(userId),
            name,
            email,
            role);

        return Ok(profile);
    }
}
```

**Note on claim mapping:** ASP.NET Core's JWT handler may remap `sub` to `ClaimTypes.NameIdentifier` and `email` to `ClaimTypes.Email`. The controller checks both claim keys to handle either mapping behavior. If claim mapping is an issue, we can disable it in Task 5's JWT configuration by setting `MapInboundClaims = false` on the `JwtBearerOptions`. See Step 6.2 for this fix.

### Step 6.2 — Disable inbound claim mapping (prevents sub→nameidentifier remapping)

- [ ] Edit the JWT bearer config in `src/Tixora.API/Program.cs`. Inside the `.AddJwtBearer(options => { ... })` block, add this line after `TokenValidationParameters`:

Add this line inside the `.AddJwtBearer` options block, right before the closing `});`:

```csharp
    options.MapInboundClaims = false;
```

The full `.AddJwtBearer` block should now be:

```csharp
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
    options.MapInboundClaims = false;
});
```

With `MapInboundClaims = false`, the claims keep their original JWT names (`sub`, `email`), so the `Me()` endpoint can use `JwtRegisteredClaimNames.Sub` and `JwtRegisteredClaimNames.Email` directly. Update the `Me()` method to use a cleaner approach now that mapping is disabled:

```csharp
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Me()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var email = User.FindFirstValue(JwtRegisteredClaimNames.Email);
        var role = User.FindFirstValue(ClaimTypes.Role);
        var name = User.FindFirstValue(ClaimTypes.Name);

        if (userId is null || email is null || role is null || name is null)
            return Unauthorized();

        var profile = new UserProfileResponse(
            Guid.Parse(userId),
            name,
            email,
            role);

        return Ok(profile);
    }
```

**Important:** With `MapInboundClaims = false`, the `ClaimTypes.Role` claim (`http://schemas.microsoft.com/ws/2008/06/identity/claims/role`) will NOT be mapped from a JWT claim named `role`. Since `AuthService` writes the role as `ClaimTypes.Role` (the full URI), it will be preserved as-is in the JWT, and `FindFirstValue(ClaimTypes.Role)` will find it. Same for `ClaimTypes.Name`. This works because the AuthService writes the full URI claim types, and disabling mapping means those URIs pass through unchanged.

### Step 6.3 — Build verification

- [ ] Run `dotnet build src/Tixora.API/Tixora.API.csproj` and confirm no errors.

### Step 6.4 — Commit

- [ ] Commit:
```bash
git add src/Tixora.API/Controllers/AuthController.cs src/Tixora.API/Program.cs
git commit -m "$(cat <<'EOF'
feat: add AuthController with POST /login and GET /me endpoints

Disable inbound claim mapping so JWT claims use standard names.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: ProductsController

### Step 7.1 — Create ProductsController

- [ ] Create `src/Tixora.API/Controllers/ProductsController.cs`

```csharp
// File: src/Tixora.API/Controllers/ProductsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Products;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ITixoraDbContext _db;

    public ProductsController(ITixoraDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Get all products.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var products = await _db.Products
            .AsNoTracking()
            .OrderBy(p => p.Code)
            .Select(p => new ProductResponse(
                p.Code.ToString(),
                p.Name,
                p.Description,
                p.PortalType.ToString()))
            .ToListAsync();

        return Ok(products);
    }
}
```

### Step 7.2 — Build verification

- [ ] Run `dotnet build src/Tixora.API/Tixora.API.csproj` and confirm no errors.

### Step 7.3 — Commit

- [ ] Commit:
```bash
git add src/Tixora.API/Controllers/ProductsController.cs
git commit -m "$(cat <<'EOF'
feat: add ProductsController — GET /api/products (no auth required)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: PartnersController

### Step 8.1 — Create PartnersController

- [ ] Create `src/Tixora.API/Controllers/PartnersController.cs`

```csharp
// File: src/Tixora.API/Controllers/PartnersController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Partners;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PartnersController : ControllerBase
{
    private readonly ITixoraDbContext _db;

    public PartnersController(ITixoraDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Get all partners with their product associations.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<PartnerListResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll()
    {
        var partners = await _db.Partners
            .AsNoTracking()
            .Include(p => p.PartnerProducts)
                .ThenInclude(pp => pp.Product)
            .OrderBy(p => p.Name)
            .Select(p => new PartnerListResponse(
                p.Id,
                p.Name,
                p.Alias,
                p.PartnerProducts.Select(pp => new PartnerProductInfo(
                    pp.ProductCode.ToString(),
                    pp.Product.Name,
                    pp.LifecycleState.ToString(),
                    pp.CompanyCode
                )).ToList()))
            .ToListAsync();

        return Ok(partners);
    }
}
```

### Step 8.2 — Build verification

- [ ] Run `dotnet build src/Tixora.API/Tixora.API.csproj` and confirm no errors.

### Step 8.3 — Commit

- [ ] Commit:
```bash
git add src/Tixora.API/Controllers/PartnersController.cs
git commit -m "$(cat <<'EOF'
feat: add PartnersController — GET /api/partners (auth required)

Returns all partners with product associations and lifecycle state.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Integration Tests

### Step 9.1 — Add project reference to Application

The test project already references API, Infrastructure, and Domain. It also already has `Microsoft.AspNetCore.Mvc.Testing` and `Microsoft.EntityFrameworkCore.InMemory`. Check that `Tixora.Application` is reachable transitively through the API project reference — it is, since API references Application. No additional project reference needed.

### Step 9.2 — Create test fixture (CustomWebApplicationFactory)

- [ ] Create `tests/Tixora.API.Tests/CustomWebApplicationFactory.cs`

```csharp
// File: tests/Tixora.API.Tests/CustomWebApplicationFactory.cs
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Tixora.Application.Interfaces;
using Tixora.Infrastructure.Data;

namespace Tixora.API.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the real SQL Server DbContext registration
            var dbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<TixoraDbContext>));
            if (dbContextDescriptor is not null)
                services.Remove(dbContextDescriptor);

            var dbContextServiceDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(TixoraDbContext));
            if (dbContextServiceDescriptor is not null)
                services.Remove(dbContextServiceDescriptor);

            var itixoraDbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(ITixoraDbContext));
            if (itixoraDbContextDescriptor is not null)
                services.Remove(itixoraDbContextDescriptor);

            // Add InMemory database
            services.AddDbContext<TixoraDbContext>(options =>
            {
                options.UseInMemoryDatabase("TixoraTestDb_" + Guid.NewGuid().ToString("N"));
            });

            services.AddScoped<ITixoraDbContext>(provider =>
                provider.GetRequiredService<TixoraDbContext>());

            // Ensure database is created with seed data
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TixoraDbContext>();
            db.Database.EnsureCreated();
        });

        builder.UseEnvironment("Development");
    }
}
```

**Important InMemory + Seed Data note:** `EnsureCreated()` calls `OnModelCreating`, which triggers all the `HasData` seed calls. The InMemory provider respects `HasData` seed data when `EnsureCreated()` is called. This means all 12 users, 4 products, 3 partners, and 6 partner-products will be available in the test database.

### Step 9.3 — Create test helpers

- [ ] Create `tests/Tixora.API.Tests/TestHelpers.cs`

```csharp
// File: tests/Tixora.API.Tests/TestHelpers.cs
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Auth;

namespace Tixora.API.Tests;

public static class TestHelpers
{
    /// <summary>
    /// Log in as a seeded user and return the JWT token.
    /// </summary>
    public static async Task<string> GetAuthTokenAsync(HttpClient client, string email = "sarah.ahmad@tixora.ae", string password = "Password1!")
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        response.EnsureSuccessStatusCode();

        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponse>();
        return loginResponse!.Token;
    }

    /// <summary>
    /// Set the Authorization header with a Bearer token.
    /// </summary>
    public static void SetBearerToken(HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
}
```

### Step 9.4 — Create AuthControllerTests

- [ ] Create `tests/Tixora.API.Tests/AuthControllerTests.cs`

```csharp
// File: tests/Tixora.API.Tests/AuthControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Auth;

namespace Tixora.API.Tests;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200WithTokenAndUser()
    {
        // Arrange
        var request = new LoginRequest("sarah.ahmad@tixora.ae", "Password1!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal("Sarah Ahmad", result.User.FullName);
        Assert.Equal("sarah.ahmad@tixora.ae", result.User.Email);
        Assert.Equal("Requester", result.User.Role);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        // Arrange
        var request = new LoginRequest("sarah.ahmad@tixora.ae", "WrongPassword!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_NonExistentEmail_Returns401()
    {
        // Arrange
        var request = new LoginRequest("nonexistent@tixora.ae", "Password1!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_CaseInsensitiveEmail_Returns200()
    {
        // Arrange
        var request = new LoginRequest("SARAH.AHMAD@TIXORA.AE", "Password1!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(result);
        Assert.Equal("Sarah Ahmad", result.User.FullName);
    }

    [Fact]
    public async Task Me_WithValidToken_Returns200WithProfile()
    {
        // Arrange
        var token = await TestHelpers.GetAuthTokenAsync(_client);
        TestHelpers.SetBearerToken(_client, token);

        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var profile = await response.Content.ReadFromJsonAsync<UserProfileResponse>();
        Assert.NotNull(profile);
        Assert.Equal("Sarah Ahmad", profile.FullName);
        Assert.Equal("sarah.ahmad@tixora.ae", profile.Email);
    }

    [Fact]
    public async Task Me_WithoutToken_Returns401()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
```

### Step 9.5 — Create ProductsControllerTests

- [ ] Create `tests/Tixora.API.Tests/ProductsControllerTests.cs`

```csharp
// File: tests/Tixora.API.Tests/ProductsControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Products;

namespace Tixora.API.Tests;

public class ProductsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ProductsControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetProducts_Returns200With4Products()
    {
        // Act
        var response = await _client.GetAsync("/api/products");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var products = await response.Content.ReadFromJsonAsync<List<ProductResponse>>();
        Assert.NotNull(products);
        Assert.Equal(4, products.Count);

        var codes = products.Select(p => p.Code).ToList();
        Assert.Contains("RBT", codes);
        Assert.Contains("RHN", codes);
        Assert.Contains("WTQ", codes);
        Assert.Contains("MLM", codes);
    }

    [Fact]
    public async Task GetProducts_NoAuthRequired_Returns200()
    {
        // Act — no auth token set
        var response = await _client.GetAsync("/api/products");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
```

### Step 9.6 — Create PartnersControllerTests

- [ ] Create `tests/Tixora.API.Tests/PartnersControllerTests.cs`

```csharp
// File: tests/Tixora.API.Tests/PartnersControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Partners;

namespace Tixora.API.Tests;

public class PartnersControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PartnersControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetPartners_WithValidToken_Returns200With3Partners()
    {
        // Arrange
        var token = await TestHelpers.GetAuthTokenAsync(_client);
        TestHelpers.SetBearerToken(_client, token);

        // Act
        var response = await _client.GetAsync("/api/partners");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var partners = await response.Content.ReadFromJsonAsync<List<PartnerListResponse>>();
        Assert.NotNull(partners);
        Assert.Equal(3, partners.Count);

        // Verify partner names (alphabetically ordered)
        Assert.Equal("Al Ain Insurance", partners[0].Name);
        Assert.Equal("Dubai Islamic Bank", partners[1].Name);
        Assert.Equal("Emirates Insurance", partners[2].Name);
    }

    [Fact]
    public async Task GetPartners_Returns6PartnerProducts()
    {
        // Arrange
        var token = await TestHelpers.GetAuthTokenAsync(_client);
        TestHelpers.SetBearerToken(_client, token);

        // Act
        var response = await _client.GetAsync("/api/partners");

        // Assert
        var partners = await response.Content.ReadFromJsonAsync<List<PartnerListResponse>>();
        Assert.NotNull(partners);

        var totalProducts = partners.Sum(p => p.Products.Count);
        Assert.Equal(6, totalProducts);

        // Al Ain Insurance has 2 products (RBT, WTQ)
        var aai = partners.First(p => p.Name == "Al Ain Insurance");
        Assert.Equal(2, aai.Products.Count);

        // Dubai Islamic Bank has 2 products (RHN, MLM)
        var dib = partners.First(p => p.Name == "Dubai Islamic Bank");
        Assert.Equal(2, dib.Products.Count);

        // Emirates Insurance has 2 products (RBT, RHN)
        var eic = partners.First(p => p.Name == "Emirates Insurance");
        Assert.Equal(2, eic.Products.Count);
    }

    [Fact]
    public async Task GetPartners_WithoutToken_Returns401()
    {
        // Act — no auth token set
        var response = await _client.GetAsync("/api/partners");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
```

### Step 9.7 — Build verification

- [ ] Run `dotnet build tests/Tixora.API.Tests/Tixora.API.Tests.csproj` and confirm no errors.

### Step 9.8 — Run tests

- [ ] Run `dotnet test tests/Tixora.API.Tests/Tixora.API.Tests.csproj` and confirm all tests pass.

**Troubleshooting:** If InMemory provider does not seed `HasData`, the issue is that InMemory + `EnsureCreated()` does handle `HasData` in EF Core 10. If tests fail with empty data, verify the `CustomWebApplicationFactory` calls `db.Database.EnsureCreated()`.

If `ClaimTypes.Role` is not found by `Me()` due to claim mapping, double-check that `MapInboundClaims = false` is set in Task 6 Step 6.2. With mapping disabled, the full-URI claim names written by `AuthService` (`ClaimTypes.Role` = `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`) will be preserved in the JWT and matched correctly.

### Step 9.9 — Commit

- [ ] Commit:
```bash
git add tests/Tixora.API.Tests/CustomWebApplicationFactory.cs tests/Tixora.API.Tests/TestHelpers.cs tests/Tixora.API.Tests/AuthControllerTests.cs tests/Tixora.API.Tests/ProductsControllerTests.cs tests/Tixora.API.Tests/PartnersControllerTests.cs
git commit -m "$(cat <<'EOF'
feat: add integration tests for auth, products, and partners endpoints

Tests use WebApplicationFactory with InMemory database and seeded data.
Covers login (valid/invalid/case-insensitive), /me, /products, /partners.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Full Build + Test Verification

### Step 10.1 — Full solution build

- [ ] Run `dotnet build src/Tixora.sln` and confirm no errors.

### Step 10.2 — Full test run

- [ ] Run `dotnet test` and confirm all tests pass (including any pre-existing tests in Tixora.Infrastructure.Tests).

### Step 10.3 — Manual smoke test (optional)

- [ ] Run `dotnet run --project src/Tixora.API` and test in Scalar UI:
  1. Open `https://localhost:{port}/scalar/v1`
  2. POST `/api/auth/login` with `{"email": "sarah.ahmad@tixora.ae", "password": "Password1!"}` — expect 200 with token
  3. Copy the token, set `Authorization: Bearer {token}` header
  4. GET `/api/auth/me` — expect 200 with Sarah's profile
  5. GET `/api/products` — expect 200 with 4 products (no auth needed)
  6. GET `/api/partners` — expect 200 with 3 partners (auth required)

---

## Summary of Files Created/Modified

### New files:
| File | Layer |
|------|-------|
| `src/Tixora.Application/DTOs/Auth/LoginRequest.cs` | Application |
| `src/Tixora.Application/DTOs/Auth/LoginResponse.cs` | Application |
| `src/Tixora.Application/DTOs/Auth/UserProfileResponse.cs` | Application |
| `src/Tixora.Application/DTOs/Products/ProductResponse.cs` | Application |
| `src/Tixora.Application/DTOs/Partners/PartnerListResponse.cs` | Application |
| `src/Tixora.Application/Interfaces/IAuthService.cs` | Application |
| `src/Tixora.Infrastructure/Services/AuthService.cs` | Infrastructure |
| `src/Tixora.API/Controllers/AuthController.cs` | API |
| `src/Tixora.API/Controllers/ProductsController.cs` | API |
| `src/Tixora.API/Controllers/PartnersController.cs` | API |
| `tests/Tixora.API.Tests/CustomWebApplicationFactory.cs` | Tests |
| `tests/Tixora.API.Tests/TestHelpers.cs` | Tests |
| `tests/Tixora.API.Tests/AuthControllerTests.cs` | Tests |
| `tests/Tixora.API.Tests/ProductsControllerTests.cs` | Tests |
| `tests/Tixora.API.Tests/PartnersControllerTests.cs` | Tests |

### Modified files:
| File | Change |
|------|--------|
| `src/Tixora.Infrastructure/Tixora.Infrastructure.csproj` | Add Configuration.Abstractions + JWT package |
| `src/Tixora.Infrastructure/DependencyInjection.cs` | Register IAuthService → AuthService |
| `src/Tixora.API/appsettings.json` | Add Jwt config section |
| `src/Tixora.API/Program.cs` | Add JWT Bearer auth + UseAuthentication |
