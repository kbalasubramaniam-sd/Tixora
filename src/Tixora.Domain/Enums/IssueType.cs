namespace Tixora.Domain.Enums;

/// <summary>
/// Issue categories for T-04 (Access and Credential Support) tickets.
/// Determines initial team assignment: technical issues → Dev/Integration, account issues → Business.
/// </summary>
public enum IssueType
{
    /// <summary>Password reset or account unlock for transactional portal access (Rabet, Rhoon).</summary>
    PortalLoginIssue = 0,

    /// <summary>API key regeneration or certificate renewal.</summary>
    ApiCredentialIssue = 1,

    /// <summary>Password reset for read-only portals (Wtheeq, Mulem).</summary>
    PortalPasswordReset = 2,

    /// <summary>Unlock a locked partner account.</summary>
    AccountUnlock = 3,

    /// <summary>Catch-all for access issues not covered by other types.</summary>
    GeneralAccessIssue = 4
}
