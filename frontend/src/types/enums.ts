export enum ProductCode {
  RBT = 'RBT',
  RHN = 'RHN',
  WTQ = 'WTQ',
  MLM = 'MLM',
}

export enum TaskType {
  T01 = 'T01',
  T02 = 'T02',
  T03 = 'T03',
  T04 = 'T04',
  T05 = 'T05',
}

export enum TicketStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  InReview = 'InReview',
  PendingRequesterAction = 'PendingRequesterAction',
  Approved = 'Approved',
  InProvisioning = 'InProvisioning',
  Completed = 'Completed',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  SlaBreached = 'SlaBreached',
}

export enum LifecycleState {
  None = 'None',
  Agreed = 'Agreed',
  UatActive = 'UatActive',
  Onboarded = 'Onboarded',
  Live = 'Live',
}

export enum SlaStatus {
  OnTrack = 'OnTrack',
  AtRisk = 'AtRisk',
  Critical = 'Critical',
  Breached = 'Breached',
}

export enum UserRole {
  Requester = 'Requester',
  Reviewer = 'Reviewer',
  Approver = 'Approver',
  IntegrationTeam = 'IntegrationTeam',
  ProvisioningAgent = 'ProvisioningAgent',
  SystemAdministrator = 'SystemAdministrator',
}
