namespace Tixora.Domain.Enums;

/// <summary>
/// Resolved at T-03 submission. Determines which workflow stages the ticket follows.
/// ApiOnly products always route ApiOnly; Both products let the user choose.
/// </summary>
public enum ProvisioningPath
{
    /// <summary>Portal access only — routes through Provisioning Team.</summary>
    PortalOnly = 0,

    /// <summary>Portal + API — routes through Provisioning then Integration (sequential).</summary>
    PortalAndApi = 1,

    /// <summary>API access only — routes through Integration Team.</summary>
    ApiOnly = 2
}
