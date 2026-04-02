import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'

interface ConfirmationStepProps {
  ticketId: string
  routedTo: string
}

export function ConfirmationStep({ ticketId, routedTo }: ConfirmationStepProps) {
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

        <p className="text-on-surface-variant text-sm mb-8">
          Routed to: <span className="font-bold text-on-surface">{routedTo}</span>
        </p>

        <div className="flex flex-col gap-3">
          <Link to={`/tickets/${ticketId}`}>
            <Button className="w-full shadow-lg shadow-primary/20 rounded-xl">View Ticket</Button>
          </Link>
          <Link to="/new-request">
            <Button variant="secondary" className="w-full rounded-xl">Create Another</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
