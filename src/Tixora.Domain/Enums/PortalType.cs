namespace Tixora.Domain.Enums;

/// <summary>
/// Distinguishes portal capabilities per product. Informational — does not affect workflow routing.
/// </summary>
public enum PortalType
{
    /// <summary>Full portal operations — Rabet, Rhoon.</summary>
    Transactional = 0,

    /// <summary>View uploads and reports only — Wtheeq, Mulem.</summary>
    ReadOnly = 1
}
