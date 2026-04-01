namespace Tixora.Domain.Enums;

/// <summary>
/// Tracks a partner's onboarding progress on a specific product.
/// Advances one-directionally: None → Agreed → UatActive → Onboarded → Live.
/// </summary>
public enum LifecycleState
{
    /// <summary>No T-01 completed — partner hasn't started onboarding.</summary>
    None,

    /// <summary>T-01 completed — agreement validated and signed off.</summary>
    Agreed,

    /// <summary>T-02 Phase 1 completed — UAT environment provisioned, partner is testing.</summary>
    UatActive,

    /// <summary>T-02 Phase 2 + T-03 both completed — UAT signed off and account created.</summary>
    Onboarded,

    /// <summary>T-04 completed — users created, partner is operational.</summary>
    Live
}
