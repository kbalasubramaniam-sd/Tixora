using Tixora.Application.Interfaces;

namespace Tixora.Infrastructure.Services;

public class LocalFileStorage : IFileStorage
{
    private readonly string _basePath;

    public LocalFileStorage(string basePath)
    {
        _basePath = basePath;
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveAsync(string fileName, Stream content, CancellationToken ct = default)
    {
        var datePath = DateTime.UtcNow.ToString("yyyy/MM/dd");
        var directory = Path.Combine(_basePath, datePath);
        Directory.CreateDirectory(directory);

        var uniqueName = $"{Guid.CreateVersion7()}_{fileName}";
        var fullPath = Path.Combine(directory, uniqueName);
        var relativePath = Path.Combine(datePath, uniqueName).Replace('\\', '/');

        await using var fileStream = new FileStream(fullPath, FileMode.Create);
        await content.CopyToAsync(fileStream, ct);

        return relativePath;
    }

    public Task<Stream> LoadAsync(string storagePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, storagePath);
        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"File not found: {storagePath}");

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string storagePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, storagePath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
        return Task.CompletedTask;
    }
}
