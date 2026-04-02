// File: src/Tixora.Infrastructure/Services/AuthService.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Tixora.Application.DTOs.Auth;
using Tixora.Application.Interfaces;

namespace Tixora.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly ITixoraDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthService(ITixoraDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user is null || !user.IsActive)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        var token = GenerateJwtToken(user);

        var profile = new UserProfileResponse(
            user.Id,
            user.FullName,
            user.Email,
            user.Role.ToString(),
            user.IsActive);

        return new LoginResponse(token, profile);
    }

    private string GenerateJwtToken(Domain.Entities.User user)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key is not configured.");
        var issuer = _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
        var audience = _configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
        var expiryHours = int.Parse(
            _configuration["Jwt:ExpiryHours"]
            ?? throw new InvalidOperationException("Jwt:ExpiryHours is not configured."));

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, ((int)user.Role).ToString()),
            new Claim(ClaimTypes.Name, user.FullName)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
