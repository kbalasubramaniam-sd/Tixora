namespace Tixora.Domain.Enums;

/// <summary>
/// How partners access a product. All products are Both (Portal + API) in MVP 1.
/// Kept for future flexibility — not currently used for routing decisions.
/// </summary>
public enum ProductAccessMode
{
    /// <summary>Portal + API access.</summary>
    Both = 0

    // ApiOnly removed — all 4 products confirmed as Both (2026-04-02 business feedback)
}
