// File: src/Tixora.Application/Interfaces/IWorkflowEngine.cs
using Tixora.Application.DTOs.Tickets;

namespace Tixora.Application.Interfaces;

public interface IWorkflowEngine
{
    /// <summary>
    /// Creates a new ticket, resolves the correct workflow, assigns stage 1,
    /// and records an audit entry. Throws InvalidOperationException for
    /// validation failures (lifecycle mismatch, missing partner-product, etc.).
    /// </summary>
    Task<TicketResponse> CreateTicketAsync(CreateTicketRequest request, Guid createdByUserId);
}
