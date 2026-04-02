namespace Tixora.Domain.Enums;

/// <summary>
/// Resolved at T-03 submission. Determines which workflow stages the ticket follows.
/// All products have ProductAccessMode = Both (Portal + API), but the provisioning path
/// varies: Rabet/Rhoon let the user choose; Wtheeq/Mulem always route ApiOnly because
/// their read-only portal requires no account provisioning (PortalType = ReadOnly).
/// </summary>
public enum ProvisioningPath
{
    /// <summary>Portal access only — routes through Dev Team then Business Team.</summary>
    PortalOnly = 0,

    /// <summary>Portal + API — routes through Dev Team, Business Team, then Integration Team (sequential).</summary>
    PortalAndApi = 1,

    /// <summary>API access only — routes through Integration Team. Used by Wtheeq/Mulem.</summary>
    ApiOnly = 2
}
