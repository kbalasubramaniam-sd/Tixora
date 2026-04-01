namespace Tixora.Domain.Enums;

/// <summary>
/// Issue categories for T-04 (Access and Credential Support) tickets.
/// </summary>
public enum IssueType
{
    /// <summary>Password reset or account unlock for portal access.</summary>
    PortalLoginIssue = 0,

    /// <summary>API key regeneration or certificate renewal.</summary>
    ApiCredentialIssue = 1,

    /// <summary>Password reset for read-only portals on API-only products.</summary>
    PortalPasswordReset = 2
}
