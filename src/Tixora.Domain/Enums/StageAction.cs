namespace Tixora.Domain.Enums;

/// <summary>
/// Actions that can be taken on a ticket at a given stage. Logged in StageLog.
/// </summary>
public enum StageAction
{
    /// <summary>Stage owner approves — ticket advances to next stage.</summary>
    Approve,

    /// <summary>Stage owner rejects — ticket moves to Rejected (terminal).</summary>
    Reject,

    /// <summary>Stage owner sends ticket back to requester for more info. SLA pauses.</summary>
    ReturnForClarification,

    /// <summary>Requester responds to clarification request. SLA resumes.</summary>
    RespondToClarification,

    /// <summary>T-02: Integration Team closes Phase 1 access provisioning.</summary>
    ClosePh1,

    /// <summary>T-02: Requester signals UAT testing is complete.</summary>
    SignalUatComplete,

    /// <summary>T-02: Integration Team closes Phase 2 UAT sign-off.</summary>
    ClosePh2,

    /// <summary>Final stage — ticket completed, lifecycle advances.</summary>
    Complete,

    /// <summary>Requester cancels ticket (only allowed when status is Submitted).</summary>
    Cancel,

    /// <summary>Ticket reassigned to a different user within the same role.</summary>
    Reassign
}
