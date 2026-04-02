namespace Tixora.Domain.Enums;

/// <summary>
/// Internal user roles. Each user has exactly one role. Determines queue visibility and stage ownership.
/// </summary>
public enum UserRole
{
    /// <summary>Partnership Team — raises all ticket types on behalf of partners.</summary>
    PartnershipTeam = 1,

    /// <summary>Reviews agreement details and compliance documentation (T-01).</summary>
    LegalTeam = 2,

    /// <summary>Reviews product-related submissions (T-01, T-02) and signs off on production access (T-03).</summary>
    ProductTeam = 3,

    /// <summary>Executive Authority from CEO office — final sign-off on agreements (T-01).</summary>
    ExecutiveAuthority = 4,

    /// <summary>Manages UAT lifecycle, API provisioning, IP whitelisting, credentials (T-02, T-03). Can raise T-04.</summary>
    IntegrationTeam = 5,

    /// <summary>Handles dev provisioning (T-03), API credential creation (T-02), and technical support (T-04).</summary>
    DevTeam = 6,

    /// <summary>Handles business provisioning (T-03) and account-related support (T-04).</summary>
    BusinessTeam = 7,

    /// <summary>Separate Operations team — reviews T-03 requests before production sign-off (T-03 Stage 1).</summary>
    PartnerOps = 8,

    /// <summary>Full system access — manages users, SLA config, business hours, delegates.</summary>
    SystemAdministrator = 9
}
