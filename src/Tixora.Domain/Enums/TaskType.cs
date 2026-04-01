namespace Tixora.Domain.Enums;

/// <summary>
/// The five request types that drive the partner onboarding lifecycle.
/// </summary>
public enum TaskType
{
    /// <summary>Agreement Validation and Sign-off.</summary>
    T01 = 0,

    /// <summary>UAT Access Creation — two-phase (provision then sign-off).</summary>
    T02 = 1,

    /// <summary>Partner Account Creation — access path driven by product.</summary>
    T03 = 2,

    /// <summary>User Account Creation.</summary>
    T04 = 3,

    /// <summary>Access and Credential Support (password reset, key regen, etc.).</summary>
    T05 = 4
}
