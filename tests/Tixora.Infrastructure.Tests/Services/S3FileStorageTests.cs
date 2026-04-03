using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Tixora.Infrastructure.Services;

namespace Tixora.Infrastructure.Tests.Services;

public class S3FileStorageTests
{
    private readonly Mock<IAmazonS3> _s3Mock;
    private readonly S3FileStorage _storage;

    public S3FileStorageTests()
    {
        _s3Mock = new Mock<IAmazonS3>();
        var settings = Options.Create(new S3StorageSettings
        {
            BucketName = "test-bucket",
            Region = "me-south-1",
            Prefix = "uploads"
        });
        _storage = new S3FileStorage(_s3Mock.Object, settings, NullLogger<S3FileStorage>.Instance);
    }

    [Fact]
    public async Task SaveAsync_CallsPutObject_ReturnsKey()
    {
        _s3Mock.Setup(s => s.PutObjectAsync(It.IsAny<PutObjectRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PutObjectResponse());

        using var stream = new MemoryStream(new byte[] { 1, 2, 3 });
        var key = await _storage.SaveAsync("test.pdf", stream);

        Assert.StartsWith("uploads/", key);
        Assert.Contains("test.pdf", key);
        _s3Mock.Verify(s => s.PutObjectAsync(It.Is<PutObjectRequest>(r =>
            r.BucketName == "test-bucket" &&
            r.ContentType == "application/pdf"
        ), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoadAsync_CallsGetObject_ReturnsStream()
    {
        var responseStream = new MemoryStream(new byte[] { 1, 2, 3 });
        _s3Mock.Setup(s => s.GetObjectAsync("test-bucket", "uploads/file.pdf", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetObjectResponse { ResponseStream = responseStream });

        var result = await _storage.LoadAsync("uploads/file.pdf");

        Assert.NotNull(result);
        Assert.Equal(3, result.Length);
    }

    [Fact]
    public async Task DeleteAsync_CallsDeleteObject()
    {
        _s3Mock.Setup(s => s.DeleteObjectAsync("test-bucket", "uploads/file.pdf", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DeleteObjectResponse());

        await _storage.DeleteAsync("uploads/file.pdf");

        _s3Mock.Verify(s => s.DeleteObjectAsync("test-bucket", "uploads/file.pdf", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SaveAsync_SanitizesFileName()
    {
        _s3Mock.Setup(s => s.PutObjectAsync(It.IsAny<PutObjectRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PutObjectResponse());

        using var stream = new MemoryStream(new byte[] { 1 });
        var key = await _storage.SaveAsync("../../etc/passwd", stream);

        Assert.DoesNotContain("..", key);
        Assert.Contains("passwd", key); // only the filename part
    }
}
