using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Admin;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;

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
                config.StartTime = TimeOnly.Parse(update.StartTime);
                config.EndTime = TimeOnly.Parse(update.EndTime);
            }
        }

        await _db.SaveChangesAsync();
    }

    // --- Holidays ---

    public async Task<List<HolidayResponse>> GetHolidaysAsync()
    {
        var holidays = await _db.Holidays
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
}
