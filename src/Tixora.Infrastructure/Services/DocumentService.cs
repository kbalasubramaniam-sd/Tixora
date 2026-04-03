using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Documents;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Services;

public class DocumentService : IDocumentService
{
    private readonly ITixoraDbContext _db;
    private readonly IFileStorage _fileStorage;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain"
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB

    public DocumentService(ITixoraDbContext db, IFileStorage fileStorage)
    {
        _db = db;
        _fileStorage = fileStorage;
    }

    public async Task<DocumentResponse> UploadAsync(Guid ticketId, Guid uploadedByUserId, string fileName, string contentType, long sizeBytes, Stream content, string documentType)
    {
        var ticket = await _db.Tickets.FindAsync(ticketId)
            ?? throw new InvalidOperationException($"Ticket '{ticketId}' not found.");

        if (sizeBytes > MaxFileSizeBytes)
            throw new InvalidOperationException($"File size exceeds maximum allowed ({MaxFileSizeBytes / 1024 / 1024}MB).");

        if (!AllowedContentTypes.Contains(contentType))
            throw new InvalidOperationException($"File type '{contentType}' is not allowed.");

        var user = await _db.Users.FindAsync(uploadedByUserId)
            ?? throw new InvalidOperationException($"User '{uploadedByUserId}' not found.");

        var storagePath = await _fileStorage.SaveAsync(fileName, content);

        if (!Enum.TryParse<DocumentType>(documentType, true, out var docType))
            docType = DocumentType.Other;

        var document = new Document
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticketId,
            DocumentType = docType,
            FileName = fileName,
            ContentType = contentType,
            SizeBytes = sizeBytes,
            StoragePath = storagePath,
            UploadedByUserId = uploadedByUserId,
            UploadedAt = DateTime.UtcNow
        };

        _db.Documents.Add(document);
        await _db.SaveChangesAsync();

        return new DocumentResponse(
            document.Id.ToString(),
            document.FileName,
            document.ContentType,
            document.SizeBytes,
            user.FullName,
            document.UploadedAt,
            document.DocumentType.ToString()
        );
    }

    public async Task<List<DocumentResponse>> GetByTicketAsync(Guid ticketId)
    {
        return await _db.Documents
            .AsNoTracking()
            .Include(d => d.UploadedBy)
            .Where(d => d.TicketId == ticketId)
            .OrderByDescending(d => d.UploadedAt)
            .Select(d => new DocumentResponse(
                d.Id.ToString(),
                d.FileName,
                d.ContentType,
                d.SizeBytes,
                d.UploadedBy.FullName,
                d.UploadedAt,
                d.DocumentType.ToString()
            ))
            .ToListAsync();
    }

    public async Task<(Stream Content, string FileName, string ContentType)?> DownloadAsync(Guid documentId)
    {
        var doc = await _db.Documents.FindAsync(documentId);
        if (doc is null) return null;

        var stream = await _fileStorage.LoadAsync(doc.StoragePath);
        return (stream, doc.FileName, doc.ContentType);
    }
}
