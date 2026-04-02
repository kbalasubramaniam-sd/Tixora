export const ProductCode = {
  RBT: 'RBT',
  RHN: 'RHN',
  WTQ: 'WTQ',
  MLM: 'MLM',
} as const
export type ProductCode = (typeof ProductCode)[keyof typeof ProductCode]

export const TaskType = {
  T01: 'T01',
  T02: 'T02',
  T03: 'T03',
  T04: 'T04',
} as const
export type TaskType = (typeof TaskType)[keyof typeof TaskType]

export const TicketStatus = {
  Draft: 'Draft',
  Submitted: 'Submitted',
  InReview: 'InReview',
  PendingRequesterAction: 'PendingRequesterAction',
  Approved: 'Approved',
  InProvisioning: 'InProvisioning',
  Completed: 'Completed',
  Rejected: 'Rejected',
  Cancelled: 'Cancelled',
  SlaBreached: 'SlaBreached',
} as const
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus]

export const LifecycleState = {
  None: 'None',
  Onboarded: 'Onboarded',
  UatActive: 'UatActive',
  UatCompleted: 'UatCompleted',
  Live: 'Live',
} as const
export type LifecycleState = (typeof LifecycleState)[keyof typeof LifecycleState]

export const SlaStatus = {
  OnTrack: 'OnTrack',
  AtRisk: 'AtRisk',
  Critical: 'Critical',
  Breached: 'Breached',
} as const
export type SlaStatus = (typeof SlaStatus)[keyof typeof SlaStatus]

export const UserRole = {
  Requester: 'Requester',
  Reviewer: 'Reviewer',
  Approver: 'Approver',
  IntegrationTeam: 'IntegrationTeam',
  ProvisioningAgent: 'ProvisioningAgent',
  SystemAdministrator: 'SystemAdministrator',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]
