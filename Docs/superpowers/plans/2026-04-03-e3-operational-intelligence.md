# E3: Operational Intelligence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SLA tracking, in-app notifications, comments, documents, and audit trail to make Tixora operationally useful.

**Architecture:** Each chunk adds a Domain entity, Application interface + DTOs, Infrastructure service + EF config, API controller, and integration tests. Each chunk is independently mergeable to `frontend/foundation` for FE wiring. WorkflowEngine gets notification calls wired in at the end.

**Tech Stack:** .NET 10, EF Core 10, SQL Server, xUnit + WebApplicationFactory

**Worktree:** `backend/e3` branched from `frontend/foundation`

---

## File Map

### New Domain Entities
- `src/Tixora.Domain/Entities/Comment.cs`
- `src/Tixora.Domain/Entities/Document.cs`
- `src/Tixora.Domain/Entities/Notification.cs`
- `src/Tixora.Domain/Entities/SlaTracker.cs`
- `src/Tixora.Domain/Entities/SlaPause.cs`
- `src/Tixora.Domain/Entities/BusinessHoursConfig.cs`
- `src/Tixora.Domain/Entities/Holiday.cs`

### New Application Interfaces
- `src/Tixora.Application/Interfaces/ICommentService.cs`
- `src/Tixora.Application/Interfaces/IDocumentService.cs`
- `src/Tixora.Application/Interfaces/INotificationService.cs`
- `src/Tixora.Application/Interfaces/ISlaService.cs`
- `src/Tixora.Application/Interfaces/IFileStorage.cs`

### New Application DTOs
- `src/Tixora.Application/DTOs/Comments/CommentRequest.cs`
- `src/Tixora.Application/DTOs/Comments/CommentResponse.cs`
- `src/Tixora.Application/DTOs/Documents/DocumentResponse.cs`
- `src/Tixora.Application/DTOs/Notifications/NotificationResponse.cs`

### New Infrastructure Services
- `src/Tixora.Infrastructure/Services/CommentService.cs`
- `src/Tixora.Infrastructure/Services/DocumentService.cs`
- `src/Tixora.Infrastructure/Services/NotificationService.cs`
- `src/Tixora.Infrastructure/Services/SlaService.cs`
- `src/Tixora.Infrastructure/Services/LocalFileStorage.cs`
- `src/Tixora.Infrastructure/Services/SlaMonitoringService.cs` (BackgroundService)
- `src/Tixora.Infrastructure/Services/UatReminderService.cs` (BackgroundService)

### New EF Configurations
- `src/Tixora.Infrastructure/Data/Configurations/CommentConfiguration.cs`
- `src/Tixora.Infrastructure/Data/Configurations/DocumentConfiguration.cs`
- `src/Tixora.Infrastructure/Data/Configurations/NotificationConfiguration.cs`
- `src/Tixora.Infrastructure/Data/Configurations/SlaTrackerConfiguration.cs`
- `src/Tixora.Infrastructure/Data/Configurations/SlaPauseConfiguration.cs`
- `src/Tixora.Infrastructure/Data/Configurations/BusinessHoursConfigConfiguration.cs`
- `src/Tixora.Infrastructure/Data/Configurations/HolidayConfiguration.cs`

### New Seed Data
- `src/Tixora.Infrastructure/Data/Seed/SeedBusinessHours.cs`

### New API Controllers
- `src/Tixora.API/Controllers/CommentsController.cs` (nested: /api/tickets/{ticketId}/comments)
- `src/Tixora.API/Controllers/DocumentsController.cs` (/api/tickets/{ticketId}/documents + /api/documents/{id})
- `src/Tixora.API/Controllers/NotificationsController.cs` (/api/notifications)

### Modified Files
- `src/Tixora.Application/Interfaces/ITixoraDbContext.cs` — add DbSets for new entities
- `src/Tixora.Domain/Entities/Ticket.cs` — add navigation collections (Comments, Documents, SlaTrackers)
- `src/Tixora.Infrastructure/Data/TixoraDbContext.cs` — add DbSets
- `src/Tixora.Infrastructure/DependencyInjection.cs` — register new services
- `src/Tixora.Infrastructure/Services/WorkflowEngine.cs` — inject INotificationService, add notification calls
- `src/Tixora.Infrastructure/Services/TicketQueryService.cs` — wire real SLA data into responses
- `src/Tixora.API/Program.cs` — register BackgroundServices, configure file upload limits

### New Tests
- `tests/Tixora.API.Tests/Controllers/CommentsControllerTests.cs`
- `tests/Tixora.API.Tests/Controllers/DocumentsControllerTests.cs`
- `tests/Tixora.API.Tests/Controllers/NotificationsControllerTests.cs`
- `tests/Tixora.Infrastructure.Tests/Services/SlaServiceTests.cs`

---

## Task 1: Comments (E3.1)

**Files:**
- Create: `src/Tixora.Domain/Entities/Comment.cs`
- Create: `src/Tixora.Application/Interfaces/ICommentService.cs`
- Create: `src/Tixora.Application/DTOs/Comments/CommentRequest.cs`
- Create: `src/Tixora.Application/DTOs/Comments/CommentResponse.cs`
- Create: `src/Tixora.Infrastructure/Data/Configurations/CommentConfiguration.cs`
- Create: `src/Tixora.Infrastructure/Services/CommentService.cs`
- Create: `src/Tixora.API/Controllers/CommentsController.cs`
- Modify: `src/Tixora.Application/Interfaces/ITixoraDbContext.cs`
- Modify: `src/Tixora.Domain/Entities/Ticket.cs`
- Modify: `src/Tixora.Infrastructure/Data/TixoraDbContext.cs`
- Modify: `src/Tixora.Infrastructure/DependencyInjection.cs`
- Create: `tests/Tixora.API.Tests/Controllers/CommentsControllerTests.cs`

### Step 1: Domain entity

```csharp
// src/Tixora.Domain/Entities/Comment.cs
namespace Tixora.Domain.Entities;

public class Comment
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid AuthorUserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User Author { get; set; } = null!;
}
```

