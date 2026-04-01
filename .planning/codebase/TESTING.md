# Testing Patterns

**Analysis Date:** 2026-04-01

## Test Framework

**Runner:**
- C# Backend: xUnit (standard for .NET, configured via project file)
- Frontend: Not yet configured (Vitest or Jest to be added)
- Config location: Each test project directory

**Assertion Library:**
- C# Backend: Fluent Assertions (recommended for readable assertions)
- Frontend: TBD (testing framework decision pending)

**Run Commands:**
```bash
# Backend (once solution exists)
dotnet test                                      # Run all tests
dotnet test --watch                             # Watch mode
dotnet test --collect:"XPlat Code Coverage"    # Coverage report
dotnet test -- --logger "trx" --verbosity quiet # CI-friendly output

# Frontend (once configured)
npm run test                                     # Run all tests
npm run test:watch                               # Watch mode
npm run test:coverage                            # Coverage report
```

## Test File Organization

**Location:**
- Backend: Separate `tests/` directory at solution root
  - `tests/Tixora.Domain.Tests/`
  - `tests/Tixora.Application.Tests/`
  - `tests/Tixora.API.Tests/`
- Frontend: Co-located with source (TBD - recommend `src/**/*.test.tsx`)

**Naming:**
- C#: `[ClassName]Tests.cs` or `[FeatureName]Tests.cs`
  - Example: `TicketServiceTests.cs`, `WorkflowEngineTests.cs`
- TypeScript: `[FileName].test.tsx` or `[FileName].spec.ts`
  - Example: `TicketForm.test.tsx`, `useTicketFetch.test.ts`

**Structure:**
```
tests/
├── Tixora.Domain.Tests/
│   ├── Entities/
│   │   ├── TicketTests.cs
│   │   └── PartnerTests.cs
│   ├── Enums/
│   └── ValueObjects/
│       └── TicketIdTests.cs
│
├── Tixora.Application.Tests/
│   ├── Services/
│   │   ├── TicketServiceTests.cs
│   │   ├── WorkflowEngineTests.cs
│   │   └── SlaServiceTests.cs
│   └── Validators/
│       └── CreateTicketValidatorTests.cs
│
└── Tixora.API.Tests/
    ├── Controllers/
    │   ├── TicketsControllerTests.cs
    │   └── AuthControllerTests.cs
    └── Middleware/
        └── ErrorHandlingMiddlewareTests.cs
```

## Test Structure

