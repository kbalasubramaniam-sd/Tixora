using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class Shipment
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public ShipmentStatus Status { get; set; }
    public string? TrackingNumber { get; set; }

    // Recipient
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientCompany { get; set; } = string.Empty;
    public string RecipientPhone { get; set; } = string.Empty;

    // Address
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string StateProvince { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty; // ISO 2-letter (e.g., "AE")

    // Package
    public decimal WeightKg { get; set; }
    public string ServiceType { get; set; } = string.Empty; // e.g., "STANDARD_OVERNIGHT"

    // Label
    public string? LabelPath { get; set; } // path to stored label PDF

    public DateTime CreatedAt { get; set; }
    public DateTime? ShippedAt { get; set; }
    public Guid CreatedByUserId { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
}