Add to `Ticket.cs` navigation:
```csharp
public ICollection<Comment> Comments { get; set; } = new List<Comment>();
```

### Step 2: Application DTOs and interface

```csharp
// src/Tixora.Application/DTOs/Comments/CommentRequest.cs
namespace Tixora.Application.DTOs.Comments;
public record CommentRequest(string Content);

// src/Tixora.Application/DTOs/Comments/CommentResponse.cs
namespace Tixora.Application.DTOs.Comments;
public record CommentResponse(
    string Id,
    string AuthorName,
    string AuthorRole,
    string Content,
    DateTime CreatedAt
);
```

```csharp
// src/Tixora.Application/Interfaces/ICommentService.cs
using Tixora.Application.DTOs.Comments;

namespace Tixora.Application.Interfaces;

public interface ICommentService
{
    Task<CommentResponse> AddCommentAsync(Guid ticketId, Guid authorUserId, string content);
    Task<List<CommentResponse>> GetCommentsAsync(Guid ticketId);
}
```

### Step 3: Add DbSet to ITixoraDbContext and TixoraDbContext

Add to `ITixoraDbContext.cs`:
```csharp
DbSet<Comment> Comments { get; }
```

Add matching `DbSet<Comment> Comments { get; set; }` to `TixoraDbContext.cs`.

### Step 4: EF Configuration

```csharp
// src/Tixora.Infrastructure/Data/Configurations/CommentConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Content).IsRequired().HasMaxLength(2000);
        builder.Property(c => c.CreatedAt).IsRequired();

        builder.HasOne(c => c.Ticket)
            .WithMany(t => t.Comments)
            .HasForeignKey(c => c.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Author)
            .WithMany()
            .HasForeignKey(c => c.AuthorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => c.TicketId);
    }
}
```

### Step 5: Infrastructure service

```csharp
// src/Tixora.Infrastructure/Services/CommentService.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Comments;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Services;

public class CommentService : ICommentService
{
    private readonly ITixoraDbContext _db;

    public CommentService(ITixoraDbContext db)
    {
        _db = db;
    }

    public async Task<CommentResponse> AddCommentAsync(Guid ticketId, Guid authorUserId, string content)
    {
        var ticket = await _db.Tickets.FindAsync(ticketId)
            ?? throw new InvalidOperationException($"Ticket '{ticketId}' not found.");

        var author = await _db.Users.FindAsync(authorUserId)
            ?? throw new InvalidOperationException($"User '{authorUserId}' not found.");

        var comment = new Comment
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticketId,
            AuthorUserId = authorUserId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        return new CommentResponse(
            Id: comment.Id.ToString(),
            AuthorName: author.FullName,
            AuthorRole: author.Role.ToString(),
            Content: comment.Content,
            CreatedAt: comment.CreatedAt
        );
    }

    public async Task<List<CommentResponse>> GetCommentsAsync(Guid ticketId)
    {
        return await _db.Comments
            .Where(c => c.TicketId == ticketId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentResponse(
                c.Id.ToString(),
                c.Author.FullName,
                c.Author.Role.ToString(),
                c.Content,
                c.CreatedAt
            ))
            .ToListAsync();
    }
}
```

### Step 6: Register in DI

Add to `DependencyInjection.cs`:
```csharp
services.AddScoped<ICommentService, CommentService>();
```

### Step 7: API Controller

```csharp
// src/Tixora.API/Controllers/CommentsController.cs
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs.Comments;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/tickets/{ticketId:guid}/comments")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<CommentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetComments(Guid ticketId)
    {
        var comments = await _commentService.GetCommentsAsync(ticketId);
        return Ok(comments);
    }

    [HttpPost]
    [ProducesResponseType(typeof(CommentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddComment(Guid ticketId, [FromBody] CommentRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token." });

        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { message = "Comment content is required." });

        try
        {
            var comment = await _commentService.AddCommentAsync(ticketId, userId.Value, request.Content);
            return CreatedAtAction(nameof(GetComments), new { ticketId }, comment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
```

### Step 8: Integration tests

```csharp
// tests/Tixora.API.Tests/Controllers/CommentsControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Comments;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class CommentsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public CommentsControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> CreateTicketAndReturnId()
    {
        var token = await TestHelpers.GetAuthTokenAsync(_client);
        TestHelpers.SetAuthToken(_client, token);

        var request = new CreateTicketRequest("RBT", "T01", /* partnerId */ default, null, null, "{}", null);
        // We need a real partner ID from seed data — get it from partners endpoint
        var partnersResponse = await _client.GetFromJsonAsync<List<dynamic>>("/api/partners");
        // Use the ticket create flow tested in other tests
        var createResponse = await _client.PostAsJsonAsync("/api/tickets", new
        {
            productCode = "RBT",
            taskType = "T01",
            partnerId = partnersResponse![0].GetProperty("id").GetString(),
            formData = "{}"
        });
        createResponse.EnsureSuccessStatusCode();
        var ticket = await createResponse.Content.ReadFromJsonAsync<TicketResponse>();
        return ticket!.Id.ToString();
    }

    [Fact]
    public async Task AddComment_ValidRequest_Returns201()
    {
        var token = await TestHelpers.GetAuthTokenAsync(_client);
        TestHelpers.SetAuthToken(_client, token);

        // Create a ticket first
        var partnersJson = await _client.GetStringAsync("/api/partners");
        var partners = System.Text.Json.JsonDocument.Parse(partnersJson);
        var partnerId = partners.RootElement[0].GetProperty("id").GetString();

        var ticketResponse = await _client.PostAsJsonAsync("/api/tickets", new
        {
            productCode = "RBT",
            taskType = "T01",
            partnerId,
            formData = "{}"
        });
        ticketResponse.EnsureSuccessStatusCode();
        var ticket = await ticketResponse.Content.ReadFromJsonAsync<TicketResponse>();

        // Add a comment
        var commentResponse = await _client.PostAsJsonAsync(
            $"/api/tickets/{ticket!.Id}/comments",
            new { content = "This is a test comment." });

        Assert.Equal(HttpStatusCode.Created, commentResponse.StatusCode);
        var comment = await commentResponse.Content.ReadFromJsonAsync<CommentResponse>();
        Assert.Equal("This is a test comment.", comment!.Content);
        Assert.False(string.IsNullOrEmpty(comment.AuthorName));
    }

    [Fact]
    public async Task GetComments_ReturnsOrderedList()
    {
        var token = await TestHelpers.GetAuthTokenAsync(_client);
        TestHelpers.SetAuthToken(_client, token);

        var partnersJson = await _client.GetStringAsync("/api/partners");
        var partners = System.Text.Json.JsonDocument.Parse(partnersJson);
        var partnerId = partners.RootElement[0].GetProperty("id").GetString();

        var ticketResponse = await _client.PostAsJsonAsync("/api/tickets", new
        {
            productCode = "RBT",
            taskType = "T01",
            partnerId,
            formData = "{}"
        });
        var ticket = await ticketResponse.Content.ReadFromJsonAsync<TicketResponse>();

        // Add two comments
        await _client.PostAsJsonAsync($"/api/tickets/{ticket!.Id}/comments", new { content = "First comment" });
        await _client.PostAsJsonAsync($"/api/tickets/{ticket.Id}/comments", new { content = "Second comment" });

        // Get comments
        var comments = await _client.GetFromJsonAsync<List<CommentResponse>>($"/api/tickets/{ticket.Id}/comments");
        Assert.Equal(2, comments!.Count);
        Assert.Equal("First comment", comments[0].Content);
        Assert.Equal("Second comment", comments[1].Content);
    }

    [Fact]
    public async Task AddComment_EmptyContent_Returns400()
    {
        var token = await TestHelpers.GetAuthTokenAsync(_client);
        TestHelpers.SetAuthToken(_client, token);

        var response = await _client.PostAsJsonAsync(
            $"/api/tickets/{Guid.NewGuid()}/comments",
            new { content = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
```

