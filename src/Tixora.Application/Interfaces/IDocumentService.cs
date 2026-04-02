using Tixora.Application.DTOs.Documents;

namespace Tixora.Application.Interfaces;

public interface IDocumentService
{
    Task<DocumentResponse> UploadAsync(Guid ticketId, Guid uploadedByUserId, string fileName, string contentType, long sizeBytes, Stream content);
    Task<List<DocumentResponse>> GetByTicketAsync(Guid ticketId);
    Task<(Stream Content, string FileName, string ContentType)?> DownloadAsync(Guid documentId);
}
