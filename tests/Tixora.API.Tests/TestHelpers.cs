// File: tests/Tixora.API.Tests/TestHelpers.cs
using System.Net.Http.Json;
using Tixora.Application.DTOs.Auth;

namespace Tixora.API.Tests;

public static class TestHelpers
{
    public static async Task<string> GetAuthTokenAsync(HttpClient client, string email = "sarah.ahmad@tixora.ae", string password = "Password1!")
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        return result!.Token;
    }

    public static void SetAuthToken(HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }
}