### Step 9: Build, test, commit

```bash
dotnet build src/Tixora.sln
dotnet test
git add -A && git commit -m "feat(E3.1): add comments — entity, service, POST/GET endpoints, tests"
```

### Step 10: Generate migration, merge to frontend/foundation, update handoff

```bash
dotnet ef migrations add AddComments --project src/Tixora.Infrastructure --startup-project src/Tixora.API
dotnet ef database update --project src/Tixora.Infrastructure --startup-project src/Tixora.API
git add -A && git commit -m "chore: add Comments migration"
git checkout frontend/foundation && git merge backend/e3 --no-edit && git checkout backend/e3
```

Update `handoff.md` E3 table: Comments row → BE DONE, FE Wirable: YES. Add endpoint shapes.

---

## Task 2: Documents (E3.2)

**Files:**
- Create: `src/Tixora.Domain/Entities/Document.cs`
- Create: `src/Tixora.Application/Interfaces/IDocumentService.cs`
- Create: `src/Tixora.Application/Interfaces/IFileStorage.cs`
- Create: `src/Tixora.Application/DTOs/Documents/DocumentResponse.cs`
- Create: `src/Tixora.Infrastructure/Data/Configurations/DocumentConfiguration.cs`
- Create: `src/Tixora.Infrastructure/Services/DocumentService.cs`
- Create: `src/Tixora.Infrastructure/Services/LocalFileStorage.cs`
- Create: `src/Tixora.API/Controllers/DocumentsController.cs`
- Modify: `src/Tixora.Application/Interfaces/ITixoraDbContext.cs`
- Modify: `src/Tixora.Domain/Entities/Ticket.cs`
- Modify: `src/Tixora.Infrastructure/Data/TixoraDbContext.cs`
- Modify: `src/Tixora.Infrastructure/DependencyInjection.cs`
- Modify: `src/Tixora.API/Program.cs` (file upload size limits)
- Create: `tests/Tixora.API.Tests/Controllers/DocumentsControllerTests.cs`

### Step 1: Domain entity

```csharp
// src/Tixora.Domain/Entities/Document.cs
namespace Tixora.Domain.Entities;

public class Document
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public Guid UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User UploadedBy { get; set; } = null!;
}
```

Add to `Ticket.cs`:
```csharp
public ICollection<Document> Documents { get; set; } = new List<Document>();
```

### Step 2: Application interfaces and DTOs

```csharp
// src/Tixora.Application/Interfaces/IFileStorage.cs
namespace Tixora.Application.Interfaces;

public interface IFileStorage
{
    Task<string> SaveAsync(string fileName, Stream content, CancellationToken ct = default);
    Task<Stream> LoadAsync(string storagePath, CancellationToken ct = default);
    Task DeleteAsync(string storagePath, CancellationToken ct = default);
}
```

```csharp
// src/Tixora.Application/Interfaces/IDocumentService.cs
using Tixora.Application.DTOs.Documents;

namespace Tixora.Application.Interfaces;

public interface IDocumentService
{
    Task<DocumentResponse> UploadAsync(Guid ticketId, Guid uploadedByUserId, string fileName, string contentType, long sizeBytes, Stream content);
    Task<List<DocumentResponse>> GetByTicketAsync(Guid ticketId);
    Task<(Stream Content, string FileName, string ContentType)?> DownloadAsync(Guid documentId);
}
```

```csharp
// src/Tixora.Application/DTOs/Documents/DocumentResponse.cs
namespace Tixora.Application.DTOs.Documents;

public record DocumentResponse(
    string Id,
    string FileName,
    string ContentType,
    long SizeBytes,
    string UploadedBy,
    DateTime UploadedAt
);
```

### Step 3: Add DbSet

Add `DbSet<Document> Documents { get; }` to `ITixoraDbContext` and `TixoraDbContext`.

### Step 4: EF Configuration

```csharp
// src/Tixora.Infrastructure/Data/Configurations/DocumentConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.FileName).IsRequired().HasMaxLength(255);
        builder.Property(d => d.ContentType).IsRequired().HasMaxLength(100);
        builder.Property(d => d.StoragePath).IsRequired().HasMaxLength(500);

        builder.HasOne(d => d.Ticket)
            .WithMany(t => t.Documents)
            .HasForeignKey(d => d.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.UploadedBy)
            .WithMany()
            .HasForeignKey(d => d.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => d.TicketId);
    }
}
```