**Suite Organization (C#):**
```csharp
public class TicketServiceTests
{
    private readonly IFixture _fixture;
    private readonly Mock<ITicketRepository> _mockRepository;
    private readonly Mock<IWorkflowEngine> _mockWorkflow;
    private readonly TicketService _sut;  // System Under Test

    public TicketServiceTests()
    {
        _fixture = new Fixture();
        _mockRepository = new Mock<ITicketRepository>();
        _mockWorkflow = new Mock<IWorkflowEngine>();
        _sut = new TicketService(_mockRepository.Object, _mockWorkflow.Object);
    }

    [Theory]
    [InlineData(TaskType.T01)]
    [InlineData(TaskType.T02)]
    public async Task CreateTicket_ValidRequest_ReturnsTicketWithId(TaskType taskType)
    {
        // Arrange
        var request = _fixture
            .Build<CreateTicketRequest>()
            .With(r => r.TaskType, taskType)
            .Create();

        // Act
        var result = await _sut.CreateTicketAsync(request, userId);

        // Assert
        result.Should().NotBeNull();
        result.TicketId.Should().StartWith("SPM-");
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Ticket>()), Times.Once);
    }

    [Fact]
    public async Task CreateTicket_InvalidProductCode_ThrowsValidationException()
    {
        // Arrange
        var request = _fixture
            .Build<CreateTicketRequest>()
            .With(r => r.ProductCode, (ProductCode)999)
            .Create();

        // Act & Assert
        await _sut.Invoking(s => s.CreateTicketAsync(request, userId))
            .Should()
            .ThrowAsync<ArgumentException>();
    }
}
```

**Patterns:**
- Use **xUnit Theory** for parametrized tests, **Fact** for single scenarios
- **Arrange-Act-Assert** (AAA) structure enforced by comments
- **Fluent Assertions** for readable expectations
- **AutoFixture** for test data generation
- **Moq** for mocking dependencies
- Name tests: `[Method]_[Condition]_[Expected]` (e.g., `CreateTicket_InvalidRequest_ThrowsException`)

## Mocking

**Framework:** Moq for C# backend

**Patterns (C#):**
```csharp
// Mock repository
var mockRepo = new Mock<ITicketRepository>();
mockRepo
    .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
    .ReturnsAsync(new Ticket { Id = Guid.NewGuid() });

// Verify invocation
mockRepo.Verify(r => r.AddAsync(It.IsAny<Ticket>()), Times.Once);

// Mock with behavior
var mockWorkflow = new Mock<IWorkflowEngine>();
mockWorkflow
    .Setup(w => w.CanAdvanceAsync(It.IsAny<Ticket>(), It.IsAny<StageAction>()))
    .ReturnsAsync(true);

// Strict mock (fails on unexpected calls)
var strict = new Mock<ITicketService>(MockBehavior.Strict);
```

**What to Mock:**
- Repository dependencies (database access)
- External services (email, file storage, API clients)
- Infrastructure dependencies (caching, logging — unless testing integration)
- Other layer dependencies (services below current layer)

**What NOT to Mock:**
- Domain entities (test with real instances)
- Enums and value objects (create instances directly)
- DTOs (construct directly, use Fixture for data)
- Validation logic (test with real validators)
- Workflow rules (test real WorkflowEngine, mock only repository)

## Fixtures and Factories

**Test Data (C#):**
```csharp
// AutoFixture customization
public class TicketFixture
{
    public static Ticket CreateValidTicket(
        TaskType taskType = TaskType.T01,
        ProductCode productCode = ProductCode.RBT)
    {
        return new Ticket
        {
            Id = Guid.NewGuid(),
            TicketId = $"SPM-{productCode}-{taskType}-20260401-0001",
            Status = TicketStatus.Submitted,
            TaskType = taskType,
            ProductCode = productCode,
            CurrentStageOrder = 1,
            FormData = "{}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}

// Usage
[Fact]
public async Task WorkflowEngine_AdvanceStage_UpdatesTicketStatus()
{
    var ticket = TicketFixture.CreateValidTicket(TaskType.T02);
    // ... test logic
}
```

**Location:**
- C#: `tests/[ProjectName].Tests/Fixtures/` or inline in test class
- TypeScript: `src/__fixtures__/` or co-located as `.fixture.ts` files

## Coverage

**Requirements:**
- Not enforced in MVP 1 (defer to MVP 2)
- Target: 80% for Application layer services
- Target: 60% for API controllers (integration tests preferred)
- Domain entities: 100% (pure logic, easy to test)

**View Coverage:**
```bash
# C# coverage report
dotnet test --collect:"XPlat Code Coverage" --results-directory coverage
# Report generated in coverage/

# Frontend coverage (once configured)
npm run test:coverage
# View in coverage/
```

## Test Types

**Unit Tests:**
- Scope: Single method/function in isolation
- Dependencies: Mocked (repositories, services)
- Location: `[Layer].Tests` project, mirrors source structure
- Speed: Fast (milliseconds)
- Example: `TicketService.CreateTicketAsync` with mocked repository

**Integration Tests:**
- Scope: Multiple layers (Application + Infrastructure + Database)
- Dependencies: Real database (in-memory or test instance)
- Location: `Tixora.API.Tests/Integration/`
- Speed: Medium (hundreds of milliseconds)
- Example: Create ticket → verify in database → advance stage → verify audit log
- Pattern:
  ```csharp
  [Fact]
  public async Task CreateAndAdvanceTicket_IntegrationFlow()
  {
      // Arrange - use real DbContext with in-memory database
      using var context = new AppDbContext(inMemoryOptions);
      var repository = new TicketRepository(context);
      var service = new TicketService(repository, mockWorkflow);

      // Act
      var ticket = await service.CreateTicketAsync(request, userId);
      await context.SaveChangesAsync();

      // Assert
      var saved = await context.Tickets.FirstAsync(t => t.Id == ticket.Id);
      saved.Should().NotBeNull();
  }
  ```

**E2E Tests:**
- Not planned for MVP 1 (frontend testing infrastructure needed)
- Framework: TBD (Cypress or Playwright for browser automation)
- Scope: Full user workflows (login → create ticket → approve → provision)
- Location: Separate `tests/e2e/` directory
- Speed: Slow (seconds per test)

## Common Patterns

**Async Testing:**
```csharp
[Fact]
public async Task GetTicketAsync_ReturnsExpectedData()
{
    // Arrange
    var ticketId = Guid.NewGuid();
    _mockRepository
        .Setup(r => r.GetByIdAsync(ticketId))
        .ReturnsAsync(new Ticket { Id = ticketId });

    // Act
    var result = await _sut.GetTicketAsync(ticketId);

    // Assert
    result.Should().NotBeNull();
    result.Id.Should().Be(ticketId);
}
```

**Error Testing:**
```csharp
[Fact]
public async Task CreateTicket_PartnerNotFound_ThrowsNotFoundException()
{
    // Arrange
    _mockRepository
        .Setup(r => r.GetPartnerAsync(It.IsAny<Guid>()))
        .ReturnsAsync((Partner)null);

    // Act & Assert
    await _sut.Invoking(s => s.CreateTicketAsync(request, userId))
        .Should()
        .ThrowAsync<ArgumentException>()
        .WithMessage("*Partner not found*");
}
```

**Stage Transition Testing:**
```csharp
[Theory]
[InlineData(StageAction.Approve, TicketStatus.InProvisioning)]
[InlineData(StageAction.Reject, TicketStatus.Rejected)]
[InlineData(StageAction.ReturnForClarification, TicketStatus.PendingRequesterAction)]
public async Task AdvanceStage_ValidActions_UpdatesStatus(
    StageAction action, TicketStatus expectedStatus)
{
    // Arrange
    var ticket = TicketFixture.CreateValidTicket();
    var stageDefinition = StageDefinitionFixture.CreateReviewStage();

    // Act
    await _sut.AdvanceStageAsync(ticket.Id, action, stageDefinition);

    // Assert - verify via repository mock or database
    ticket.Status.Should().Be(expectedStatus);
}
```

**Product-Specific Testing:**
```csharp
[Theory]
[InlineData(ProductCode.RBT, ProvisioningPath.PortalOnly)]      // Both product
[InlineData(ProductCode.RBT, ProvisioningPath.PortalAndApi)]    // Both product
[InlineData(ProductCode.WTQ, ProvisioningPath.ApiOnly)]         // ApiOnly product
public async Task CreateTicket_ProductAccessMode_SetsCorrectPath(
    ProductCode code, ProvisioningPath expectedPath)
{
    // Arrange
    var request = _fixture
        .Build<CreateTicketRequest>()
        .With(r => r.ProductCode, code)
        .Create();

    // Act
    var ticket = await _sut.CreateTicketAsync(request, userId);

    // Assert
    ticket.ProvisioningPath.Should().Be(expectedPath);
}
```

## Test Database

**For Integration Tests:**
- Use in-memory SQLite or SQL Server LocalDB
- Initialize with seed data (products, workflows, business hours)
- Dispose after each test (clean state)
- Example:
  ```csharp
  private AppDbContext CreateDbContext()
  {
      var options = new DbContextOptionsBuilder<AppDbContext>()
          .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
          .Options;
      var context = new AppDbContext(options);
      context.Database.EnsureCreated();
      SeedTestData(context);
      return context;
  }
  ```

## MVP 1 Testing Status

**Implemented:**
- Project structure (tests/ directories)
- xUnit, Moq, AutoFixture, Fluent Assertions references (when solution created)

**Deferred to MVP 2:**
- Full integration test suite (80%+ coverage)
- E2E tests (browser automation)
- Performance tests (SLA calculation efficiency)
- Load tests (concurrent ticket operations)

---

*Testing analysis: 2026-04-01 | Based on Clean Architecture patterns and .NET 8 standards*
