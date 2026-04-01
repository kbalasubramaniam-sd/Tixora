namespace Tixora.Domain.Enums;

/// <summary>
/// How partners access a product. Determines T-03 provisioning path options.
/// </summary>
public enum ProductAccessMode
{
    /// <summary>Portal + API — partner chooses portal-only or portal+API at T-03.</summary>
    Both = 0,

    /// <summary>API primary, read-only portal — T-03 always routes to API provisioning.</summary>
    ApiOnly = 1
}
