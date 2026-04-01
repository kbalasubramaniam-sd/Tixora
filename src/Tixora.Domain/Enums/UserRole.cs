namespace Tixora.Domain.Enums;

/// <summary>
/// Internal user roles. Each user has exactly one role. Determines queue visibility and stage ownership.
/// </summary>
public enum UserRole
{
    /// <summary>Creates tickets and responds to clarification requests.</summary>
    Requester,

    /// <summary>Reviews submitted tickets (first-pass checks).</summary>
    Reviewer,

    /// <summary>Approves or rejects tickets (sign-off authority).</summary>
    Approver,

    /// <summary>Handles API provisioning, UAT access, and credential management.</summary>
    IntegrationTeam,

    /// <summary>Handles portal account provisioning and user creation.</summary>
    ProvisioningAgent,

    /// <summary>Full system access — manages users, SLA config, business hours, delegates.</summary>
    SystemAdministrator
}
