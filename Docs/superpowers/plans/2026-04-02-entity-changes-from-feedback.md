# Entity Changes from Business Feedback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply all business feedback (2026-04-02) to domain enums and entities — new roles, lifecycle states, portal type, and updated comments.

**Architecture:** Pure Domain layer changes. No service, API, or infrastructure changes. All modifications are to enums in `src/Tixora.Domain/Enums/` and one entity in `src/Tixora.Domain/Entities/Product.cs`.

**Tech Stack:** .NET 10, C#

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Modify | `src/Tixora.Domain/Enums/UserRole.cs` | 6 roles → 9 roles |
| Modify | `src/Tixora.Domain/Enums/ProductAccessMode.cs` | Remove `ApiOnly`, add comment |
| Modify | `src/Tixora.Domain/Enums/LifecycleState.cs` | 4 states → 5 states (`UatCompleted`) |
| Create | `src/Tixora.Domain/Enums/PortalType.cs` | New enum: `Transactional`, `ReadOnly` |
| Modify | `src/Tixora.Domain/Entities/Product.cs` | Add `PortalType` property |
| Modify | `src/Tixora.Domain/Enums/ProductCode.cs` | Fix comments (no longer "API-only") |
| Modify | `src/Tixora.Domain/Enums/ProvisioningPath.cs` | Fix comments (all products are Both) |
| Modify | `src/Tixora.Domain/Enums/IssueType.cs` | Add `AccountUnlock`, `GeneralAccessIssue` |

---

### Task 1: Update UserRole Enum

**Files:**
- Modify: `src/Tixora.Domain/Enums/UserRole.cs`

- [ ] **Step 1: Replace the enum**

```csharp
namespace Tixora.Domain.Enums;

/// <summary>
/// Internal user roles. Each user has exactly one role. Determines queue visibility and stage ownership.
/// </summary>
public enum UserRole
{
    /// <summary>Partnership Team — raises all ticket types on behalf of partners.</summary>
    Requester = 0,

    /// <summary>Reviews agreement details and compliance documentation (T-01).</summary>
    LegalTeam = 1,

    /// <summary>Reviews product-related submissions (T-01, T-02) and signs off on production access (T-03).</summary>
    ProductTeam = 2,

    /// <summary>Executive Authority from CEO office — final sign-off on agreements (T-01).</summary>
    Approver = 3,

    /// <summary>Manages UAT lifecycle, API provisioning, IP whitelisting, credentials (T-02, T-03). Can raise T-04.</summary>
    IntegrationTeam = 4,

    /// <summary>Handles dev provisioning (T-03), API credential creation (T-02), and technical support (T-04).</summary>
    DevTeam = 5,

    /// <summary>Handles business provisioning (T-03) and account-related support (T-04).</summary>
    BusinessTeam = 6,

    /// <summary>Separate Operations team — reviews T-03 requests before production sign-off (T-03 Stage 1).</summary>
    PartnerOps = 7,

    /// <summary>Full system access — manages users, SLA config, business hours, delegates.</summary>
    SystemAdministrator = 8
}
```

- [ ] **Step 2: Build to verify**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded. 0 errors. (May have warnings if old role values are referenced elsewhere — none expected since no services exist yet.)

- [ ] **Step 3: Commit**

```bash
git add src/Tixora.Domain/Enums/UserRole.cs
git commit -m "refactor: update UserRole enum — 6 roles to 9 (feedback 2026-04-02)

Replace generic Reviewer/ProvisioningAgent with specific teams:
LegalTeam, ProductTeam, DevTeam, BusinessTeam, PartnerOps.
Remove PartnerDirector (not required — ProductTeam handles T-03 sign-off).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Update ProductAccessMode Enum

**Files:**
- Modify: `src/Tixora.Domain/Enums/ProductAccessMode.cs`

- [ ] **Step 1: Replace the enum**

```csharp
namespace Tixora.Domain.Enums;

/// <summary>
/// How partners access a product. All products are Both (Portal + API) in MVP 1.
/// Kept for future flexibility — not currently used for routing decisions.
/// </summary>
public enum ProductAccessMode
{
    /// <summary>Portal + API access.</summary>
    Both = 0

    // ApiOnly removed — all 4 products confirmed as Both (2026-04-02 business feedback)
}
```

- [ ] **Step 2: Build to verify**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded. 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/Tixora.Domain/Enums/ProductAccessMode.cs
git commit -m "refactor: remove ProductAccessMode.ApiOnly — all products are Both

All 4 products confirmed as Portal + API (Wtheeq/Mulem have read-only portal).
Enum kept for future flexibility, marked as not currently used for routing.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Update LifecycleState Enum

**Files:**
- Modify: `src/Tixora.Domain/Enums/LifecycleState.cs`

- [ ] **Step 1: Replace the enum**

```csharp
namespace Tixora.Domain.Enums;

/// <summary>
/// Tracks a partner's onboarding progress on a specific product.
/// Advances one-directionally: None → Onboarded → UatActive → UatCompleted → Live.
/// </summary>
public enum LifecycleState
{
    /// <summary>Partner exists but no T-01 completed yet.</summary>
    None = 0,

    /// <summary>T-01 completed — agreement signed off, ready for UAT.</summary>
    Onboarded = 1,

    /// <summary>T-02 Phase 1 completed — UAT environment provisioned, partner is testing.</summary>
    UatActive = 2,

    /// <summary>T-02 Phase 2 completed — Integration Team confirms UAT is complete (triggered by partner email). Ready for T-03.</summary>
    UatCompleted = 3,

