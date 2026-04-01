namespace Tixora.Domain.Enums;

public enum NotificationType
{
    RequestSubmitted,
    StageAdvanced,
    ClarificationRequested,
    ClarificationResponded,
    UatPhase1Complete,
    UatTestingSignalled,
    UatPhase2Complete,
    UatCompletionReminder,
    PortalAccountProvisioned,
    ApiCredentialsIssued,
    AccessIssueResolved,
    RequestRejected,
    RequestCancelled,
    TicketReassigned,
    DelegateApprovalTriggered,
    SlaWarning75,
    SlaWarning90,
    SlaBreach,
    RequestCompleted
}
