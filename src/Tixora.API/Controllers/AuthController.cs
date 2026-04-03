// File: src/Tixora.API/Controllers/AuthController.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Auth;
using Tixora.Application.Interfaces;
using Tixora.Domain.Enums;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITixoraDbContext _db;

    public AuthController(IAuthService authService, ITixoraDbContext db)
    {
        _authService = authService;
        _db = db;
    }

    /// <summary>
    /// Authenticate with email and password. Returns a JWT token and user profile.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (result is null)
            return Unauthorized(new { message = "Invalid email or password." });

        return Ok(result);
    }

    /// <summary>
    /// Get the current authenticated user's profile from JWT claims.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Me()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var email = User.FindFirstValue(JwtRegisteredClaimNames.Email);
        var role = User.FindFirstValue(ClaimTypes.Role);
        var name = User.FindFirstValue(ClaimTypes.Name);

        if (userId is null || email is null || role is null || name is null)
            return Unauthorized();

        // Role is stored as int in JWT — convert back to enum name for frontend
        var roleName = Enum.IsDefined(typeof(UserRole), int.Parse(role))
            ? ((UserRole)int.Parse(role)).ToString()
            : role;

        var profile = new UserProfileResponse(
            Guid.Parse(userId),
            name,
            email,
            roleName,
            true);

        return Ok(profile);
    }

    /// <summary>
    /// Returns all active users for the demo login screen. No auth required.
    /// </summary>
    [HttpGet("demo-users")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<UserProfileResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDemoUsers()
    {
        var users = await _db.Users
            .Where(u => u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new UserProfileResponse(
                u.Id,
                u.FullName,
                u.Email,
                u.Role.ToString(),
                u.IsActive))
            .ToListAsync();

        return Ok(users);
    }
}
