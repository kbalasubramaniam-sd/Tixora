using Microsoft.Extensions.Logging;
using Tixora.Application.Interfaces;

namespace Tixora.Infrastructure.Services;

public class NoOpEmailSender : IEmailSender
{
    private readonly ILogger<NoOpEmailSender> _logger;

    public NoOpEmailSender(ILogger<NoOpEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct = default)
    {
        _logger.LogDebug("Email suppressed (NoOp): To={Email}, Subject={Subject}", toEmail, subject);
        return Task.CompletedTask;
    }
}
