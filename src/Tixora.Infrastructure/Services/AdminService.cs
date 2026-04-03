using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Admin;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly ITixoraDbContext _db;

    public AdminService(ITixoraDbContext db)
    {
        _db = db;
    }

    // --- SLA Config ---

    public async Task<SlaConfigResponse> GetSlaConfigAsync()
    {
        var workflows = await _db.WorkflowDefinitions
            .AsNoTracking()
            .Where(w => w.IsActive)
            .Include(w => w.Stages)
            .OrderBy(w => w.ProductCode)
            .ThenBy(w => w.TaskType)
            .ToListAsync();

        var entries = workflows.Select(w => new SlaConfigEntry(
            ProductCode: w.ProductCode.ToString(),
            TaskType: w.TaskType.ToString(),
            ProvisioningPath: w.ProvisioningPath?.ToString(),
            Stages: w.Stages.OrderBy(s => s.StageOrder).Select(s => new StageSlaConfig(
                StageId: s.Id.ToString(),
                StageName: s.StageName,
                SlaBusinessHours: s.SlaBusinessHours
            )).ToList()
        )).ToList();

        return new SlaConfigResponse(entries);
    }

    public async Task UpdateSlaConfigAsync(UpdateSlaConfigRequest request)
    {
        var stageIds = request.Stages.Select(s => s.StageId).ToList();
        var stages = await _db.StageDefinitions
            .Where(s => stageIds.Contains(s.Id))
            .ToListAsync();

        foreach (var update in request.Stages)
        {
            var stage = stages.FirstOrDefault(s => s.Id == update.StageId);
            if (stage != null)
            {
                stage.SlaBusinessHours = update.SlaBusinessHours;
            }
        }

        await _db.SaveChangesAsync();
    }

    // --- Business Hours ---

    public async Task<BusinessHoursResponse> GetBusinessHoursAsync()
    {
        var configs = await _db.BusinessHoursConfigs
            .AsNoTracking()
            .OrderBy(c => c.DayOfWeek)
            .ToListAsync();

        var days = configs.Select(c => new DayConfig(
            Id: c.Id.ToString(),
            DayOfWeek: c.DayOfWeek.ToString(),
            IsWorkingDay: c.IsWorkingDay,
            StartTime: c.StartTime.ToString("HH:mm"),
            EndTime: c.EndTime.ToString("HH:mm")
        )).ToList();

        return new BusinessHoursResponse(days);
    }

    public async Task UpdateBusinessHoursAsync(UpdateBusinessHoursRequest request)
    {
        var ids = request.Days.Select(d => d.Id).ToList();
        var configs = await _db.BusinessHoursConfigs
            .Where(c => ids.Contains(c.Id))
            .ToListAsync();

        foreach (var update in request.Days)
        {
            var config = configs.FirstOrDefault(c => c.Id == update.Id);
            if (config != null)
            {
                config.IsWorkingDay = update.IsWorkingDay;

                if (!TimeOnly.TryParse(update.StartTime, out var startTime))
                    throw new InvalidOperationException($"Invalid StartTime format: '{update.StartTime}'. Expected HH:mm format.");
                if (!TimeOnly.TryParse(update.EndTime, out var endTime))
                    throw new InvalidOperationException($"Invalid EndTime format: '{update.EndTime}'. Expected HH:mm format.");

                config.StartTime = startTime;
                config.EndTime = endTime;
            }
        }

        await _db.SaveChangesAsync();
    }

    // --- Holidays ---

    public async Task<List<HolidayResponse>> GetHolidaysAsync()
    {
        var holidays = await _db.Holidays
            .AsNoTracking()
            .OrderBy(h => h.Date)
            .ToListAsync();

        return holidays.Select(h => new HolidayResponse(
            Id: h.Id.ToString(),
            Date: h.Date.ToString("yyyy-MM-dd"),
            Name: h.Name
        )).ToList();
    }

    public async Task<HolidayResponse> CreateHolidayAsync(CreateHolidayRequest request)
    {
        var holiday = new Holiday
        {
            Id = Guid.CreateVersion7(),
            Date = DateOnly.Parse(request.Date),
            Name = request.Name
        };

        _db.Holidays.Add(holiday);
        await _db.SaveChangesAsync();

        return new HolidayResponse(
            Id: holiday.Id.ToString(),
            Date: holiday.Date.ToString("yyyy-MM-dd"),
            Name: holiday.Name
        );
    }

    public async Task DeleteHolidayAsync(Guid id)
    {
        var holiday = await _db.Holidays.FindAsync(id);
        if (holiday != null)
        {
            _db.Holidays.Remove(holiday);
            await _db.SaveChangesAsync();
        }
    }

    // --- Delegates ---

    public async Task<List<DelegateResponse>> GetDelegatesAsync()
    {
        var delegates = await _db.DelegateApprovers
            .AsNoTracking()
            .Where(d => d.IsActive)
            .Include(d => d.PrimaryUser)
            .Include(d => d.DelegateUser)
            .OrderBy(d => d.CreatedAt)
            .ToListAsync();

        return delegates.Select(d => new DelegateResponse(
            Id: d.Id.ToString(),
            PrimaryUserName: d.PrimaryUser.FullName,
            DelegateUserName: d.DelegateUser.FullName,
            ValidFrom: d.ValidFrom?.ToString("yyyy-MM-dd"),
            ValidTo: d.ValidTo?.ToString("yyyy-MM-dd"),
            IsActive: d.IsActive
        )).ToList();
    }

    public async Task<DelegateResponse> CreateDelegateAsync(CreateDelegateRequest request)
    {
        var primaryUser = await _db.Users.FindAsync(request.PrimaryUserId)
            ?? throw new InvalidOperationException("Primary user not found.");
        var delegateUser = await _db.Users.FindAsync(request.DelegateUserId)
            ?? throw new InvalidOperationException("Delegate user not found.");

        var entity = new DelegateApprover
        {
            Id = Guid.CreateVersion7(),
            PrimaryUserId = request.PrimaryUserId,
            DelegateUserId = request.DelegateUserId,
            ValidFrom = request.ValidFrom,
            ValidTo = request.ValidTo,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.DelegateApprovers.Add(entity);
        await _db.SaveChangesAsync();

        return new DelegateResponse(
            Id: entity.Id.ToString(),
            PrimaryUserName: primaryUser.FullName,
            DelegateUserName: delegateUser.FullName,
            ValidFrom: entity.ValidFrom?.ToString("yyyy-MM-dd"),
            ValidTo: entity.ValidTo?.ToString("yyyy-MM-dd"),
            IsActive: entity.IsActive
        );
    }

    public async Task DeleteDelegateAsync(Guid id)
    {
        var entity = await _db.DelegateApprovers.FindAsync(id);
        if (entity != null)
        {
            entity.IsActive = false;
            await _db.SaveChangesAsync();
        }
    }

    // --- Workflow Config ---

    public async Task<WorkflowConfigResponse> GetWorkflowConfigAsync()
    {
        var workflows = await _db.WorkflowDefinitions
            .AsNoTracking()
            .Where(w => w.IsActive)
            .Include(w => w.Stages)
            .OrderBy(w => w.ProductCode)
            .ThenBy(w => w.TaskType)
            .ToListAsync();

        var entries = workflows.Select(w => new WorkflowEntry(
            Id: w.Id.ToString(),
            ProductCode: w.ProductCode.ToString(),
            TaskType: w.TaskType.ToString(),
            ProvisioningPath: w.ProvisioningPath?.ToString(),
            Stages: w.Stages.OrderBy(s => s.StageOrder).Select(s => new StageEntry(
                Id: s.Id.ToString(),
                StageOrder: s.StageOrder,
                StageName: s.StageName,
                StageType: s.StageType.ToString(),
                AssignedRole: s.AssignedRole.ToString(),
                SlaBusinessHours: s.SlaBusinessHours
            )).ToList()
        )).ToList();

        return new WorkflowConfigResponse(entries);
    }

    // --- Partners ---

    private static PartnerAdminResponse MapPartner(Partner p) => new(
        Id: p.Id.ToString(),
        Name: p.Name,
        Alias: p.Alias,
        CreatedAt: p.CreatedAt,
        Products: p.PartnerProducts
            .OrderBy(pp => pp.ProductCode)
            .Select(pp => new PartnerProductAdminResponse(
                Id: pp.Id.ToString(),
                ProductCode: pp.ProductCode.ToString(),
                ProductName: pp.Product.Name,
                LifecycleState: pp.LifecycleState.ToString(),
                CompanyCode: pp.CompanyCode,
                CreatedAt: pp.CreatedAt
            )).ToList()
    );

    public async Task<List<PartnerAdminResponse>> GetPartnersAsync()
    {
        var partners = await _db.Partners
            .AsNoTracking()
            .Include(p => p.PartnerProducts)
                .ThenInclude(pp => pp.Product)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return partners.Select(MapPartner).ToList();
    }

    public async Task<PartnerAdminResponse?> GetPartnerAsync(Guid id)
    {
        var partner = await _db.Partners
            .AsNoTracking()
            .Include(p => p.PartnerProducts)
                .ThenInclude(pp => pp.Product)
            .FirstOrDefaultAsync(p => p.Id == id);

        return partner is null ? null : MapPartner(partner);
    }

    public async Task<PartnerAdminResponse> CreatePartnerAsync(CreatePartnerRequest request)
    {
        var partner = new Partner
        {
            Id = Guid.CreateVersion7(),
            Name = request.Name,
            Alias = request.Alias,
            CreatedAt = DateTime.UtcNow
        };

        _db.Partners.Add(partner);
        await _db.SaveChangesAsync();

        return new PartnerAdminResponse(
            Id: partner.Id.ToString(),
            Name: partner.Name,
            Alias: partner.Alias,
            CreatedAt: partner.CreatedAt,
            Products: []
        );
    }

    public async Task UpdatePartnerAsync(Guid id, UpdatePartnerRequest request)
    {
        var partner = await _db.Partners.FindAsync(id)
            ?? throw new InvalidOperationException("Partner not found.");

        partner.Name = request.Name;
        partner.Alias = request.Alias;
        await _db.SaveChangesAsync();
    }

    public async Task DeletePartnerAsync(Guid id)
    {
        var partner = await _db.Partners
            .Include(p => p.PartnerProducts)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new InvalidOperationException("Partner not found.");

        foreach (var pp in partner.PartnerProducts)
        {
            var hasTickets = await _db.Tickets.AnyAsync(t => t.PartnerProductId == pp.Id);
            if (hasTickets)
                throw new InvalidOperationException("Cannot remove: has existing tickets");
        }

        _db.PartnerProducts.RemoveRange(partner.PartnerProducts);
        _db.Partners.Remove(partner);
        await _db.SaveChangesAsync();
    }

    public async Task<PartnerProductAdminResponse> LinkProductAsync(Guid partnerId, LinkProductRequest request)
    {
        var partner = await _db.Partners.FindAsync(partnerId)
            ?? throw new InvalidOperationException("Partner not found.");

        if (!Enum.TryParse<ProductCode>(request.ProductCode, out var productCode))
            throw new InvalidOperationException($"Invalid product code: {request.ProductCode}");

        var product = await _db.Products.FirstOrDefaultAsync(p => p.Code == productCode)
            ?? throw new InvalidOperationException($"Product not found: {request.ProductCode}");

        var pp = new PartnerProduct
        {
            Id = Guid.CreateVersion7(),
            PartnerId = partnerId,
            ProductCode = productCode,
            CompanyCode = request.CompanyCode,
            LifecycleState = LifecycleState.None,
            StateChangedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _db.PartnerProducts.Add(pp);
        await _db.SaveChangesAsync();

        return new PartnerProductAdminResponse(
            Id: pp.Id.ToString(),
            ProductCode: pp.ProductCode.ToString(),
            ProductName: product.Name,
            LifecycleState: pp.LifecycleState.ToString(),
            CompanyCode: pp.CompanyCode,
            CreatedAt: pp.CreatedAt
        );
    }

    public async Task UnlinkProductAsync(Guid partnerId, Guid partnerProductId)
    {
        var pp = await _db.PartnerProducts
            .FirstOrDefaultAsync(p => p.PartnerId == partnerId && p.Id == partnerProductId)
            ?? throw new InvalidOperationException("Partner product link not found.");

        var hasTickets = await _db.Tickets.AnyAsync(t => t.PartnerProductId == partnerProductId);
        if (hasTickets)
            throw new InvalidOperationException("Cannot remove: has existing tickets");

        _db.PartnerProducts.Remove(pp);
        await _db.SaveChangesAsync();
    }
}
