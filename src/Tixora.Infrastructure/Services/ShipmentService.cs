using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Shipments;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Services;

public class ShipmentService : IShipmentService
{
    private readonly ITixoraDbContext _db;
    private readonly IShippingProvider _shippingProvider;
    private readonly IFileStorage _fileStorage;

    public ShipmentService(ITixoraDbContext db, IShippingProvider shippingProvider, IFileStorage fileStorage)
    {
        _db = db;
        _shippingProvider = shippingProvider;
        _fileStorage = fileStorage;
    }

    public async Task<ValidateAddressResponse> ValidateAddressAsync(ValidateAddressRequest request)
    {
        return await _shippingProvider.ValidateAddressAsync(request);
    }

    public async Task<ShipmentResponse> BookShipmentAsync(BookShipmentRequest request, Guid createdByUserId)
    {
        var ticket = await _db.Tickets.FindAsync(request.TicketId)
            ?? throw new InvalidOperationException($"Ticket '{request.TicketId}' not found.");

        if (ticket.TaskType != TaskType.T01)
            throw new InvalidOperationException("Shipments are only available for T-01 (Agreement Validation) tickets.");

        // Check if shipment already exists for this ticket
        var existing = await _db.Shipments.FirstOrDefaultAsync(s => s.TicketId == request.TicketId && s.Status != ShipmentStatus.Cancelled);
        if (existing != null)
            throw new InvalidOperationException("A shipment already exists for this ticket.");

        // Book with FedEx (or NoOp)
        var (trackingNumber, labelPdf) = await _shippingProvider.CreateShipmentAsync(request);

        // Save label PDF via file storage
        using var labelStream = new MemoryStream(labelPdf);
        var labelPath = await _fileStorage.SaveAsync($"label-{trackingNumber}.pdf", labelStream);

        var shipment = new Shipment
        {
            Id = Guid.CreateVersion7(),
            TicketId = request.TicketId,
            Status = ShipmentStatus.LabelReady,
            TrackingNumber = trackingNumber,
            RecipientName = request.RecipientName,
            RecipientCompany = request.RecipientCompany,
            RecipientPhone = request.RecipientPhone,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City = request.City,
            StateProvince = request.StateProvince,
            PostalCode = request.PostalCode,
            CountryCode = request.CountryCode,
            WeightKg = request.WeightKg,
            ServiceType = request.ServiceType,
            LabelPath = labelPath,
            CreatedAt = DateTime.UtcNow,
            ShippedAt = DateTime.UtcNow,
            CreatedByUserId = createdByUserId
        };

        _db.Shipments.Add(shipment);
        await _db.SaveChangesAsync();

        var displayId = ticket.TicketId;
        return MapToResponse(shipment, displayId);
    }

    public async Task<ShipmentResponse?> GetByTicketAsync(Guid ticketId)
    {
        var shipment = await _db.Shipments
            .AsNoTracking()
            .Include(s => s.Ticket)
            .FirstOrDefaultAsync(s => s.TicketId == ticketId && s.Status != ShipmentStatus.Cancelled);

        if (shipment is null) return null;

        return MapToResponse(shipment, shipment.Ticket.TicketId);
    }

    public async Task<(Stream Content, string FileName)?> GetLabelAsync(Guid shipmentId)
    {
        var shipment = await _db.Shipments.FindAsync(shipmentId);
        if (shipment?.LabelPath is null) return null;

        var stream = await _fileStorage.LoadAsync(shipment.LabelPath);
        return (stream, $"label-{shipment.TrackingNumber}.pdf");
    }

    private static ShipmentResponse MapToResponse(Shipment s, string ticketDisplayId)
    {
        return new ShipmentResponse(
            s.Id.ToString(),
            s.TicketId.ToString(),
            ticketDisplayId,
            s.Status.ToString(),
            s.TrackingNumber,
            s.RecipientName,
            s.RecipientCompany,
            s.AddressLine1,
            s.AddressLine2,
            s.City,
            s.StateProvince,
            s.PostalCode,
            s.CountryCode,
            s.WeightKg,
            s.ServiceType,
            s.LabelPath != null,
            s.CreatedAt,
            s.ShippedAt
        );
    }
}
