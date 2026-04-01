using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Domain.Interfaces;

public interface ITicketRepository
{
    Task<Ticket?> GetByIdAsync(Guid id);
    Task<Ticket?> GetByTicketIdAsync(string ticketId);
    Task<Ticket> CreateAsync(Ticket ticket);
    Task UpdateAsync(Ticket ticket);
    Task<int> GetDailySequenceAsync(ProductCode productCode, TaskType taskType, DateTime date);
}
