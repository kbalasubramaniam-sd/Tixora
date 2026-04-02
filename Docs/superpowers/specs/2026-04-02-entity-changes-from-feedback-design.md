# Entity Changes from Business Feedback (2026-04-02)

**Source:** `Docs/tixora-feedback-anonymous-2026-04-02.md`
**Visual reference:** `Docs/workflow-visual-v2.html`

---

## 1. UserRole Enum — 6 → 9 roles

Replace the current 6-role enum with 9 roles that map to actual teams.

```csharp
public enum UserRole
{
    Requester = 0,           // Partnership Team — raises all ticket types
    LegalTeam = 1,           // Reviews agreements (T-01)
    ProductTeam = 2,         // Product stages (T-01, T-02) + T-03 production sign-off
    Approver = 3,            // EA / CEO office — T-01 final sign-off
    IntegrationTeam = 4,     // API/UAT provisioning (T-02, T-03), can raise T-04
    DevTeam = 5,             // Dev provisioning (T-03), API credential creation (T-02), T-04 support
    BusinessTeam = 6,        // Business provisioning (T-03), account support (T-04)
    PartnerOps = 7,          // Separate Operations team — T-03 Stage 1 review
    SystemAdministrator = 8  // Config, users, SLA rules
}
```

**Removed:** `Reviewer` (replaced by LegalTeam/ProductTeam), `ProvisioningAgent` (replaced by DevTeam/BusinessTeam), `PartnerDirector` (not required — Product Team handles T-03 sign-off).

## 2. ProductAccessMode Enum — keep, mark unused

All 4 products are `Both` (Portal + API). `ApiOnly` is no longer needed. Keep the enum for future flexibility but mark it.

```csharp
public enum ProductAccessMode
{
    /// <summary>Portal + API access. All products use this in MVP 1.</summary>
    Both = 0

    // ApiOnly removed — all products confirmed as Both (2026-04-02 feedback)
}
```

## 3. LifecycleState Enum — 4 → 5 states

Split UAT into two states. `UatCompleted` is set when Integration Team marks T-02 Phase 2 complete (triggered by partner email confirming UAT is done).

```csharp
public enum LifecycleState
{
    None = 0,           // Partner exists, no T-01 yet
    Onboarded = 1,      // T-01 completed — agreement signed off
    UatActive = 2,      // T-02 Phase 1 done — UAT provisioned, partner testing
    UatCompleted = 3,   // T-02 Phase 2 done — Integration Team confirms UAT complete
    Live = 4            // T-03 completed — production accounts created
}
```

**Lifecycle flow:**
```
None → [T-01] → Onboarded → [T-02 Ph1] → UatActive → [T-02 Ph2] → UatCompleted → [T-03] → Live
```

## 4. PortalType Enum — new

Informational property on Product. Distinguishes transactional portals from read-only.

```csharp
public enum PortalType
{
    Transactional = 0,  // Rabet, Rhoon — full portal operations
    ReadOnly = 1        // Wtheeq, Mulem — view uploads and reports only
}
```

**Product entity** gets a new property:
```csharp
public PortalType PortalType { get; set; }
```

## 5. Product Seed Data

| Product | Code | ProductAccessMode | PortalType |
|---------|------|-------------------|------------|
| Rabet   | RBT  | Both              | Transactional |
| Rhoon   | RHN  | Both              | Transactional |
| Wtheeq  | WTQ  | Both              | ReadOnly |
| Mulem   | MLM  | Both              | ReadOnly |

## 6. Product Manager Assignments (for User seed data)

| Product | PM Name | Role |
|---------|---------|------|
| Rabet   | Hannoun | ProductTeam |
| Rhoon   | Albaha  | ProductTeam |
| Wtheeq  | Albaha  | ProductTeam |
| Mulem   | Hannoun | ProductTeam |

## 7. Partner Ops Team (for User seed data)

| Name | Role |
|------|------|
| Vilina Sequeira | PartnerOps |
| Sara Raeed | PartnerOps |
| Shayman Ali | PartnerOps |

## 8. No Structural Changes

These entities are unchanged: Ticket, StageLog, AuditEntry, Partner, PartnerProduct, WorkflowDefinition, StageDefinition, User.

## 9. Workflow Impact Summary

Changes applied to workflow stage definitions (documented in `workflow-visual-v2.html`):

- **T-01:** No changes.
- **T-02:** New Dev Team stage (Stage 3) for API credential creation. Stages renumbered.
- **T-03 (all 3 paths):** Stage 1 = PartnerOps, Stage 2 = ProductTeam (was PartnerDirector).
- **T-04:** Single stage, 3 eligible teams (Dev/Integration/Business), assigned by issue context, cross-reassignment allowed.