### Step 5: LocalFileStorage

```csharp
// src/Tixora.Infrastructure/Services/LocalFileStorage.cs
using Tixora.Application.Interfaces;

namespace Tixora.Infrastructure.Services;

public class LocalFileStorage : IFileStorage
{
    private readonly string _basePath;

    public LocalFileStorage(string basePath)
    {
        _basePath = basePath;
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveAsync(string fileName, Stream content, CancellationToken ct = default)
    {
        // Use date-based folder structure to avoid too many files in one directory
        var datePath = DateTime.UtcNow.ToString("yyyy/MM/dd");
        var directory = Path.Combine(_basePath, datePath);
        Directory.CreateDirectory(directory);

        var uniqueName = $"{Guid.CreateVersion7()}_{fileName}";
        var fullPath = Path.Combine(directory, uniqueName);
        var relativePath = Path.Combine(datePath, uniqueName);

        await using var fileStream = new FileStream(fullPath, FileMode.Create);
        await content.CopyToAsync(fileStream, ct);

        return relativePath;
    }

    public Task<Stream> LoadAsync(string storagePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, storagePath);
        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"File not found: {storagePath}");

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string storagePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, storagePath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
        return Task.CompletedTask;
    }
}
```

### Step 6: DocumentService

```csharp
// src/Tixora.Infrastructure/Services/DocumentService.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Documents;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Services;

public class DocumentService : IDocumentService
{
    private readonly ITixoraDbContext _db;
    private readonly IFileStorage _fileStorage;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain"
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB

    public DocumentService(ITixoraDbContext db, IFileStorage fileStorage)
    {
        _db = db;
        _fileStorage = fileStorage;
    }

    public async Task<DocumentResponse> UploadAsync(Guid ticketId, Guid uploadedByUserId, string fileName, string contentType, long sizeBytes, Stream content)
    {
        var ticket = await _db.Tickets.FindAsync(ticketId)
            ?? throw new InvalidOperationException($"Ticket '{ticketId}' not found.");

        if (sizeBytes > MaxFileSizeBytes)
            throw new InvalidOperationException($"File size exceeds maximum allowed ({MaxFileSizeBytes / 1024 / 1024}MB).");

        if (!AllowedContentTypes.Contains(contentType))
            throw new InvalidOperationException($"File type '{contentType}' is not allowed.");

        var user = await _db.Users.FindAsync(uploadedByUserId)
            ?? throw new InvalidOperationException($"User '{uploadedByUserId}' not found.");

        var storagePath = await _fileStorage.SaveAsync(fileName, content);

        var document = new Document
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticketId,
            FileName = fileName,
            ContentType = contentType,
            SizeBytes = sizeBytes,
            StoragePath = storagePath,
            UploadedByUserId = uploadedByUserId,
            UploadedAt = DateTime.UtcNow
        };

        _db.Documents.Add(document);
        await _db.SaveChangesAsync();

        return new DocumentResponse(
            document.Id.ToString(),
            document.FileName,
            document.ContentType,
            document.SizeBytes,
            user.FullName,
            document.UploadedAt
        );
    }

    public async Task<List<DocumentResponse>> GetByTicketAsync(Guid ticketId)
    {
        return await _db.Documents
            .Where(d => d.TicketId == ticketId)
            .OrderByDescending(d => d.UploadedAt)
            .Select(d => new DocumentResponse(
                d.Id.ToString(),
                d.FileName,
                d.ContentType,
                d.SizeBytes,
                d.UploadedBy.FullName,
                d.UploadedAt
            ))
            .ToListAsync();
    }

    public async Task<(Stream Content, string FileName, string ContentType)?> DownloadAsync(Guid documentId)
    {
        var doc = await _db.Documents.FindAsync(documentId);
        if (doc is null) return null;

        var stream = await _fileStorage.LoadAsync(doc.StoragePath);
        return (stream, doc.FileName, doc.ContentType);
    }
}
```

### Step 7: Register in DI

Add to `DependencyInjection.cs`:
```csharp
services.AddSingleton<IFileStorage>(new LocalFileStorage(
    Path.Combine(Directory.GetCurrentDirectory(), "uploads")));
services.AddScoped<IDocumentService, DocumentService>();
```

### Step 8: API Controller

```csharp
// src/Tixora.API/Controllers/DocumentsController.cs
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs.Documents;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }

    [HttpGet("api/tickets/{ticketId:guid}/documents")]
    [ProducesResponseType(typeof(List<DocumentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocuments(Guid ticketId)
    {
        var documents = await _documentService.GetByTicketAsync(ticketId);
        return Ok(documents);
    }

    [HttpPost("api/tickets/{ticketId:guid}/documents")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB
    public async Task<IActionResult> Upload(Guid ticketId, IFormFile file)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token." });

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "File is required." });

        try
        {
            using var stream = file.OpenReadStream();
            var doc = await _documentService.UploadAsync(
                ticketId, userId.Value, file.FileName, file.ContentType, file.Length, stream);
            return CreatedAtAction(nameof(Download), new { id = doc.Id }, doc);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("api/documents/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(Guid id)
    {
        var result = await _documentService.DownloadAsync(id);
        if (result is null)
            return NotFound(new { message = "Document not found." });

        var (content, fileName, contentType) = result.Value;
        return File(content, contentType, fileName);
    }
}
```

### Step 9: Integration tests

