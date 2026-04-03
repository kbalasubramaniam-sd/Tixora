import { useState } from 'react'
import { useParams } from 'react-router'
import { cn } from '@/utils/cn'
import { useTicketDetail } from '@/api/hooks/useTickets'
import { ApiError } from '@/components/ui/ApiError'
import { TicketHeader } from './TicketHeader'
import { WorkflowStepper } from './WorkflowStepper'
import { TicketDetailsCard } from './TicketDetailsCard'
import { ActionsPanel } from './ActionsPanel'
import { SlaPanel } from './SlaPanel'
import { PartnerPanel } from './PartnerPanel'
import { ShipmentPanel } from './ShipmentPanel'
import { CommentsTab } from './CommentsTab'
import { DocumentsTab } from './DocumentsTab'
import { AuditTrailTab } from './AuditTrailTab'

type TabId = 'comments' | 'documents' | 'audit'

const tabs: { id: TabId; label: string }[] = [
  { id: 'comments', label: 'Comments' },
  { id: 'documents', label: 'Documents' },
  { id: 'audit', label: 'Audit Trail' },
]

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: ticket, isLoading, isError, refetch } = useTicketDetail(id ?? '')
  const [activeTab, setActiveTab] = useState<TabId>('comments')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    )
  }

  if (isError || !ticket) {
    return <ApiError title="Failed to load ticket" message={`Could not fetch ticket ${id}.`} onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-8">
      {/* Header + Workflow Stepper */}
      <section className="space-y-4">
        <TicketHeader ticket={ticket} />
        <WorkflowStepper stages={ticket.workflowStages} />
      </section>

      {/* Two-column layout: main (65%) + sidebar (35%) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Content */}
        <div className="w-full lg:w-[65%] space-y-8">
          <TicketDetailsCard ticket={ticket} />

          {/* Clarification Card (if present) */}
          {ticket.clarification && (
            <div className="bg-warning-surface p-6 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-warning">warning</span>
                <h4 className="text-sm font-extrabold text-warning">Clarification Requested</h4>
              </div>
              <p className="text-sm text-on-surface">
                <span className="font-bold">{ticket.clarification.requestedBy}</span> on{' '}
                {new Date(ticket.clarification.requestedAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
                :
              </p>
              <p className="text-sm text-on-surface bg-white/60 p-3 rounded-lg">{ticket.clarification.note}</p>
              {ticket.clarification.response ? (
                <div className="border-t border-warning/20 pt-3">
                  <p className="text-xs font-bold text-on-surface-variant mb-1">Response:</p>
                  <p className="text-sm text-on-surface">{ticket.clarification.response}</p>
                </div>
              ) : (
                <div className="border-t border-warning/20 pt-3">
                  <textarea
                    className="w-full bg-white border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-warning/20 min-h-[80px]"
                    placeholder="Type your response..."
                  />
                  <button className="mt-2 bg-warning text-white px-4 py-2 rounded-lg text-xs font-bold">
                    Submit Response
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bottom Tabs */}
          <div className="space-y-4">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-2 py-3 text-sm font-bold transition-colors',
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'comments' && <CommentsTab ticketId={ticket.id} />}
            {activeTab === 'documents' && <DocumentsTab ticketId={ticket.id} />}
            {activeTab === 'audit' && <AuditTrailTab entries={ticket.auditTrail} />}
          </div>
        </div>

        {/* Right Panel (sticky) */}
        <aside className="w-full lg:w-[35%] lg:sticky lg:top-6 space-y-6">
          <ActionsPanel ticket={ticket} onActionComplete={() => refetch()} />
          <SlaPanel ticket={ticket} />
          <PartnerPanel ticket={ticket} />
          <ShipmentPanel ticket={ticket} />
        </aside>
      </div>
    </div>
  )
}
