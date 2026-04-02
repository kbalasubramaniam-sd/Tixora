// File: src/Tixora.Application/Interfaces/ITicketQueryService.cs
using Tixora.Application.DTOs.Common;
using Tixora.Application.DTOs.Dashboard;
using Tixora.Application.DTOs.Tickets;
using Tixora.Domain.Enums;

namespace Tixora.Application.Interfaces;

public interface ITicketQueryService
{
    Task<DashboardStatsResponse> GetDashboardStatsAsync(Guid userId, UserRole role);
    Task<List<TicketSummaryResponse>> GetActionRequiredAsync(Guid userId, UserRole role);
    Task<List<ActivityEntryResponse>> GetRecentActivityAsync(Guid userId);
    Task<PagedResult<TicketSummaryResponse>> GetTeamQueueAsync(Guid userId, UserRole role, string? product, string? task, string? partner, string? requester, string? status, int page = 1, int pageSize = 20);
    Task<PagedResult<TicketSummaryResponse>> GetMyTicketsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<TicketDetailResponse?> GetTicketDetailAsync(Guid ticketId, Guid actorUserId, UserRole actorRole);
}
