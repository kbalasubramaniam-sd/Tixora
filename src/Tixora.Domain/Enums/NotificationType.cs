namespace Tixora.Domain.Enums;

/// <summary>
/// In-app notification types. Each maps to a workflow milestone and target recipient(s).
/// </summary>
public enum NotificationType
{
    /// <summary>New ticket created — sent to first stage owner.</summary>
    RequestSubmitted = 0,

    /// <summary>Ticket advanced to next stage — sent to next stage owner.</summary>
    StageAdvanced = 1,

    /// <summary>Stage owner requested clarification — sent to requester.</summary>
    ClarificationRequested = 2,

    /// <summary>Requester responded to clarification — sent to stage owner.</summary>
    ClarificationResponded = 3,

    /// <summary>T-02: Phase 1 access provisioning done — sent to requester.</summary>
    UatPhase1Complete = 4,

    /// <summary>T-02: Requester signalled UAT testing complete — sent to Integration Team.</summary>
    UatTestingSignalled = 5,

    /// <summary>T-02: Phase 2 UAT sign-off done — sent to requester.</summary>
    UatPhase2Complete = 6,

    /// <summary>T-02: Reminder that UAT signal is overdue — sent to requester.</summary>
    UatCompletionReminder = 7,

    /// <summary>T-03: Portal account created — sent to requester.</summary>
    PortalAccountProvisioned = 8,

    /// <summary>T-03: API credentials issued — sent to requester.</summary>
    ApiCredentialsIssued = 9,

    /// <summary>T-05: Access or credential issue resolved — sent to requester.</summary>
    AccessIssueResolved = 10,

    /// <summary>Ticket rejected by stage owner — sent to requester.</summary>
    RequestRejected = 11,

    /// <summary>Ticket cancelled by requester — sent to assigned stage owners.</summary>
    RequestCancelled = 12,

    /// <summary>Ticket reassigned to different user — sent to new assignee + requester.</summary>
    TicketReassigned = 13,

    /// <summary>Delegate is acting on behalf of primary approver — sent to primary.</summary>
    DelegateApprovalTriggered = 14,

    /// <summary>SLA at 75% — warning sent to stage owner.</summary>
    SlaWarning75 = 15,

    /// <summary>SLA at 90% — warning sent to stage owner + manager.</summary>
    SlaWarning90 = 16,

    /// <summary>SLA breached (100%+) — sent to stage owner + manager + admin.</summary>
    SlaBreach = 17,

    /// <summary>All stages complete — sent to requester.</summary>
    RequestCompleted = 18
}
