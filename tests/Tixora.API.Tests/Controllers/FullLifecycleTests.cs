// File: tests/Tixora.API.Tests/Controllers/FullLifecycleTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class FullLifecycleTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public FullLifecycleTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task LoginAs(string email)
    {
        var token = await TestHelpers.GetAuthTokenAsync(_client, email, "Password1!");
        TestHelpers.SetAuthToken(_client, token);
    }

    private async Task<TicketResponse> CreateTicket(string productCode, string taskType, string? provisioningPath = null, string? issueType = null, Guid? rejectedTicketRef = null)
    {
        await LoginAs("sarah.ahmad@tixora.ae");

        var request = new CreateTicketRequest(
            ProductCode: productCode,
            TaskType: taskType,
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: provisioningPath,
            IssueType: issueType,
            FormData: "{}",
            RejectedTicketRef: rejectedTicketRef
        );

        var response = await _client.PostAsJsonAsync("/api/tickets", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<TicketResponse>())!;
    }

    private async Task<TicketResponse> ApproveAs(string email, Guid ticketId, string? comments = null)
    {
        await LoginAs(email);
        var response = await _client.PostAsJsonAsync(
            $"/api/tickets/{ticketId}/approve",
            new ActionRequest(Comments: comments));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<TicketResponse>())!;
    }

    private async Task<TicketDetailResponse> GetDetail(Guid ticketId)
    {
        await LoginAs("sarah.ahmad@tixora.ae");
        var response = await _client.GetAsync($"/api/tickets/{ticketId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<TicketDetailResponse>())!;
    }

    // ─── Test 1: Full Partner Lifecycle ──────────────────

    [Fact]
    public async Task FullPartnerLifecycle_NoneToLive()
    {
        // ═══════════════════════════════════════════════════
        // T-01: Agreement Validation — None → Onboarded
        // ═══════════════════════════════════════════════════

        var t01 = await CreateTicket("RBT", "T01");
        Assert.Equal("Submitted", t01.Status);
        Assert.Equal(1, t01.CurrentStageOrder);

        var t01s1 = await ApproveAs("omar.khalid@tixora.ae", t01.Id);
        Assert.Equal(2, t01s1.CurrentStageOrder);
        Assert.Equal("InReview", t01s1.Status);

        var t01s2 = await ApproveAs("hannoun@tixora.ae", t01.Id);
        Assert.Equal(3, t01s2.CurrentStageOrder);
        Assert.Equal("InReview", t01s2.Status);

        var t01s3 = await ApproveAs("fatima.noor@tixora.ae", t01.Id);
        Assert.Equal(4, t01s3.CurrentStageOrder);
        Assert.Equal("InReview", t01s3.Status);

        var t01s4 = await ApproveAs("sarah.ahmad@tixora.ae", t01.Id);
        Assert.Equal("Completed", t01s4.Status);

        var t01Detail = await GetDetail(t01.Id);
        Assert.Equal("Onboarded", t01Detail.LifecycleState);

        // ═══════════════════════════════════════════════════
        // T-02: UAT Access — Onboarded → UatCompleted
        // ═══════════════════════════════════════════════════

        var t02 = await CreateTicket("RBT", "T02");
        Assert.Equal("Submitted", t02.Status);

        var t02s1 = await ApproveAs("hannoun@tixora.ae", t02.Id);
        Assert.Equal(2, t02s1.CurrentStageOrder);
        Assert.Equal("InProvisioning", t02s1.Status);

        // Stage 2 completion → lifecycle UatActive
        var t02s2 = await ApproveAs("khalid.rashed@tixora.ae", t02.Id);
        Assert.Equal(3, t02s2.CurrentStageOrder);
        Assert.Equal("InProvisioning", t02s2.Status);

        var t02MidDetail = await GetDetail(t02.Id);
        Assert.Equal("UatActive", t02MidDetail.LifecycleState);

        var t02s3 = await ApproveAs("ahmed.tariq@tixora.ae", t02.Id);
        Assert.Equal(4, t02s3.CurrentStageOrder);
        Assert.Equal("AwaitingUatSignal", t02s3.Status);

        // PhaseGate — PartnershipTeam signals UAT done
        var t02s4 = await ApproveAs("sarah.ahmad@tixora.ae", t02.Id);
        Assert.Equal(5, t02s4.CurrentStageOrder);
        Assert.Equal("InReview", t02s4.Status);

        var t02s5 = await ApproveAs("khalid.rashed@tixora.ae", t02.Id);
        Assert.Equal("Completed", t02s5.Status);

        var t02Detail = await GetDetail(t02.Id);
        Assert.Equal("UatCompleted", t02Detail.LifecycleState);

        // ═══════════════════════════════════════════════════
        // T-03: Production Account — UatCompleted → Live
        // ═══════════════════════════════════════════════════

        var t03 = await CreateTicket("RBT", "T03", provisioningPath: "PortalAndApi");
        Assert.Equal("Submitted", t03.Status);

        var t03s1 = await ApproveAs("vilina.sequeira@tixora.ae", t03.Id);
        Assert.Equal(2, t03s1.CurrentStageOrder);
        Assert.Equal("InReview", t03s1.Status);

        var t03s2 = await ApproveAs("hannoun@tixora.ae", t03.Id);
        Assert.Equal(3, t03s2.CurrentStageOrder);
        Assert.Equal("InProvisioning", t03s2.Status);

        var t03s3 = await ApproveAs("ahmed.tariq@tixora.ae", t03.Id);
        Assert.Equal(4, t03s3.CurrentStageOrder);
        Assert.Equal("InProvisioning", t03s3.Status);

        var t03s4 = await ApproveAs("layla.hassan@tixora.ae", t03.Id);
        Assert.Equal(5, t03s4.CurrentStageOrder);
        Assert.Equal("InProvisioning", t03s4.Status);

        var t03s5 = await ApproveAs("khalid.rashed@tixora.ae", t03.Id);
        Assert.Equal("Completed", t03s5.Status);

        var t03Detail = await GetDetail(t03.Id);
        Assert.Equal("Live", t03Detail.LifecycleState);

        // ═══════════════════════════════════════════════════
        // T-04: Support — Live → Live (no change)
        // ═══════════════════════════════════════════════════

        var t04 = await CreateTicket("RBT", "T04", issueType: "PortalLoginIssue");
        Assert.Equal("Submitted", t04.Status);

        var t04s1 = await ApproveAs("ahmed.tariq@tixora.ae", t04.Id);
        Assert.Equal("Completed", t04s1.Status);

        var t04Detail = await GetDetail(t04.Id);
        Assert.Equal("Live", t04Detail.LifecycleState);
    }

    // ─── Test 2: Reject + Re-raise ──────────────────────

    [Fact]
    public async Task RejectAndReRaise_CreatesLinkedTicket()
    {
        var original = await CreateTicket("RBT", "T01");

        await LoginAs("omar.khalid@tixora.ae");
        var rejectResponse = await _client.PostAsJsonAsync(
            $"/api/tickets/{original.Id}/reject",
            new ActionRequest(Comments: "Insufficient documentation"));
        Assert.Equal(HttpStatusCode.OK, rejectResponse.StatusCode);

        var rejected = await rejectResponse.Content.ReadFromJsonAsync<TicketResponse>();
        Assert.Equal("Rejected", rejected!.Status);

        var reRaised = await CreateTicket("RBT", "T01", rejectedTicketRef: original.Id);
        Assert.Equal("Submitted", reRaised.Status);
        Assert.NotEqual(original.Id, reRaised.Id);

        var detail = await GetDetail(reRaised.Id);
        Assert.NotNull(detail.RejectedTicketRef);
        Assert.Equal(original.TicketId, detail.RejectedTicketRef);
    }

    // ─── Test 3: Lifecycle Gate Enforcement ──────────────

    [Fact]
    public async Task LifecycleGateEnforcement_BlocksWrongOrderTickets()
    {
        await LoginAs("sarah.ahmad@tixora.ae");

        var t02Response = await _client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T02", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}"));
        Assert.Equal(HttpStatusCode.BadRequest, t02Response.StatusCode);

        var t03Response = await _client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T03", PartnerId: AlAinInsuranceId,
            ProvisioningPath: "PortalAndApi", IssueType: null, FormData: "{}"));
        Assert.Equal(HttpStatusCode.BadRequest, t03Response.StatusCode);
    }

    // ─── Test 4: Re-raise Validation ────────────────────

    [Fact]
    public async Task ReRaise_NonRejectedTicket_Returns400()
    {
        var ticket = await CreateTicket("RBT", "T01");

        await LoginAs("sarah.ahmad@tixora.ae");
        var response = await _client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T01", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}",
            RejectedTicketRef: ticket.Id));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ReRaise_NonExistentTicket_Returns400()
    {
        await LoginAs("sarah.ahmad@tixora.ae");
        var response = await _client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T01", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}",
            RejectedTicketRef: Guid.NewGuid()));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
