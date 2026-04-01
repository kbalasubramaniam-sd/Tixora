import type { ProductCode, TaskType, TicketStatus, SlaStatus } from './enums'

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

export interface StatEntry {
  label: string
  value: number | string
  highlight?: 'amber' | 'red'
}

export interface DashboardStats {
  stat1: StatEntry
  stat2: StatEntry
  stat3: StatEntry
  stat4: StatEntry
}

export interface ActivityEntry {
  id: string
  description: string
  timestamp: string
}
