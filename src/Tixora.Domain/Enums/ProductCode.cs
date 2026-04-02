namespace Tixora.Domain.Enums;

/// <summary>
/// The four government-integrated platforms managed by Tixora.
/// </summary>
public enum ProductCode
{
    /// <summary>Rabet — Insurance data to ICP. Transactional portal + API.</summary>
    RBT = 0,

    /// <summary>Rhoon — Mortgage transactions. Transactional portal + API.</summary>
    RHN = 1,

    /// <summary>Wtheeq — Vehicle insurance data. Read-only portal + API.</summary>
    WTQ = 2,

    /// <summary>Mulem — Motor insurance pricing. Read-only portal + API.</summary>
    MLM = 3
}