    /// <summary>T-03 completed — production accounts and users created, partner is operational.</summary>
    Live = 4
}
```

- [ ] **Step 2: Build to verify**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded. 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/Tixora.Domain/Enums/LifecycleState.cs
git commit -m "feat: add UatCompleted lifecycle state — 4 states to 5

Split UAT into UatActive (provisioned, testing) and UatCompleted
(Integration Team confirms UAT done via partner email). T-03 eligibility
now requires UatCompleted, not just UatActive.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Create PortalType Enum and Update Product Entity

**Files:**
- Create: `src/Tixora.Domain/Enums/PortalType.cs`
- Modify: `src/Tixora.Domain/Entities/Product.cs`

- [ ] **Step 1: Create PortalType enum**

```csharp
namespace Tixora.Domain.Enums;

/// <summary>
/// Distinguishes portal capabilities per product. Informational — does not affect workflow routing.
/// </summary>
public enum PortalType
{
    /// <summary>Full portal operations — Rabet, Rhoon.</summary>
    Transactional = 0,

    /// <summary>View uploads and reports only — Wtheeq, Mulem.</summary>
    ReadOnly = 1
}
```

- [ ] **Step 2: Add PortalType to Product entity**

Replace the full file:

```csharp
using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class Product
{
    public ProductCode Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProductAccessMode ProductAccessMode { get; set; }
    public PortalType PortalType { get; set; }
}
```

- [ ] **Step 3: Build to verify**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded. 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/Tixora.Domain/Enums/PortalType.cs src/Tixora.Domain/Entities/Product.cs
git commit -m "feat: add PortalType enum and Product.PortalType property

Transactional (Rabet, Rhoon) vs ReadOnly (Wtheeq, Mulem).
Informational only — does not affect workflow routing.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Update ProductCode Comments

**Files:**
- Modify: `src/Tixora.Domain/Enums/ProductCode.cs`

- [ ] **Step 1: Fix the comments**

```csharp
namespace Tixora.Domain.Enums;

/// <summary>
/// The four government-integrated platforms managed by Tixora.
/// </summary>
public enum ProductCode
{
    /// <summary>Rabet — Insurance data to ICP. Transactional portal + API.</summary>
    RBT = 0,

    /// <summary>Rhoon — Mortgage transactions. Transactional portal + API.</summary>
    RHN = 1,

    /// <summary>Wtheeq — Vehicle insurance data. Read-only portal + API.</summary>
    WTQ = 2,

    /// <summary>Mulem — Motor insurance pricing. Read-only portal + API.</summary>
    MLM = 3
}
```

- [ ] **Step 2: Build to verify**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded. 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/Tixora.Domain/Enums/ProductCode.cs
git commit -m "docs: update ProductCode comments — all products are portal + API

Wtheeq/Mulem no longer described as API-only. All 4 are portal + API,
with portal type (transactional vs read-only) noted in description.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Update ProvisioningPath Comments

**Files:**
- Modify: `src/Tixora.Domain/Enums/ProvisioningPath.cs`

- [ ] **Step 1: Fix the comments**

```csharp
namespace Tixora.Domain.Enums;

/// <summary>
/// Resolved at T-03 submission. Determines which workflow stages the ticket follows.
/// All products are Portal + API. For Rabet/Rhoon the user chooses the path;
/// for Wtheeq/Mulem the path is always ApiOnly (read-only portal needs no provisioning).
/// </summary>
public enum ProvisioningPath
{
    /// <summary>Portal access only — routes through Dev Team then Business Team.</summary>
    PortalOnly = 0,

    /// <summary>Portal + API — routes through Dev Team, Business Team, then Integration Team (sequential).</summary>
    PortalAndApi = 1,

    /// <summary>API access only — routes through Integration Team. Used by Wtheeq/Mulem.</summary>
    ApiOnly = 2
}
```

- [ ] **Step 2: Build to verify**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded. 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/Tixora.Domain/Enums/ProvisioningPath.cs
git commit -m "docs: update ProvisioningPath comments — reflect team names and product routing

Replace generic 'Provisioning Team' / 'Integration' with actual team names.
Clarify that Wtheeq/Mulem always route ApiOnly despite being Portal + API.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Update IssueType Enum

**Files:**
- Modify: `src/Tixora.Domain/Enums/IssueType.cs`

- [ ] **Step 1: Replace the enum**

```csharp
namespace Tixora.Domain.Enums;

/// <summary>
/// Issue categories for T-04 (Access and Credential Support) tickets.
/// Determines initial team assignment: technical issues → Dev/Integration, account issues → Business.
/// </summary>
public enum IssueType
{
    /// <summary>Password reset or account unlock for transactional portal access (Rabet, Rhoon).</summary>
    PortalLoginIssue = 0,

    /// <summary>API key regeneration or certificate renewal.</summary>
    ApiCredentialIssue = 1,

    /// <summary>Password reset for read-only portals (Wtheeq, Mulem).</summary>
    PortalPasswordReset = 2,

    /// <summary>Unlock a locked partner account.</summary>
    AccountUnlock = 3,

    /// <summary>Catch-all for access issues not covered by other types.</summary>
    GeneralAccessIssue = 4
}
```

- [ ] **Step 2: Build to verify**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded. 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/Tixora.Domain/Enums/IssueType.cs
git commit -m "feat: add AccountUnlock and GeneralAccessIssue to IssueType enum

T-04 now supports 5 issue types. Comments updated to reflect team routing
(technical → Dev/Integration, account → Business).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Final Build Verification

- [ ] **Step 1: Clean build**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded. 0 Warning(s). 0 Error(s).

- [ ] **Step 2: Run tests (if any exist)**

Run: `dotnet test src/Tixora.sln`
Expected: All tests pass (currently no test files, so 0 tests discovered).
