using Tixora.Application.DTOs.Common;
using Tixora.Application.DTOs.Search;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.Application.Interfaces;

public interface ISearchService
{
    Task<List<SearchResultResponse>> GlobalSearchAsync(string query);
    Task<PagedResult<TicketSummaryResponse>> AdvancedSearchAsync(AdvancedSearchRequest request);
}