```csharp
// tests/Tixora.API.Tests/Controllers/DocumentsControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Documents;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class DocumentsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public DocumentsControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<Guid> CreateTicketAsync()
    {
        var token = await TestHelpers.GetAuthTokenAsync(_client);
        TestHelpers.SetAuthToken(_client, token);

        var partnersJson = await _client.GetStringAsync("/api/partners");
        var partners = System.Text.Json.JsonDocument.Parse(partnersJson);
        var partnerId = partners.RootElement[0].GetProperty("id").GetString();

        var response = await _client.PostAsJsonAsync("/api/tickets", new
        {
            productCode = "RBT",
            taskType = "T01",
            partnerId,
            formData = "{}"
        });
        response.EnsureSuccessStatusCode();
        var ticket = await response.Content.ReadFromJsonAsync<TicketResponse>();
        return ticket!.Id;
    }

    [Fact]
    public async Task Upload_ValidPdf_Returns201()
    {
        var ticketId = await CreateTicketAsync();

        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x25, 0x50, 0x44, 0x46 }); // %PDF header
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "file", "test-agreement.pdf");

        var response = await _client.PostAsync($"/api/tickets/{ticketId}/documents", content);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<DocumentResponse>();
        Assert.Equal("test-agreement.pdf", doc!.FileName);
        Assert.Equal("application/pdf", doc.ContentType);
    }

    [Fact]
    public async Task GetDocuments_ReturnsUploadedFiles()
    {
        var ticketId = await CreateTicketAsync();

        // Upload a file
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x25, 0x50, 0x44, 0x46 });
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "file", "doc.pdf");
        await _client.PostAsync($"/api/tickets/{ticketId}/documents", content);

        // Get documents
        var docs = await _client.GetFromJsonAsync<List<DocumentResponse>>($"/api/tickets/{ticketId}/documents");
        Assert.Single(docs!);
        Assert.Equal("doc.pdf", docs[0].FileName);
    }

    [Fact]
    public async Task Download_ExistingDocument_ReturnsFile()
    {
        var ticketId = await CreateTicketAsync();

        var uploadContent = new MultipartFormDataContent();
        var fileBytes = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D };
        var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        uploadContent.Add(fileContent, "file", "download-test.pdf");
        var uploadResponse = await _client.PostAsync($"/api/tickets/{ticketId}/documents", uploadContent);
        var doc = await uploadResponse.Content.ReadFromJsonAsync<DocumentResponse>();

        var downloadResponse = await _client.GetAsync($"/api/documents/{doc!.Id}");
        Assert.Equal(HttpStatusCode.OK, downloadResponse.StatusCode);
        Assert.Equal("application/pdf", downloadResponse.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Upload_NoFile_Returns400()
    {
        var ticketId = await CreateTicketAsync();
        var content = new MultipartFormDataContent();

        var response = await _client.PostAsync($"/api/tickets/{ticketId}/documents", content);
        // No file attached — should fail
        Assert.True(response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.UnsupportedMediaType);
    }
}
```

### Step 10: Build, test, migrate, commit, merge

```bash
dotnet build src/Tixora.sln
dotnet test
dotnet ef migrations add AddDocuments --project src/Tixora.Infrastructure --startup-project src/Tixora.API
git add -A && git commit -m "feat(E3.2): add documents — upload/download, file storage, validation, tests"
git checkout frontend/foundation && git merge backend/e3 --no-edit && git checkout backend/e3
```

Update handoff: Documents row → BE DONE, FE Wirable: YES.

---

## Task 3: Audit Trail Enhancement (E3.3)

The AuditEntry entity and logging already exist. This task:
1. Verifies all workflow actions create audit entries (already done in WorkflowEngine)
2. Adds a dedicated GET endpoint for audit trail (already returned in TicketDetailResponse.AuditTrail)
3. No new entities needed — AuditEntry is sufficient

**Files:**
- Verify: `src/Tixora.Infrastructure/Services/WorkflowEngine.cs` — all actions log audit entries ✓
- Verify: `src/Tixora.Infrastructure/Services/TicketQueryService.cs` — GetTicketDetailAsync returns audit trail ✓

### Step 1: Verify existing coverage

The existing `TicketQueryService.GetTicketDetailAsync` already returns `AuditTrail` as `AuditEntryResponse[]` in the `TicketDetailResponse`. All workflow actions in `WorkflowEngine` already create `AuditEntry` records. The audit trail is already exposed via `GET /api/tickets/{id}`.

### Step 2: No code changes needed

Audit trail is already complete. Mark as done in handoff.

### Step 3: Commit (no-op — just update handoff)

Update handoff: Audit Trail row → BE DONE (already in E2), FE Wirable: YES (via TicketDetailResponse.AuditTrail).

---

## Task 4: SLA Engine (E3.4)

**Files:**
- Create: `src/Tixora.Domain/Entities/SlaTracker.cs`
- Create: `src/Tixora.Domain/Entities/SlaPause.cs`
- Create: `src/Tixora.Domain/Entities/BusinessHoursConfig.cs`
- Create: `src/Tixora.Domain/Entities/Holiday.cs`
- Create: `src/Tixora.Application/Interfaces/ISlaService.cs`
- Create: `src/Tixora.Infrastructure/Data/Configurations/SlaTrackerConfiguration.cs`
- Create: `src/Tixora.Infrastructure/Data/Configurations/SlaPauseConfiguration.cs`
- Create: `src/Tixora.Infrastructure/Data/Configurations/BusinessHoursConfigConfiguration.cs`
- Create: `src/Tixora.Infrastructure/Data/Configurations/HolidayConfiguration.cs`
- Create: `src/Tixora.Infrastructure/Data/Seed/SeedBusinessHours.cs`
- Create: `src/Tixora.Infrastructure/Services/SlaService.cs`
- Create: `src/Tixora.Infrastructure/Services/SlaMonitoringService.cs`
- Create: `src/Tixora.Infrastructure/Services/UatReminderService.cs`
- Modify: `src/Tixora.Application/Interfaces/ITixoraDbContext.cs`
- Modify: `src/Tixora.Domain/Entities/Ticket.cs`
- Modify: `src/Tixora.Infrastructure/Data/TixoraDbContext.cs`
- Modify: `src/Tixora.Infrastructure/DependencyInjection.cs`
- Modify: `src/Tixora.Infrastructure/Services/WorkflowEngine.cs` — create/update SLA trackers on stage transitions
- Modify: `src/Tixora.Infrastructure/Services/TicketQueryService.cs` — return real SLA data
- Modify: `src/Tixora.API/Program.cs` — register background services
- Create: `tests/Tixora.Infrastructure.Tests/Services/SlaServiceTests.cs`

