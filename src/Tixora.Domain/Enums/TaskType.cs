namespace Tixora.Domain.Enums;

/// <summary>
/// The four request types that drive the partner onboarding lifecycle.
/// </summary>
public enum TaskType
{
    /// <summary>Agreement Validation and Sign-off.</summary>
    T01 = 0,

    /// <summary>UAT Access Creation — two-phase (provision then sign-off).</summary>
    T02 = 1,

    /// <summary>Production Account Creation — partner account + user setup, with API opt-in.</summary>
    T03 = 2,

    /// <summary>Access and Credential Support (password reset, key regen, etc.).</summary>
    T04 = 3
}
