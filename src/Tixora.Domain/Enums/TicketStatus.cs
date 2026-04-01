namespace Tixora.Domain.Enums;

public enum TicketStatus
{
    Submitted,
    InReview,
    PendingRequesterAction,
    InProvisioning,
    Phase1Complete,
    AwaitingUatSignal,
    Phase2InReview,
    Completed,
    Rejected,
    Cancelled
}
