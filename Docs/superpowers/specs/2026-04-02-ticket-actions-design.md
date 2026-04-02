# Ticket Actions — Design Spec

## Goal

Add all ticket workflow actions to the WorkflowEngine: approve (advance stage), reject, return for clarification, respond to clarification, cancel, and reassign. Each action creates a StageLog entry and AuditEntry. Final stage completion advances the partner's lifecycle state.

---

## 1. Actions Overview

| Action | Who | When | Effect |
|--------|-----|------|--------|
| Approve | Assigned stage owner | Any active stage | Advance to next stage, auto-assign next role. If last stage → complete ticket + advance lifecycle |
| Reject | Assigned stage owner | Any active stage | Terminal. Status=Rejected. Can be re-raised as new ticket |
| ReturnForClarification | Assigned stage owner | Any active stage | Status=PendingRequesterAction. SLA pauses (deferred to E3) |
| RespondToClarification | Original requester | Status=PendingRequesterAction | Status returns to previous (InReview/InProvisioning). SLA resumes |
| Cancel | Original requester | Status=Submitted only (pre-action) | Terminal. Status=Cancelled. Requires cancellation reason |
| Reassign | Any user with same role | Active stage | Changes AssignedToUserId. StageLog records reassignment |

## 2. WorkflowEngine Methods

Add to `IWorkflowEngine`:

```csharp
Task<TicketResponse> ApproveStageAsync(Guid ticketId, Guid actorUserId, string? comments);
Task<TicketResponse> RejectAsync(Guid ticketId, Guid actorUserId, string? comments);
Task<TicketResponse> ReturnForClarificationAsync(Guid ticketId, Guid actorUserId, string comments);
Task<TicketResponse> RespondToClarificationAsync(Guid ticketId, Guid actorUserId, string comments);
Task<TicketResponse> CancelAsync(Guid ticketId, Guid actorUserId, string reason);
Task<TicketResponse> ReassignAsync(Guid ticketId, Guid actorUserId, Guid newAssigneeUserId);
```

All throw `InvalidOperationException` for validation failures.

## 3. Approve Flow (the most complex)

1. Load ticket with WorkflowDefinition.Stages
2. Validate: ticket status is active (Submitted, InReview, InProvisioning, Phase1Complete, Phase2InReview)
3. Validate: actorUserId == ticket.AssignedToUserId (only assigned user can approve)
4. Get current stage definition (by CurrentStageOrder)
5. Create StageLog (Action=Approve)
6. Create AuditEntry (ActionType="StageApproved")
7. Check if this is the last stage:
   - **Yes → Complete ticket:**
     - Status = Completed
     - Advance PartnerProduct.LifecycleState based on TaskType
     - AuditEntry "TicketCompleted"
   - **No → Advance to next stage:**
     - CurrentStageOrder++
     - Update Status based on next stage type (Review→InReview, Approval→InReview, Provisioning→InProvisioning, PhaseGate→AwaitingUatSignal)
     - Auto-assign next stage's role user
8. SaveChanges

### T-02 Special Handling

T-02 has 5 stages with a PhaseGate (stage 4: "Awaiting UAT Signal"):
- Stage 2 completion (Phase 1 access provisioning) → Status=Phase1Complete, lifecycle→UatActive
- Stage 3 completion → advance normally
- Stage 4 is PhaseGate: resolved by requester via `SignalUatComplete` action (use RespondToClarification or a separate method)
- Stage 5 completion → Status=Completed, lifecycle→UatCompleted

Actually, for MVP 1 simplicity: the PhaseGate stage is "approved" by the PartnershipTeam user when UAT is complete. The approve action handles it — no special method needed. The stage's AssignedRole is already PartnershipTeam (from seed data).

### Lifecycle Advancement on Completion

| TaskType | New LifecycleState |
|----------|-------------------|
| T01 | Onboarded |
| T02 | UatCompleted (via Phase 2 sign-off) |
| T03 | Live |
| T04 | No change (support ticket) |

For T-02, lifecycle also advances mid-workflow:
- After Stage 2 (Access Provisioning) completes → UatActive
- After Stage 5 (UAT Sign-off, final) completes → UatCompleted

## 4. Status Transitions

```
Submitted → InReview (first stage action by owner)
InReview → InReview (advance to next review stage)
InReview → InProvisioning (advance to provisioning stage)
InReview → PendingRequesterAction (return for clarification)
InProvisioning → InProvisioning (advance to next provisioning stage)
InProvisioning → PendingRequesterAction (return for clarification)
PendingRequesterAction → InReview/InProvisioning (respond to clarification)
Any active → Rejected (reject)
Submitted → Cancelled (cancel, pre-action only)
Any active → Completed (final stage approved)

T-02 specific:
InProvisioning → Phase1Complete (after stage 2)
Phase1Complete → InProvisioning (stage 3 assigned)
InProvisioning → AwaitingUatSignal (stage 4 PhaseGate)
AwaitingUatSignal → Phase2InReview (requester signals UAT done)
Phase2InReview → Completed (stage 5 signed off)
```

## 5. TicketsController Additions

```
POST /api/tickets/{id}/approve     — [Authorize]
POST /api/tickets/{id}/reject      — [Authorize], body: { comments? }
POST /api/tickets/{id}/return      — [Authorize], body: { comments }
POST /api/tickets/{id}/respond     — [Authorize], body: { comments }
POST /api/tickets/{id}/cancel      — [Authorize], body: { reason }
POST /api/tickets/{id}/reassign    — [Authorize], body: { newAssigneeUserId }
```

## 6. DTOs

```csharp
public record ActionRequest(string? Comments);
public record CancelRequest(string Reason);
public record ReassignRequest(Guid NewAssigneeUserId);
```

## 7. Tests

**Unit (WorkflowEngine):**
- Approve stage 1 → advances to stage 2, correct status and assignment
- Approve final stage → ticket completed, lifecycle advanced
- Approve by wrong user → exception
- Reject → terminal, correct status
- Return for clarification → PendingRequesterAction
- Respond to clarification → restores previous status
- Cancel submitted ticket → Cancelled
- Cancel in-progress ticket → exception
- Reassign → new user, same role
- T-01 full flow: create → approve stage 1 → approve stage 2 → approve stage 3 → approve stage 4 → Completed, lifecycle=Onboarded

**Integration (API):**
- POST /approve → 200
- POST /reject → 200
- POST /cancel → 200
- POST /approve on completed ticket → 400
