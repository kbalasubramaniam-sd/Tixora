import { TicketStatus, SlaStatus, LifecycleState, UserRole } from '@/types/enums'

// Mock label maps — single source of truth for frontend until backend APIs are live.
// PRODUCT_LABELS and TASK_LABELS will be replaced by API-driven lookups (from products table).
// STATUS_LABELS and SLA_LABELS are enum display names and will stay here.

export const PRODUCT_LABELS: Record<string, string> = {
  RBT: 'Rabet',
  RHN: 'Rhoon',
  WTQ: 'Wtheeq',
  MLM: 'Mulem',
}

export const TASK_LABELS: Record<string, string> = {
  T01: 'T-01 Agreement',
  T02: 'T-02 UAT Access',
  T03: 'T-03 Partner Account',
  T04: 'T-04 Access Support',
}

/** Short task labels for compact displays (table cells, chips) */
export const TASK_LABELS_SHORT: Record<string, string> = {
  T01: 'Agreement',
  T02: 'UAT Access',
  T03: 'Partner Account',
  T04: 'Access Support',
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.Submitted]: 'Submitted',
  [TicketStatus.InReview]: 'In Review',
  [TicketStatus.PendingRequesterAction]: 'Pending Action',
  [TicketStatus.InProvisioning]: 'In Provisioning',
  [TicketStatus.Phase1Complete]: 'Phase 1 Complete',
  [TicketStatus.AwaitingUatSignal]: 'Awaiting UAT Signal',
  [TicketStatus.Phase2InReview]: 'Phase 2 Review',
  [TicketStatus.Completed]: 'Completed',
  [TicketStatus.Rejected]: 'Rejected',
  [TicketStatus.Cancelled]: 'Cancelled',
}

export const SLA_LABELS: Record<SlaStatus, string> = {
  [SlaStatus.OnTrack]: 'On Track',
  [SlaStatus.AtRisk]: 'At Risk',
  [SlaStatus.Critical]: 'Critical',
  [SlaStatus.Breached]: 'Breached',
}

export const LIFECYCLE_LABELS: Record<LifecycleState, string> = {
  [LifecycleState.None]: 'None',
  [LifecycleState.Onboarded]: 'Onboarded',
  [LifecycleState.UatActive]: 'UAT Active',
  [LifecycleState.UatCompleted]: 'UAT Complete',
  [LifecycleState.Live]: 'Live',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.PartnershipTeam]: 'Partnership Team',
  [UserRole.LegalTeam]: 'Legal Team',
  [UserRole.ProductTeam]: 'Product Team',
  [UserRole.ExecutiveAuthority]: 'Executive Authority',
  [UserRole.IntegrationTeam]: 'Integration Team',
  [UserRole.DevTeam]: 'Dev Team',
  [UserRole.BusinessTeam]: 'Business Team',
  [UserRole.PartnerOps]: 'Partner Ops',
  [UserRole.SystemAdministrator]: 'System Administrator',
}
