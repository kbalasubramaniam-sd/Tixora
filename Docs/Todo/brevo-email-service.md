# Brevo Email Service — .NET Integration Guide

A complete guide for integrating Brevo (formerly Sendinblue) transactional email into a .NET / ASP.NET Core application using both SMTP and REST API methods.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Setup](#quick-setup)
- [Method 1 — SMTP with MailKit](#method-1--smtp-with-mailkit)
- [Method 2 — REST API with HttpClient](#method-2--rest-api-with-httpclient)
- [Method 3 — Dependency Injection (ASP.NET Core)](#method-3--dependency-injection-aspnet-core)
- [Request Models](#request-models)
- [Configuration Reference](#configuration-reference)
- [SMTP vs API — When to Use Which](#smtp-vs-api--when-to-use-which)

---

## Overview

Brevo provides two integration paths for sending transactional email notifications from a .NET application:

| Method | Package | Best For |
|--------|---------|----------|
| SMTP | `MailKit` (NuGet) | Simple drop-in, existing SMTP flows |
| REST API | Built-in `HttpClient` | Templates, tracking, attachments, scheduling |

**Free tier:** 300 emails/day — no credit card required. No domain verification needed to start sending.

---

## Prerequisites

- .NET 6 or later
- A free [Brevo account](https://www.brevo.com)
- SMTP credentials **or** an API key (see [Quick Setup](#quick-setup))

---

## Quick Setup

1. Sign up at **brevo.com** — no credit card required
2. Navigate to **Settings → SMTP & API**
3. **For SMTP:** copy your login email + generate an SMTP key under the *SMTP* tab
4. **For API:** click the *API Keys* tab → **Generate a new API key**
5. Add both to your `appsettings.json` (see [Configuration Reference](#configuration-reference))

---

## Method 1 — SMTP with MailKit

The simplest integration. Works like any standard SMTP server — no SDK beyond MailKit needed.

### Install

```bash
dotnet add package MailKit
```

### Implementation

```csharp
// EmailService.Smtp.cs
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

public class BrevoSmtpEmailService
{
    private readonly string _smtpHost    = "smtp-relay.brevo.com";
    private readonly int    _smtpPort    = 587;
    private readonly string _login       = "your-brevo-login@email.com"; // Brevo account email
    private readonly string _apiKey      = "your-smtp-api-key";          // SMTP tab → generate key
    private readonly string _senderName  = "My App";
    private readonly string _senderEmail = "notifications@yourdomain.com";

    public async Task SendAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_senderName, _senderEmail));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;

        message.Body = new BodyBuilder
        {
            HtmlBody  = htmlBody,
            TextBody  = HtmlToPlainText(htmlBody) // optional plain-text fallback
        }.ToMessageBody();

        using var client = new SmtpClient();

        await client.ConnectAsync(_smtpHost, _smtpPort, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_login, _apiKey); // Login = Brevo email, Password = SMTP key
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    private static string HtmlToPlainText(string html) =>
        System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", "").Trim();
}
```

### Usage

```csharp
var emailService = new BrevoSmtpEmailService();

await emailService.SendAsync(
    toEmail:  "user@example.com",
    toName:   "John Doe",
    subject:  "Your order has shipped!",
    htmlBody: "<h1>Good news!</h1><p>Your order <strong>#12345</strong> is on its way.</p>"
);
```

---

## Method 2 — REST API with HttpClient

More control — supports Brevo templates, open/click tracking, attachments, and scheduled sends. Uses only the built-in `HttpClient`; no extra NuGet package required.

### Implementation

```csharp
// EmailService.Api.cs
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

public class BrevoApiEmailService
{
    private readonly HttpClient _http;
    private const string BaseUrl = "https://api.brevo.com/v3/smtp/email";

    public BrevoApiEmailService(HttpClient http, string apiKey)
    {
        _http = http;
        _http.DefaultRequestHeaders.Clear();
        _http.DefaultRequestHeaders.Add("api-key", apiKey);
        _http.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));
    }

    // ── Simple send ──────────────────────────────────────────────────────────
    public async Task<bool> SendAsync(EmailRequest request)
    {
        var payload = new
        {
            sender      = new { name = request.SenderName, email = request.SenderEmail },
            to          = new[] { new { email = request.ToEmail, name = request.ToName } },
            subject     = request.Subject,
            htmlContent = request.HtmlBody,
            textContent = request.TextBody
        };

        var json     = JsonSerializer.Serialize(payload);
        var content  = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await _http.PostAsync(BaseUrl, content);

        return response.IsSuccessStatusCode;
    }

    // ── Send using a Brevo template ──────────────────────────────────────────
    public async Task<bool> SendTemplateAsync(TemplateEmailRequest request)
    {
        var payload = new
        {
            sender     = new { name = request.SenderName, email = request.SenderEmail },
            to         = new[] { new { email = request.ToEmail, name = request.ToName } },
            templateId = request.TemplateId,
            @params    = request.TemplateParams // maps to {{params.xxx}} in Brevo template editor
        };

        var json     = JsonSerializer.Serialize(payload);
        var content  = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await _http.PostAsync(BaseUrl, content);

        return response.IsSuccessStatusCode;
    }

    // ── Send with attachment ─────────────────────────────────────────────────
    public async Task<bool> SendWithAttachmentAsync(EmailRequest request, string filePath)
    {
        var fileBytes = await File.ReadAllBytesAsync(filePath);
        var fileName  = Path.GetFileName(filePath);

        var payload = new
        {
            sender      = new { name = request.SenderName, email = request.SenderEmail },
            to          = new[] { new { email = request.ToEmail, name = request.ToName } },
            subject     = request.Subject,
            htmlContent = request.HtmlBody,
            attachment  = new[]
            {
                new
                {
                    content = Convert.ToBase64String(fileBytes),
                    name    = fileName
                }
            }
        };

        var json     = JsonSerializer.Serialize(payload);
        var content  = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await _http.PostAsync(BaseUrl, content);

        return response.IsSuccessStatusCode;
    }
}
```

---

## Method 3 — Dependency Injection (ASP.NET Core)

The recommended approach for production applications.

### `Program.cs`

```csharp
builder.Services.AddHttpClient<BrevoApiEmailService>((sp, client) =>
{
    var apiKey = builder.Configuration["Brevo:ApiKey"]!;
    client.DefaultRequestHeaders.Add("api-key", apiKey);
    client.DefaultRequestHeaders.Accept
          .Add(new MediaTypeWithQualityHeaderValue("application/json"));
});
```

### `NotificationService.cs`

```csharp
public class NotificationService(BrevoApiEmailService emailSvc, IConfiguration config)
{
    private readonly string _senderName  = config["Brevo:SenderName"]!;
    private readonly string _senderEmail = config["Brevo:SenderEmail"]!;

    public async Task SendWelcomeEmailAsync(string userEmail, string userName)
    {
        await emailSvc.SendAsync(new EmailRequest(
            SenderName:  _senderName,
            SenderEmail: _senderEmail,
            ToEmail:     userEmail,
            ToName:      userName,
            Subject:     $"Welcome, {userName}!",
            HtmlBody:    $"<h2>Welcome aboard!</h2><p>Hi {userName}, glad to have you!</p>"
        ));
    }

    public async Task SendOrderShippedAsync(string userEmail, string orderId)
    {
        // Uses a pre-built template created in Brevo dashboard → Templates
        await emailSvc.SendTemplateAsync(new TemplateEmailRequest(
            SenderName:     _senderName,
            SenderEmail:    _senderEmail,
            ToEmail:        userEmail,
            ToName:         "Customer",
            TemplateId:     5, // your template ID from Brevo
            TemplateParams: new Dictionary<string, string>
            {
                { "orderId",     orderId },
                { "trackingUrl", $"https://yourapp.com/track/{orderId}" }
            }
        ));
    }
}
```

---

## Request Models

```csharp
public record EmailRequest(
    string  SenderName,
    string  SenderEmail,
    string  ToEmail,
    string  ToName,
    string  Subject,
    string  HtmlBody,
    string? TextBody = null
);

public record TemplateEmailRequest(
    string                      SenderName,
    string                      SenderEmail,
    string                      ToEmail,
    string                      ToName,
    int                         TemplateId,
    Dictionary<string, string>  TemplateParams
);
```

---

## Configuration Reference

### `appsettings.json`

```json
{
  "Brevo": {
    "ApiKey":      "xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx",
    "SmtpLogin":   "your-brevo-email@example.com",
    "SmtpApiKey":  "your-smtp-password-from-brevo",
    "SenderName":  "My App",
    "SenderEmail": "no-reply@yourdomain.com"
  }
}
```

> **Security tip:** In production, store `ApiKey` and `SmtpApiKey` in environment variables or a secrets manager (Azure Key Vault, AWS Secrets Manager, .NET User Secrets) — never commit them to source control.

### SMTP connection details

| Setting | Value |
|---------|-------|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Encryption | STARTTLS |
| Username | Your Brevo account email |
| Password | SMTP key from Brevo dashboard |

---

## SMTP vs API — When to Use Which

| Feature | SMTP (MailKit) | REST API (HttpClient) |
|---------|---------------|----------------------|
| Setup complexity | Minimal | Low |
| Brevo templates | No | Yes |
| Open / click tracking | No | Yes |
| Attachments | Yes (via MailKit) | Yes (Base64) |
| Scheduling | No | Yes |
| Error detail | Basic | Full JSON response |
| Extra NuGet package | `MailKit` | None |
| Recommended for | Simple notifications | Full-featured integration |

**Rule of thumb:** Start with SMTP for simplicity. Switch to the REST API when you need Brevo-specific features like templates, delivery tracking, or webhook events.

---

*Brevo free tier: 300 emails/day · No credit card required · No domain verification needed to start*