### Step 1: Domain entities

```csharp
// src/Tixora.Domain/Entities/BusinessHoursConfig.cs
namespace Tixora.Domain.Entities;

public class BusinessHoursConfig
{
    public Guid Id { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public bool IsWorkingDay { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}
```

```csharp
// src/Tixora.Domain/Entities/Holiday.cs
namespace Tixora.Domain.Entities;

public class Holiday
{
    public Guid Id { get; set; }
    public DateOnly Date { get; set; }
    public string Name { get; set; } = string.Empty;
}
```

```csharp
// src/Tixora.Domain/Entities/SlaTracker.cs
using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class SlaTracker
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public int StageOrder { get; set; }
    public int TargetBusinessHours { get; set; }
    public double BusinessHoursElapsed { get; set; }
    public SlaStatus Status { get; set; }
    public DateTime StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public bool IsActive { get; set; }
    public bool Notified75 { get; set; }
    public bool Notified90 { get; set; }
    public bool NotifiedBreach { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public ICollection<SlaPause> Pauses { get; set; } = new List<SlaPause>();
}
```

```csharp
// src/Tixora.Domain/Entities/SlaPause.cs
namespace Tixora.Domain.Entities;

public class SlaPause
{
    public Guid Id { get; set; }
    public Guid SlaTrackerId { get; set; }
    public DateTime PausedAtUtc { get; set; }
    public DateTime? ResumedAtUtc { get; set; }
    public double PausedBusinessHours { get; set; }

    public SlaTracker SlaTracker { get; set; } = null!;
}
```

Add to `Ticket.cs`:
```csharp
public ICollection<SlaTracker> SlaTrackers { get; set; } = new List<SlaTracker>();
```

### Step 2: Application interface

```csharp
// src/Tixora.Application/Interfaces/ISlaService.cs
using Tixora.Domain.Enums;

namespace Tixora.Application.Interfaces;

public interface ISlaService
{
    /// <summary>
    /// Calculate elapsed business hours between two UTC timestamps.
    /// Accounts for working days (Sun-Thu), business hours (08:00-17:00 GST), and holidays.
    /// </summary>
    Task<double> CalculateBusinessHoursAsync(DateTime startUtc, DateTime endUtc);

    /// <summary>
    /// Start SLA tracking for a stage. Skipped if targetBusinessHours is 0.
    /// </summary>
    Task StartTrackingAsync(Guid ticketId, int stageOrder, int targetBusinessHours);

    /// <summary>
    /// Complete tracking for a stage (mark as inactive, record completion time).
    /// </summary>
    Task CompleteTrackingAsync(Guid ticketId, int stageOrder);

    /// <summary>
    /// Pause SLA (e.g., when returning for clarification).
    /// </summary>
    Task PauseAsync(Guid ticketId, int stageOrder);

    /// <summary>
    /// Resume SLA (e.g., when requester responds to clarification).
    /// </summary>
    Task ResumeAsync(Guid ticketId, int stageOrder);

    /// <summary>
    /// Recalculate elapsed hours and status for an active tracker.
    /// </summary>
    Task RecalculateAsync(Guid slaTrackerId);

    /// <summary>
    /// Get the current SLA status and hours remaining for a ticket's active stage.
    /// </summary>
    Task<(SlaStatus Status, double HoursRemaining)> GetCurrentSlaAsync(Guid ticketId);
}
```

### Step 3: Add DbSets

Add to `ITixoraDbContext.cs` and `TixoraDbContext.cs`:
```csharp
DbSet<SlaTracker> SlaTrackers { get; }
DbSet<SlaPause> SlaPauses { get; }
DbSet<BusinessHoursConfig> BusinessHoursConfigs { get; }
DbSet<Holiday> Holidays { get; }
```

### Step 4: EF Configurations

```csharp
// SlaTrackerConfiguration.cs
builder.HasKey(s => s.Id);
builder.Property(s => s.Status).HasConversion<int>();
builder.HasOne(s => s.Ticket).WithMany(t => t.SlaTrackers).HasForeignKey(s => s.TicketId).OnDelete(DeleteBehavior.Cascade);
builder.HasIndex(s => new { s.TicketId, s.StageOrder });
builder.HasIndex(s => s.IsActive).HasFilter("[IsActive] = 1");
```

```csharp
// SlaPauseConfiguration.cs
builder.HasKey(p => p.Id);
builder.HasOne(p => p.SlaTracker).WithMany(s => s.Pauses).HasForeignKey(p => p.SlaTrackerId).OnDelete(DeleteBehavior.Cascade);
```

```csharp
// BusinessHoursConfigConfiguration.cs
builder.HasKey(b => b.Id);
builder.Property(b => b.DayOfWeek).HasConversion<int>();
builder.HasIndex(b => b.DayOfWeek).IsUnique();
```

```csharp
// HolidayConfiguration.cs
builder.HasKey(h => h.Id);
builder.Property(h => h.Name).IsRequired().HasMaxLength(200);
builder.HasIndex(h => h.Date).IsUnique();
```

### Step 5: Seed business hours (Sun-Thu 08:00-17:00 GST)

```csharp
// src/Tixora.Infrastructure/Data/Seed/SeedBusinessHours.cs
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Seed;

public static class SeedBusinessHours
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        var configs = new[]
        {
            // GST working days: Sunday through Thursday
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000001"), DayOfWeek = DayOfWeek.Sunday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000002"), DayOfWeek = DayOfWeek.Monday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000003"), DayOfWeek = DayOfWeek.Tuesday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000004"), DayOfWeek = DayOfWeek.Wednesday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000005"), DayOfWeek = DayOfWeek.Thursday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            // Weekend: Friday and Saturday
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000006"), DayOfWeek = DayOfWeek.Friday, IsWorkingDay = false, StartTime = new TimeOnly(0, 0), EndTime = new TimeOnly(0, 0) },
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000007"), DayOfWeek = DayOfWeek.Saturday, IsWorkingDay = false, StartTime = new TimeOnly(0, 0), EndTime = new TimeOnly(0, 0) },
        };

        modelBuilder.Entity<BusinessHoursConfig>().HasData(configs);
    }
}
```

