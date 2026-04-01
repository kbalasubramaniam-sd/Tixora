namespace Tixora.Domain.Enums;

/// <summary>
/// Categorizes what kind of work a workflow stage represents.
/// </summary>
public enum StageType
{
    /// <summary>Content review — checking submitted data for correctness.</summary>
    Review,

    /// <summary>Sign-off or decision gate — approve or reject.</summary>
    Approval,

    /// <summary>Operational work — creating accounts, issuing credentials.</summary>
    Provisioning,

    /// <summary>Waiting gate — e.g. awaiting requester signal that UAT is done.</summary>
    PhaseGate
}
