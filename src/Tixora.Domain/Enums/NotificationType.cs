namespace Tixora.Domain.Enums;

/// <summary>
/// In-app notification types. Each maps to a workflow milestone and target recipient(s).
/// </summary>
public enum NotificationType
{
    /// <summary>New ticket created — sent to first stage owner.</summary>
    RequestSubmitted,

    /// <summary>Ticket advanced to next stage — sent to next stage owner.</summary>
    StageAdvanced,

    /// <summary>Stage owner requested clarification — sent to requester.</summary>
    ClarificationRequested,

    /// <summary>Requester responded to clarification — sent to stage owner.</summary>
    ClarificationResponded,

    /// <summary>T-02: Phase 1 access provisioning done — sent to requester.</summary>
    UatPhase1Complete,

    /// <summary>T-02: Requester signalled UAT testing complete — sent to Integration Team.</summary>
    UatTestingSignalled,

    /// <summary>T-02: Phase 2 UAT sign-off done — sent to requester.</summary>
    UatPhase2Complete,

    /// <summary>T-02: Reminder that UAT signal is overdue — sent to requester.</summary>
    UatCompletionReminder,

    /// <summary>T-03: Portal account created — sent to requester.</summary>
    PortalAccountProvisioned,

    /// <summary>T-03: API credentials issued — sent to requester.</summary>
    ApiCredentialsIssued,

    /// <summary>T-05: Access or credential issue resolved — sent to requester.</summary>
    AccessIssueResolved,

    /// <summary>Ticket rejected by stage owner — sent to requester.</summary>
    RequestRejected,

    /// <summary>Ticket cancelled by requester — sent to assigned stage owners.</summary>
    RequestCancelled,

    /// <summary>Ticket reassigned to different user — sent to new assignee + requester.</summary>
    TicketReassigned,

    /// <summary>Delegate is acting on behalf of primary approver — sent to primary.</summary>
    DelegateApprovalTriggered,

    /// <summary>SLA at 75% — warning sent to stage owner.</summary>
    SlaWarning75,

    /// <summary>SLA at 90% — warning sent to stage owner + manager.</summary>
    SlaWarning90,

    /// <summary>SLA breached (100%+) — sent to stage owner + manager + admin.</summary>
    SlaBreach,

    /// <summary>All stages complete — sent to requester.</summary>
    RequestCompleted
}
