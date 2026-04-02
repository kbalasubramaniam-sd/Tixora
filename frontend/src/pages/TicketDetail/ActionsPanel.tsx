import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { TicketDetail } from '@/types/ticket'

interface ActionsPanelProps {
  ticket: TicketDetail
}

type ActionType = 'approve' | 'reject' | 'return' | null

const actionConfig = {
  approve: { title: 'Approve & Advance', icon: 'verified', placeholder: 'Add approval notes...' },
  reject: { title: 'Reject Ticket', icon: 'block', placeholder: 'Provide rejection reason...' },
  return: { title: 'Return for Clarification', icon: 'chat_bubble', placeholder: 'What information is needed...' },
}

export function ActionsPanel(_props: ActionsPanelProps) {
  const [activeAction, setActiveAction] = useState<ActionType>(null)
  const [comment, setComment] = useState('')

  const handleConfirm = () => {
    // Mock: just close the modal
    setActiveAction(null)
    setComment('')
  }

  const handleClose = () => {
    setActiveAction(null)
    setComment('')
  }

  return (
    <>
      <div className="bg-surface-container-lowest p-6 rounded-xl custom-shadow space-y-4">
        <h4 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">Review Actions</h4>
        <button
          onClick={() => setActiveAction('approve')}
          className="w-full primary-gradient text-on-primary py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="material-symbols-outlined">verified</span>
          Approve & Advance
        </button>
        <button
          onClick={() => setActiveAction('return')}
          className="w-full bg-surface-container-high text-on-surface py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors"
        >
          <span className="material-symbols-outlined">chat_bubble</span>
          Return for Clarification
        </button>
        <button
          onClick={() => setActiveAction('reject')}
          className="w-full bg-error-container/20 text-error py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-error-container/40 transition-colors"
        >
          <span className="material-symbols-outlined">block</span>
          Reject
        </button>
      </div>

      {/* Action Modal */}
      {activeAction && (
        <Modal open={!!activeAction} onOpenChange={handleClose} title={actionConfig[activeAction].title}>
          <div className="space-y-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={actionConfig[activeAction].placeholder}
              className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 min-h-[120px]"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!comment.trim()}
                className="primary-gradient text-on-primary px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