### Step 6: SlaService implementation

```csharp
// src/Tixora.Infrastructure/Services/SlaService.cs
// Key logic:
// - CalculateBusinessHoursAsync: iterate day by day from start to end, for each day check if it's a working day and not a holiday,
//   clamp to business hours, accumulate. Uses UTC+4 (GST) for business hour boundaries.
// - StartTrackingAsync: create SlaTracker if targetBusinessHours > 0
// - CompleteTrackingAsync: mark tracker inactive, set CompletedAtUtc
// - PauseAsync: create SlaPause with PausedAtUtc = now
// - ResumeAsync: close open SlaPause, calculate PausedBusinessHours for the pause period
// - RecalculateAsync: recalculate BusinessHoursElapsed = CalculateBusinessHours(start, now) - sum(PausedBusinessHours), update Status
// - GetCurrentSlaAsync: find active tracker, return status + remaining hours
```

The full SlaService implementation handles GST timezone (UTC+4), iterates days, clamps to 08:00-17:00, skips holidays and non-working days, subtracts pause hours. This is the most complex piece and needs heavy unit testing.

### Step 7: Wire SLA into WorkflowEngine

In `WorkflowEngine.cs`, inject `ISlaService` and:
- `CreateTicketAsync`: after creating ticket, call `_slaService.StartTrackingAsync(ticket.Id, 1, stage.SlaBusinessHours)`
- `ApproveStageAsync`: call `_slaService.CompleteTrackingAsync(...)` for current stage, then `_slaService.StartTrackingAsync(...)` for next stage
- `ReturnForClarificationAsync`: call `_slaService.PauseAsync(...)` 
- `RespondToClarificationAsync`: call `_slaService.ResumeAsync(...)`

### Step 8: Wire real SLA data into TicketQueryService

In `TicketQueryService.cs`, instead of returning hardcoded `"OnTrack"` and `0`:
- Query `SlaTrackers` for the ticket's active tracker
- Return real `SlaStatus` and remaining hours

### Step 9: SlaMonitoringService (BackgroundService)

```csharp
// src/Tixora.Infrastructure/Services/SlaMonitoringService.cs
// Runs every 5 minutes. Queries all active SlaTrackers.
// For each: recalculate elapsed hours. If thresholds crossed (75%, 90%, 100%), 
// set notification flags and create notifications via INotificationService.
// Idempotent: checks Notified75/Notified90/NotifiedBreach flags before sending.
```

### Step 10: UatReminderService (BackgroundService)

```csharp
// src/Tixora.Infrastructure/Services/UatReminderService.cs  
// Runs daily. Finds T-02 tickets in AwaitingUatSignal status.
// If ticket has been waiting > 30 business days, send UatCompletionReminder notification.
// Uses ISlaService.CalculateBusinessHoursAsync to measure wait time.
```

### Step 11: Register in DI and Program.cs

```csharp
// DependencyInjection.cs
services.AddScoped<ISlaService, SlaService>();

// Program.cs
builder.Services.AddHostedService<SlaMonitoringService>();
builder.Services.AddHostedService<UatReminderService>();
```

### Step 12: Unit tests for SLA calculation

```csharp
// tests/Tixora.Infrastructure.Tests/Services/SlaServiceTests.cs
// Test cases:
// - Same working day: Sunday 10:00 → Sunday 14:00 = 4 hours
// - Cross weekend: Thursday 16:00 → Sunday 10:00 = 3 hours (1h Thu + 2h Sun)
// - Holiday: working day that's a holiday = 0 hours
// - Before business hours: Sunday 06:00 → Sunday 10:00 = 2 hours (08:00-10:00)
// - After business hours: Sunday 18:00 → Monday 10:00 = 2 hours (08:00-10:00 Mon)
// - Multiple days: Sunday 08:00 → Wednesday 17:00 = 36 hours (4 days * 9 hours)
// - Pause/resume: verify paused hours subtracted correctly
```

### Step 13: Build, test, migrate, commit, merge

```bash
dotnet build src/Tixora.sln
dotnet test
dotnet ef migrations add AddSlaTracking --project src/Tixora.Infrastructure --startup-project src/Tixora.API
git add -A && git commit -m "feat(E3.4): add SLA engine — business hours, tracker, pause/resume, background monitoring"
git checkout frontend/foundation && git merge backend/e3 --no-edit && git checkout backend/e3
```

Update handoff: SLA Engine row → BE DONE, FE Wirable: YES. Document SLA fields in ticket responses.

---

## Task 5: Notifications (E3.5)

**Files:**
- Create: `src/Tixora.Domain/Entities/Notification.cs`
- Create: `src/Tixora.Application/Interfaces/INotificationService.cs`
- Create: `src/Tixora.Application/DTOs/Notifications/NotificationResponse.cs`
- Create: `src/Tixora.Infrastructure/Data/Configurations/NotificationConfiguration.cs`
- Create: `src/Tixora.Infrastructure/Services/NotificationService.cs`
- Create: `src/Tixora.API/Controllers/NotificationsController.cs`
- Modify: `src/Tixora.Application/Interfaces/ITixoraDbContext.cs`
- Modify: `src/Tixora.Infrastructure/Data/TixoraDbContext.cs`
- Modify: `src/Tixora.Infrastructure/DependencyInjection.cs`
- Modify: `src/Tixora.Infrastructure/Services/WorkflowEngine.cs` — wire notifications into all actions
- Create: `tests/Tixora.API.Tests/Controllers/NotificationsControllerTests.cs`

### Step 1: Domain entity

```csharp
// src/Tixora.Domain/Entities/Notification.cs
using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid RecipientUserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? TicketId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public User Recipient { get; set; } = null!;
    public Ticket? Ticket { get; set; }
}
```

### Step 2: Application DTOs and interface

