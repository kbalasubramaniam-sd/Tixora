using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Domain.Interfaces;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByCodeAsync(ProductCode code);
}
