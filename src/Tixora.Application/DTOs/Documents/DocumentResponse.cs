namespace Tixora.Application.DTOs.Documents;

public record DocumentResponse(
    string Id,
    string FileName,
    string ContentType,
    long SizeBytes,
    string UploadedBy,
    DateTime UploadedAt
);
