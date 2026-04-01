using Tixora.Domain.Entities;

namespace Tixora.Domain.Interfaces;

public interface IPartnerRepository
{
    Task<List<Partner>> GetAllAsync();
    Task<Partner?> GetByIdAsync(Guid id);
    Task<Partner?> GetByIdWithProductsAsync(Guid id);
}
