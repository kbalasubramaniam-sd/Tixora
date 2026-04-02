import { apiClient } from '@/api/client'
import { NotificationType } from '@/types/enums'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  description: string
  ticketId?: string
  ticketRef?: string
  timestamp: string
  read: boolean
}

const mockNotifications: NotificationItem[] = [
  // --- Today ---
  {
    id: 'n-1',
    type: NotificationType.SlaBreach,
    title: 'Gulf Trading LLC — SLA breached',
    description: 'Legal Review has exceeded the 8-hour SLA by 4 hours. Fatima Al-Rashid is waiting for escalation. Reassign or escalate to unblock.',
    ticketId: 'tq-1',
    ticketRef: 'SPM-RBT-T01-20260328-0012',
    timestamp: '2 mins ago',
    read: false,
  },
  {
    id: 'n-2',
    type: NotificationType.StageAdvanced,
    title: 'Al Masah Capital — moved to Access Provisioning',
    description: 'Sarah Chen completed Integration Review and advanced the ticket. Access Provisioning is now pending your action.',
    ticketId: 'tq-6',
    ticketRef: 'SPM-RHN-T02-20260401-0037',
    timestamp: '15 mins ago',
    read: false,
  },
  {
    id: 'n-3',
    type: NotificationType.SlaWarning75,
    title: 'Digital Solutions FZE — 2 hours until SLA breach',
    description: 'Support Triage for this access support request is at 75% SLA. Admin Ops needs to resolve or reassign before 2:00 PM GST.',
    ticketId: 'tq-3',
    ticketRef: 'SPM-WTQ-T04-20260331-0024',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: 'n-4',
    type: NotificationType.ClarificationRequested,
    title: 'National Bank of Fujairah — trade license needed',
    description: 'Layla Nasser from Legal Team needs the updated trade license (2026) before agreement review can proceed.',
    ticketId: 'tq-5',
    ticketRef: 'SPM-MLM-T01-20260401-0035',
    timestamp: '3 hours ago',
    read: false,
  },
  {
    id: 'n-5',
    type: NotificationType.TicketReassigned,
    title: 'Mashreq Global — reassigned to Omar Khalid',
    description: 'Sara Raeed reassigned the production account setup to Omar Khalid (Partner Ops) for Account Provisioning.',
    ticketId: 'tq-8',
    ticketRef: 'SPM-RBT-T03-20260401-0041',
    timestamp: '5 hours ago',
    read: false,
  },
  // --- Yesterday ---
  {
    id: 'n-6',
    type: NotificationType.RequestCompleted,
    title: 'Gulf Trading LLC — agreement signed off',
    description: 'Fatima Al-Rashid completed T-01 agreement validation for Rabet. Partner is now Onboarded and ready for UAT access (T-02).',
    ticketId: 'mt-1',
    ticketRef: 'SPM-RBT-T01-20260325-0008',
    timestamp: 'Yesterday',
    read: true,
  },
  {
    id: 'n-7',
    type: NotificationType.RequestSubmitted,
    title: 'Dubai Holdings — new agreement request',
    description: 'Sarah Chen submitted a T-01 agreement validation for Dubai Holdings on Rhoon. Assigned to Legal Team for review.',
    ticketId: 'tq-10',
    ticketRef: 'SPM-RHN-T01-20260401-0045',
    timestamp: 'Yesterday',
    read: true,
  },
  {
    id: 'n-8',
    type: NotificationType.UatPhase1Complete,
    title: 'Gulf Trading LLC — UAT environment ready',
    description: 'Integration Team provisioned UAT access for Rabet. Partner can begin testing. Waiting for UAT completion signal.',
    ticketId: 'mt-2',
    ticketRef: 'SPM-RBT-T02-20260328-0014',
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
