namespace Tixora.Domain.Enums;

/// <summary>
/// Actions that can be taken on a ticket at a given stage. Logged in StageLog.
/// </summary>
public enum StageAction
{
    /// <summary>Stage owner approves — ticket advances to next stage.</summary>
    Approve = 0,

    /// <summary>Stage owner rejects — ticket moves to Rejected (terminal).</summary>
    Reject = 1,

    /// <summary>Stage owner sends ticket back to requester for more info. SLA pauses.</summary>
    ReturnForClarification = 2,

    /// <summary>Requester responds to clarification request. SLA resumes.</summary>
    RespondToClarification = 3,

    /// <summary>T-02: Integration Team closes Phase 1 access provisioning.</summary>
    ClosePh1 = 4,

    /// <summary>T-02: Requester signals UAT testing is complete.</summary>
    SignalUatComplete = 5,

    /// <summary>T-02: Integration Team closes Phase 2 UAT sign-off.</summary>
    ClosePh2 = 6,

    /// <summary>Final stage — ticket completed, lifecycle advances.</summary>
    Complete = 7,

    /// <summary>Requester cancels ticket (only allowed when status is Submitted).</summary>
    Cancel = 8,

    /// <summary>Ticket reassigned to a different user within the same role.</summary>
    Reassign = 9
}
