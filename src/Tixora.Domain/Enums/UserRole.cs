namespace Tixora.Domain.Enums;

/// <summary>
/// Internal user roles. Each user has exactly one role. Determines queue visibility and stage ownership.
/// </summary>
public enum UserRole
{
    /// <summary>Creates tickets and responds to clarification requests.</summary>
    Requester = 0,

    /// <summary>Reviews submitted tickets (first-pass checks).</summary>
    Reviewer = 1,

    /// <summary>Approves or rejects tickets (sign-off authority).</summary>
    Approver = 2,

    /// <summary>Handles API provisioning, UAT access, and credential management.</summary>
    IntegrationTeam = 3,

    /// <summary>Handles portal account provisioning and user creation.</summary>
    ProvisioningAgent = 4,

    /// <summary>Full system access — manages users, SLA config, business hours, delegates.</summary>
    SystemAdministrator = 5
}
