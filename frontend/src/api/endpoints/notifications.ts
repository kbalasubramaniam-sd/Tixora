import { apiClient } from '@/api/client'
import { NotificationType } from '@/types/enums'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  description: string
  ticketId?: string
  timestamp: string
  read: boolean
}

const mockNotifications: NotificationItem[] = [
  {
    id: 'n-1',
    type: NotificationType.SlaBreach,
    title: 'SLA Breach: Ticket SPM-RBT-T01-20260328-0012',
    description: 'Priority response time has exceeded the SLA window. Immediate escalation required for partner Gulf Trading LLC.',
    ticketId: 'tq-1',
    timestamp: '2 mins ago',
    read: false,
  },
  {
    id: 'n-2',
    type: NotificationType.StageAdvanced,
    title: 'Stage Advanced: SPM-RHN-T02-20260401-0037',
    description: 'Ticket moved from Integration Review to Access Provisioning by Sarah Chen.',
    ticketId: 'tq-6',
    timestamp: '15 mins ago',
    read: false,
  },
  {
    id: 'n-3',
    type: NotificationType.RequestCompleted,
    title: 'Request Completed: SPM-RBT-T01-20260325-0008',
    description: 'Agreement validation for Gulf Trading LLC has been completed and verified.',
    ticketId: 'mt-1',
    timestamp: '2 hours ago',
    read: true,
  },
  {
    id: 'n-4',
    type: NotificationType.SlaWarning75,
    title: 'SLA Warning: 2h Remaining',
    description: 'Ticket SPM-WTQ-T04-20260331-0024 is approaching its resolution deadline. Requires action before SLA breach.',
    ticketId: 'tq-3',
    timestamp: '4 hours ago',
    read: false,
  },
  {
    id: 'n-5',
    type: NotificationType.ClarificationRequested,
    title: 'Clarification Needed: SPM-MLM-T01-20260401-0035',
    description: 'Legal Team requires additional documentation for National Bank of Fujairah agreement review.',
    ticketId: 'tq-5',
    timestamp: '5 hours ago',
    read: false,
  },
  {
    id: 'n-6',
    type: NotificationType.TicketReassigned,
    title: 'Ticket Reassigned: SPM-RBT-T03-20260401-0041',
    description: 'Mashreq Global production account ticket reassigned to Omar Khalid for Account Provisioning.',
    ticketId: 'tq-8',
    timestamp: '6 hours ago',
    read: false,
  },
  {
    id: 'n-7',
    type: NotificationType.RequestSubmitted,
    title: 'New Request: SPM-RHN-T01-20260401-0045',
    description: 'Sarah Chen submitted a new agreement validation request for Dubai Holdings.',
    ticketId: 'tq-10',
    timestamp: 'Yesterday',
    read: true,
  },
  {
    id: 'n-8',
    type: NotificationType.UatPhase1Complete,
    title: 'UAT Access Ready: SPM-RBT-T02-20260328-0014',
    description: 'UAT environment has been provisioned for Gulf Trading LLC. Partner can begin testing.',
    ticketId: 'mt-2',
    timestamp: 'Yesterday',
    read: true,
  },
]

export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await apiClient.get<NotificationItem[]>('/notifications')
    return res.data
  } catch {
    return [...mockNotifications]
  }
}
