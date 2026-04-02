namespace Tixora.Domain.Enums;

/// <summary>
/// Resolved at T-03 submission. Determines which workflow stages the ticket follows.
/// All products are Portal + API. For Rabet/Rhoon the user chooses the path;
/// for Wtheeq/Mulem the path is always ApiOnly (read-only portal needs no provisioning).
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
