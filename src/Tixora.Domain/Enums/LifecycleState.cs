namespace Tixora.Domain.Enums;

/// <summary>
/// Tracks a partner's onboarding progress on a specific product.
/// Advances one-directionally: None → Onboarded → UatActive → UatCompleted → Live.
/// </summary>
public enum LifecycleState
{
    /// <summary>Partner exists but no T-01 completed yet.</summary>
    None = 0,

    /// <summary>T-01 completed — agreement signed off, ready for UAT.</summary>
    Onboarded = 1,

    /// <summary>T-02 Phase 1 completed — UAT environment provisioned, partner is testing.</summary>
    UatActive = 2,

    /// <summary>T-02 Phase 2 completed — Integration Team confirms UAT is complete (triggered by partner email). Ready for T-03.</summary>
    UatCompleted = 3,

    /// <summary>T-03 completed — production accounts and users created, partner is operational.</summary>
    Live = 4
}
