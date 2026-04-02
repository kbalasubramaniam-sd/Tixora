// File: src/Tixora.Application/Interfaces/ITicketQueryService.cs
using Tixora.Application.DTOs.Dashboard;
using Tixora.Application.DTOs.Tickets;
using Tixora.Domain.Enums;

namespace Tixora.Application.Interfaces;

public interface ITicketQueryService
{
    Task<DashboardStatsResponse> GetDashboardStatsAsync(Guid userId, UserRole role);
    Task<List<TicketSummaryResponse>> GetActionRequiredAsync(Guid userId, UserRole role);
    Task<List<ActivityEntryResponse>> GetRecentActivityAsync(Guid userId);
    Task<List<TicketSummaryResponse>> GetTeamQueueAsync(Guid userId, UserRole role, string? product, string? task, string? partner, string? requester, string? status);
    Task<List<TicketSummaryResponse>> GetMyTicketsAsync(Guid userId);
    Task<TicketDetailResponse?> GetTicketDetailAsync(Guid ticketId, Guid actorUserId, UserRole actorRole);
}
