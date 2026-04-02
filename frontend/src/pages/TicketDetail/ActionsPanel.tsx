import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { Modal } from '@/components/ui/Modal'
import type { TicketDetail, TicketAction } from '@/types/ticket'

interface ActionsPanelProps {
  ticket: TicketDetail
}

const actionConfig: Record<string, { title: string; icon: string; placeholder: string; style: string }> = {
  approve: {
    title: 'Approve & Advance',
    icon: 'verified',
    placeholder: 'Add approval notes...',
    style: 'w-full primary-gradient text-on-primary py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow',
  },
  return: {
    title: 'Return for Clarification',
    icon: 'chat_bubble',
    placeholder: 'What information is needed...',
    style: 'w-full bg-surface-container-high text-on-surface py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors',
  },
  reject: {
    title: 'Reject Ticket',
    icon: 'block',
    placeholder: 'Provide rejection reason...',
    style: 'w-full bg-error-container/20 text-error py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-error-container/40 transition-colors',
  },
  cancel: {
    title: 'Cancel Ticket',
    icon: 'cancel',
    placeholder: 'Provide cancellation reason...',
    style: 'w-full bg-error-container/20 text-error py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-error-container/40 transition-colors',
  },
  respond: {
    title: 'Respond to Clarification',
    icon: 'reply',
    placeholder: 'Provide the requested information...',
    style: 'w-full primary-gradient text-on-primary py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow',
  },
}

// Button display order
const ACTION_ORDER: TicketAction[] = ['approve', 'respond', 'return', 'reject', 'cancel']

// Button labels (different from modal titles)
const actionLabel: Record<string, string> = {
  approve: 'Approve & Advance',
  return: 'Return for Clarification',
  reject: 'Reject',
  cancel: 'Cancel Ticket',
  respond: 'Respond to Clarification',
}

// API endpoint per action
const actionEndpoint: Record<string, string> = {
  approve: 'approve',
  reject: 'reject',
  return: 'return',
  cancel: 'cancel',
  respond: 'respond',
}

export function ActionsPanel({ ticket }: ActionsPanelProps) {
  const queryClient = useQueryClient()
  const [activeAction, setActiveAction] = useState<TicketAction | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visibleActions = ACTION_ORDER.filter((a) => ticket.allowedActions.includes(a))

  if (visibleActions.length === 0) return null

  const handleConfirm = async () => {
    if (!activeAction || !comment.trim()) return
    setIsSubmitting(true)
    setError(null)

    try {
      const endpoint = actionEndpoint[activeAction]
      const body = activeAction === 'cancel'
        ? { reason: comment }
        : { comments: comment }

      await apiClient.post(`/tickets/${ticket.id}/${endpoint}`, body)

      // Invalidate ticket detail + lists
      await queryClient.invalidateQueries({ queryKey: ['ticket-detail'] })
      await queryClient.invalidateQueries({ queryKey: ['my-tickets'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['team-queue'] })

      setActiveAction(null)
      setComment('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Action failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setActiveAction(null)
    setComment('')
    setError(null)
  }

  return (
    <>
      <div className="bg-surface-container-lowest p-6 rounded-xl custom-shadow space-y-4">
        <h4 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">Actions</h4>
        {visibleActions.map((action) => {
          const config = actionConfig[action]
          return (
            <button
              key={action}
              onClick={() => setActiveAction(action)}
              className={config.style}
            >
              <span className="material-symbols-outlined">{config.icon}</span>
              {actionLabel[action]}
            </button>
          )
        })}
      </div>

      {/* Action Modal */}
      {activeAction && actionConfig[activeAction] && (
        <Modal open={!!activeAction} onOpenChange={handleClose} title={actionConfig[activeAction].title}>
          <div className="space-y-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={actionConfig[activeAction].placeholder}
              className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 min-h-[120px]"
            />
            {error && (
              <p className="text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!comment.trim() || isSubmitting}
                className="primary-gradient text-on-primary px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
