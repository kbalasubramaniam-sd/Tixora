using Tixora.Application.DTOs.Admin;

namespace Tixora.Application.Interfaces;

public interface IAdminService
{
    Task<SlaConfigResponse> GetSlaConfigAsync();
    Task UpdateSlaConfigAsync(UpdateSlaConfigRequest request);

    Task<BusinessHoursResponse> GetBusinessHoursAsync();
    Task UpdateBusinessHoursAsync(UpdateBusinessHoursRequest request);

    Task<List<HolidayResponse>> GetHolidaysAsync();
    Task<HolidayResponse> CreateHolidayAsync(CreateHolidayRequest request);
    Task DeleteHolidayAsync(Guid id);

    Task<List<DelegateResponse>> GetDelegatesAsync();
    Task<DelegateResponse> CreateDelegateAsync(CreateDelegateRequest request);
    Task DeleteDelegateAsync(Guid id);

    Task<WorkflowConfigResponse> GetWorkflowConfigAsync();

    Task<List<PartnerAdminResponse>> GetPartnersAsync();
    Task<PartnerAdminResponse?> GetPartnerAsync(Guid id);
    Task<PartnerAdminResponse> CreatePartnerAsync(CreatePartnerRequest request);
    Task UpdatePartnerAsync(Guid id, UpdatePartnerRequest request);
    Task DeletePartnerAsync(Guid id);
    Task<PartnerProductAdminResponse> LinkProductAsync(Guid partnerId, LinkProductRequest request);
    Task UnlinkProductAsync(Guid partnerId, Guid partnerProductId);
}
