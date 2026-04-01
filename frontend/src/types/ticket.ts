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

export interface DashboardStats {
  stat1: { label: string; value: number | string }
  stat2: { label: string; value: number | string; highlight?: 'amber' | 'red' }
  stat3: { label: string; value: number | string }
  stat4: { label: string; value: number | string }
}

export interface ActivityEntry {
  id: string
  description: string
  timestamp: string
}
