namespace Tixora.Domain.Enums;

/// <summary>
/// Current status of a ticket in its workflow lifecycle.
/// </summary>
public enum TicketStatus
{
    /// <summary>Just created, no stage owner has acted yet. Cancel is allowed.</summary>
    Submitted,

    /// <summary>Active — a stage owner is reviewing or processing.</summary>
    InReview,

    /// <summary>Returned for clarification — waiting on requester to respond.</summary>
    PendingRequesterAction,

    /// <summary>Being provisioned (T-03/T-04 provisioning stages).</summary>
    InProvisioning,

    /// <summary>T-02 only — Phase 1 access provisioning is done.</summary>
    Phase1Complete,

    /// <summary>T-02 only — waiting for requester to signal UAT testing is complete.</summary>
    AwaitingUatSignal,

    /// <summary>T-02 only — Phase 2 UAT sign-off is under review.</summary>
    Phase2InReview,

    /// <summary>All stages done, lifecycle state advanced. Terminal.</summary>
    Completed,

    /// <summary>Rejected by a stage owner. Can be re-raised as a new ticket. Terminal.</summary>
    Rejected,

    /// <summary>Cancelled by requester (pre-action only). Terminal.</summary>
    Cancelled
}
