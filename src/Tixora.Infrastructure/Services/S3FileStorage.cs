using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Tixora.Application.Interfaces;

namespace Tixora.Infrastructure.Services;

public class S3StorageSettings
{
    public string BucketName { get; set; } = string.Empty;
    public string Region { get; set; } = "me-south-1";
    public string? Prefix { get; set; } = "uploads"; // optional key prefix
}

public class S3FileStorage : IFileStorage
{
    private readonly IAmazonS3 _s3;
    private readonly S3StorageSettings _settings;
    private readonly ILogger<S3FileStorage> _logger;

    public S3FileStorage(IAmazonS3 s3, IOptions<S3StorageSettings> settings, ILogger<S3FileStorage> logger)
    {
        _s3 = s3;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<string> SaveAsync(string fileName, Stream content, CancellationToken ct = default)
    {
        var safeName = Path.GetFileName(fileName);
        var datePath = DateTime.UtcNow.ToString("yyyy/MM/dd");
        var key = string.IsNullOrEmpty(_settings.Prefix)
            ? $"{datePath}/{Guid.CreateVersion7()}_{safeName}"
            : $"{_settings.Prefix}/{datePath}/{Guid.CreateVersion7()}_{safeName}";

        var request = new PutObjectRequest
        {
            BucketName = _settings.BucketName,
            Key = key,
            InputStream = content,
            ContentType = GetContentType(safeName),
            ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
        };

        await _s3.PutObjectAsync(request, ct);
        _logger.LogInformation("Uploaded to S3: {Key}", key);
        return key;
    }

    public async Task<Stream> LoadAsync(string storagePath, CancellationToken ct = default)
    {
        var response = await _s3.GetObjectAsync(_settings.BucketName, storagePath, ct);
        return response.ResponseStream;
    }

    public async Task DeleteAsync(string storagePath, CancellationToken ct = default)
    {
        await _s3.DeleteObjectAsync(_settings.BucketName, storagePath, ct);
        _logger.LogInformation("Deleted from S3: {Key}", storagePath);
    }

    private static string GetContentType(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".txt" => "text/plain",
            _ => "application/octet-stream"
        };
    }
}
