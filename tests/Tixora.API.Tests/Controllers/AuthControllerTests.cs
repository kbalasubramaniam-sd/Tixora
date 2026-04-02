// File: tests/Tixora.API.Tests/Controllers/AuthControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Auth;

namespace Tixora.API.Tests.Controllers;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsTokenAndUser()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("sarah.ahmad@tixora.ae", "Password1!"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.NotNull(result.User);
        Assert.Equal("sarah.ahmad@tixora.ae", result.User.Email);
        Assert.Equal("Sarah Ahmad", result.User.FullName);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("sarah.ahmad@tixora.ae", "WrongPassword!"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_NonExistentEmail_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("nobody@tixora.ae", "Password1!"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithValidToken_ReturnsUserProfile()
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client);
        TestHelpers.SetAuthToken(client, token);

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var profile = await response.Content.ReadFromJsonAsync<UserProfileResponse>();
        Assert.NotNull(profile);
        Assert.Equal("sarah.ahmad@tixora.ae", profile.Email);
        Assert.Equal("Sarah Ahmad", profile.FullName);
    }

    [Fact]
    public async Task Me_WithoutToken_Returns401()
    {
        // Fresh client with no auth header
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
