import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'

interface ConfirmationStepProps {
  id: string
  ticketId: string
  routedTo: string
  assignedTo?: string | null
}

export function ConfirmationStep({ id, ticketId, routedTo, assignedTo }: ConfirmationStepProps) {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="bg-surface-container-lowest rounded-3xl p-12 shadow-xl shadow-teal-900/5">
        {/* Checkmark */}
        <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mx-auto mb-6">
          <span
            className="material-symbols-outlined text-4xl text-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-on-surface mb-2">Request Submitted</h1>

        <p className="text-3xl font-extrabold text-primary tracking-tight mb-4">{ticketId}</p>

        {/* What Happens Next */}
        <div className="bg-surface-container-low rounded-xl p-6 mb-8 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-lg">route</span>
            </div>
            <h2 className="text-sm font-bold text-on-surface">What Happens Next</h2>
          </div>

          <div className="flex items-start gap-3 mb-3">
            <div className="flex flex-col items-center mt-0.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00696a] to-[#23a2a3] flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
              <div className="w-0.5 h-6 bg-primary/20 mt-1" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Submitted</p>
              <p className="text-xs text-on-surface-variant">Your request has been created</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center mt-0.5">
              <div className="w-6 h-6 rounded-full bg-primary-container/20 border-2 border-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xs">more_horiz</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">{routedTo}</p>
              {assignedTo && (
                <p className="text-xs text-primary font-medium">Assigned to {assignedTo}</p>
              )}
              <p className="text-xs text-on-surface-variant">You'll receive a notification when it advances</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to={`/tickets/${id}`}>
            <Button className="w-full shadow-lg shadow-primary/20 rounded-xl text-base py-3 font-extrabold">
              <span className="material-symbols-outlined text-lg mr-2">visibility</span>
              View Ticket Details
            </Button>
          </Link>
          <Link to="/new-request">
            <Button variant="secondary" className="w-full rounded-xl">Create Another</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
