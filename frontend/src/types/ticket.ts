import type { ProductCode, TaskType, TicketStatus, SlaStatus, LifecycleState } from './enums'

export interface StatEntry {
  label: string
  value: number | string
  icon: string
  iconBg: string
  iconColor: string
  badge?: string
  badgeStyle?: string
  valueColor?: string
}

export interface DashboardStats {
  stat1: StatEntry
  stat2: StatEntry
  stat3: StatEntry
  stat4: StatEntry
}

export interface TicketSummary {
  id: string
  ticketId: string
  productCode: ProductCode
  taskType: TaskType
  partnerName: string
  requesterName: string
  status: TicketStatus
  currentStage: string
  slaStatus: SlaStatus
  slaHoursRemaining: number
  createdAt: string
  updatedAt: string
}

export interface ActivityEntry {
  id: string
  title: string
  description: string
  timestamp: string
  icon: string
  iconBg: string
  iconColor: string
}

// --- Ticket Detail types ---

export interface WorkflowStage {
  name: string
  icon: string
  status: 'completed' | 'current' | 'future'
  assignedTo?: string
  completedAt?: string
}

export interface TicketComment {
  id: string
  author: string
  role: string
  body: string
  attachment?: { name: string; size: string }
  createdAt: string
}

export interface AuditEntry {
  id: string
  type: 'stage_transition' | 'approval' | 'rejection' | 'return' | 'document' | 'comment' | 'notification' | 'sla'
  description: string
  timestamp: string
}

export interface TicketDocument {
  id: string
  name: string
  size: string
  uploadedBy: string
  uploadedAt: string
}

export interface ClarificationExchange {
  requestedBy: string
  requestedAt: string
  note: string
  response?: string
  respondedAt?: string
}

export interface TicketDetail extends TicketSummary {
  companyCode: string
  formData: Record<string, unknown>
  documents: TicketDocument[]
  workflowStages: WorkflowStage[]
  comments: TicketComment[]
  auditTrail: AuditEntry[]
  fulfilmentRecord?: Record<string, string>
  clarification?: ClarificationExchange
  assignedTo?: string
  createdBy: string
  accessPath?: 'portal' | 'api' | 'both'
  lifecycleState: LifecycleState
}
