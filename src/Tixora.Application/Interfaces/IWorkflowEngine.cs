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

    /// <summary>
    /// Approves the current stage. If last stage, completes the ticket and advances
    /// the partner-product lifecycle. Otherwise advances to the next stage with auto-assignment.
    /// Throws InvalidOperationException if ticket is not active or actor is not the assigned user.
    /// </summary>
    Task<TicketResponse> ApproveStageAsync(Guid ticketId, Guid actorUserId, string? comments);

    /// <summary>
    /// Rejects the ticket (terminal). Only the assigned stage owner can reject.
    /// Throws InvalidOperationException if ticket is not active or actor is not the assigned user.
    /// </summary>
    Task<TicketResponse> RejectAsync(Guid ticketId, Guid actorUserId, string? comments);

    /// <summary>
    /// Returns the ticket to the requester for more information. Status becomes PendingRequesterAction.
    /// Throws InvalidOperationException if ticket is not active or actor is not the assigned user.
    /// </summary>
    Task<TicketResponse> ReturnForClarificationAsync(Guid ticketId, Guid actorUserId, string comments);

    /// <summary>
    /// Requester responds to a clarification request. Status restores to previous active status
    /// based on current stage type. Throws InvalidOperationException if status is not
    /// PendingRequesterAction or actor is not the original requester.
    /// </summary>
    Task<TicketResponse> RespondToClarificationAsync(Guid ticketId, Guid actorUserId, string comments);

    /// <summary>
    /// Cancels the ticket (terminal). Only allowed when status is Submitted (pre-action).
    /// Only the original requester can cancel. Throws InvalidOperationException otherwise.
    /// </summary>
    Task<TicketResponse> CancelAsync(Guid ticketId, Guid actorUserId, string reason);

    /// <summary>
    /// Reassigns the ticket to a different user within the same role as the current stage requires.
    /// Throws InvalidOperationException if ticket is not active, the new assignee doesn't exist,
    /// or the new assignee doesn't have the required role.
    /// </summary>
    Task<TicketResponse> ReassignAsync(Guid ticketId, Guid actorUserId, Guid newAssigneeUserId);
}