```csharp
// src/Tixora.Application/DTOs/Notifications/NotificationResponse.cs
namespace Tixora.Application.DTOs.Notifications;

public record NotificationResponse(
    string Id,
    string Type,
    string Title,
    string Message,
    string? TicketId,
    string? TicketDisplayId,
    bool IsRead,
    DateTime? ReadAt,
    DateTime CreatedAt
);

public record UnreadCountResponse(int Count);
```

```csharp
// src/Tixora.Application/Interfaces/INotificationService.cs
using Tixora.Application.DTOs.Notifications;
using Tixora.Domain.Enums;

namespace Tixora.Application.Interfaces;

public interface INotificationService
{
    Task SendAsync(Guid recipientUserId, NotificationType type, string title, string message, Guid? ticketId = null);
    Task SendToRoleAsync(UserRole role, NotificationType type, string title, string message, Guid? ticketId = null);
    Task<List<NotificationResponse>> GetNotificationsAsync(Guid userId, bool unreadOnly = false);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task MarkReadAsync(Guid notificationId, Guid userId);
    Task MarkAllReadAsync(Guid userId);
}
```

### Step 3: Add DbSet

Add `DbSet<Notification> Notifications { get; }` to `ITixoraDbContext` and `TixoraDbContext`.

### Step 4: EF Configuration

```csharp
// NotificationConfiguration.cs
builder.HasKey(n => n.Id);
builder.Property(n => n.Type).HasConversion<int>();
builder.Property(n => n.Title).IsRequired().HasMaxLength(500);
builder.Property(n => n.Message).IsRequired().HasMaxLength(2000);

builder.HasOne(n => n.Recipient).WithMany().HasForeignKey(n => n.RecipientUserId).OnDelete(DeleteBehavior.Cascade);
builder.HasOne(n => n.Ticket).WithMany().HasForeignKey(n => n.TicketId).OnDelete(DeleteBehavior.SetNull);

builder.HasIndex(n => n.RecipientUserId);
builder.HasIndex(n => new { n.RecipientUserId, n.IsRead });
```

### Step 5: NotificationService

```csharp
// src/Tixora.Infrastructure/Services/NotificationService.cs
// SendAsync: creates Notification record
// SendToRoleAsync: finds all active users with the role, creates a notification for each
// GetNotificationsAsync: query by userId, optionally filter unread, order by CreatedAt desc, limit 50
// GetUnreadCountAsync: count where IsRead = false
// MarkReadAsync: set IsRead = true, ReadAt = now (verify recipientUserId matches)
// MarkAllReadAsync: bulk update all unread for userId
```

### Step 6: API Controller

```csharp
// src/Tixora.API/Controllers/NotificationsController.cs
// GET /api/notifications?unreadOnly=false → NotificationResponse[]
// GET /api/notifications/unread-count → UnreadCountResponse
// PUT /api/notifications/{id}/read → 204
// PUT /api/notifications/read-all → 204
```

### Step 7: Wire notifications into WorkflowEngine

Inject `INotificationService` into `WorkflowEngine`. Add notification calls:

| Workflow Action | NotificationType | Recipients |
|----------------|-----------------|------------|
| CreateTicketAsync | RequestSubmitted | Assigned stage owner |
| ApproveStageAsync (mid) | StageAdvanced | Next stage owner |
| ApproveStageAsync (final) | RequestCompleted | Requester |
| RejectAsync | RequestRejected | Requester |
| ReturnForClarificationAsync | ClarificationRequested | Requester |
| RespondToClarificationAsync | ClarificationResponded | Stage owner |
| CancelAsync | RequestCancelled | Assigned stage owner |
| ReassignAsync | TicketReassigned | New assignee + requester |

T-02 specific:
- ClosePh1 (via approve) → UatPhase1Complete to requester
- SignalUatComplete (via approve) → UatTestingSignalled to next stage owner
- ClosePh2 (via approve) → UatPhase2Complete to requester

T-03 specific:
- Portal provisioning complete → PortalAccountProvisioned to requester
- API provisioning complete → ApiCredentialsIssued to requester

### Step 8: Integration tests

```csharp
// tests/Tixora.API.Tests/Controllers/NotificationsControllerTests.cs
// - Create ticket → GET notifications for assigned user → should have RequestSubmitted
// - Mark notification as read → verify IsRead = true
// - Mark all read → verify all unread become read
// - GET unread-count → returns correct count
```

### Step 9: Build, test, migrate, commit, merge

```bash
dotnet build src/Tixora.sln
dotnet test
dotnet ef migrations add AddNotifications --project src/Tixora.Infrastructure --startup-project src/Tixora.API
git add -A && git commit -m "feat(E3.5): add notifications — entity, service, endpoints, workflow wiring, tests"
git checkout frontend/foundation && git merge backend/e3 --no-edit && git checkout backend/e3
```

Update handoff: Notifications row → BE DONE, FE Wirable: YES.

---

## Merge Order

1. **Task 1 (Comments)** + **Task 2 (Documents)** — independent, can be done in parallel
2. **Task 3 (Audit Trail)** — verification only, no code changes
3. **Task 4 (SLA Engine)** — depends on nothing but is complex
4. **Task 5 (Notifications)** — partially depends on SLA (for SLA threshold notifications in background service)

Recommended serial order: 1 → 2 → 4 → 5 → 3 (verify)

Each gets its own migration, commit, and merge to `frontend/foundation`.

---

## Handoff Template

After each chunk merge, update `.claude/handoff.md` with:

```markdown
## E3: Operational Intelligence

| # | Chunk | BE Status | FE Wirable | Endpoints |
|---|-------|-----------|------------|-----------|
| E3.1 | Comments | — | NO | POST/GET /api/tickets/{id}/comments |
| E3.2 | Documents | — | NO | POST/GET /api/tickets/{id}/documents, GET /api/documents/{id} |
| E3.3 | Audit Trail | — | NO | (via GET /api/tickets/{id} → auditTrail[]) |
| E3.4 | SLA Engine | — | NO | (SLA fields in ticket responses) |
| E3.5 | Notifications | — | NO | GET/PUT /api/notifications |
```
