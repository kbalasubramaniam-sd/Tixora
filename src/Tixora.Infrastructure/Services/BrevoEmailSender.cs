using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Tixora.Application.Interfaces;

namespace Tixora.Infrastructure.Services;

public class BrevoEmailSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = "noreply@tixora.ae";
    public string SenderName { get; set; } = "Tixora Portal";
}

public class BrevoEmailSender : IEmailSender
{
    private readonly HttpClient _httpClient;
    private readonly BrevoEmailSettings _settings;
    private readonly ILogger<BrevoEmailSender> _logger;

    public BrevoEmailSender(HttpClient httpClient, IOptions<BrevoEmailSettings> settings, ILogger<BrevoEmailSender> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct = default)
    {
        var payload = new
        {
            sender = new { email = _settings.SenderEmail, name = _settings.SenderName },
            to = new[] { new { email = toEmail, name = toName } },
            subject,
            htmlContent = htmlBody
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
        request.Headers.Add("api-key", _settings.ApiKey);
        request.Content = JsonContent.Create(payload);

        var response = await _httpClient.SendAsync(request, ct);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Brevo email failed: {StatusCode} {Body}", response.StatusCode, body);
        }
        else
        {
            _logger.LogInformation("Brevo email sent: To={Email}, Subject={Subject}", toEmail, subject);
        }
    }
}
