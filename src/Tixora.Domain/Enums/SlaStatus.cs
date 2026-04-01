namespace Tixora.Domain.Enums;

/// <summary>
/// SLA health for a stage, based on percentage of target business hours elapsed.
/// </summary>
public enum SlaStatus
{
    /// <summary>Less than 75% of target elapsed.</summary>
    OnTrack,

    /// <summary>75–90% of target elapsed. Stage owner notified.</summary>
    AtRisk,

    /// <summary>90–100% of target elapsed. Stage owner + manager notified.</summary>
    Critical,

    /// <summary>100%+ elapsed. Stage owner + manager + admin notified.</summary>
    Breached
}
