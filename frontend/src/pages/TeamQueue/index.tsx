import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTeamQueue } from '@/api/hooks/useTeamQueue'
import { ApiError } from '@/components/ui/ApiError'
import { FilterBar } from './FilterBar'
import { UrgencySection } from './UrgencySection'
import { QueueTable } from './QueueTable'

export default function TeamQueue() {
  const navigate = useNavigate()
  const [product, setProduct] = useState('All')
  const [task, setTask] = useState('All')
  const [slaStatus, setSlaStatus] = useState('All')
  const [partner, setPartner] = useState('All')
  const [requester, setRequester] = useState('All')

  const filters = {
    product: product !== 'All' ? product : undefined,
    task: task !== 'All' ? task : undefined,
    slaStatus: slaStatus !== 'All' ? slaStatus : undefined,
    partner: partner !== 'All' ? partner : undefined,
    requester: requester !== 'All' ? requester : undefined,
  }

  const { data: tickets = [], isLoading, isError, refetch } = useTeamQueue(
    Object.values(filters).some(Boolean) ? filters : undefined,
  )

  // Build partner/requester options from all tickets (unfiltered)
  const { data: allTickets = [] } = useTeamQueue()

  const partnerOptions = useMemo(() => {
    const names = [...new Set(allTickets.map((t) => t.partnerName))].sort()
    return [{ label: 'All', value: 'All' }, ...names.map((n) => ({ label: n, value: n }))]
  }, [allTickets])

  const requesterOptions = useMemo(() => {
    const names = [...new Set(allTickets.map((t) => t.requesterName))].sort()
    return [{ label: 'All', value: 'All' }, ...names.map((n) => ({ label: n, value: n }))]
  }, [allTickets])

  const clearFilters = () => {
    setProduct('All')
    setTask('All')
    setSlaStatus('All')
    setPartner('All')
    setRequester('All')
  }

  if (isError) {
    return <ApiError title="Failed to load team queue" onRetry={() => refetch()} />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-[2rem] font-bold text-on-surface leading-tight tracking-tight mb-2">Team Queue</h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            Manage collaborative operational tasks and maintain service level agreements across the global product ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {/* TODO: export CSV */}}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold text-sm hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <button
            onClick={() => navigate('/new-request')}
            className="primary-gradient text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Filter Bar with partner/requester search */}
      <FilterBar
        product={product}
        task={task}
        slaStatus={slaStatus}
        onProductChange={setProduct}
        onTaskChange={setTask}
        onSlaChange={setSlaStatus}
        onClear={clearFilters}
        partner={partner}
        onPartnerChange={setPartner}
        partnerOptions={partnerOptions}
        requester={requester}
        onRequesterChange={setRequester}
        requesterOptions={requesterOptions}
      />

      {/* Pinned Urgency Sections (bento grid) */}
      <UrgencySection tickets={tickets} />

      {/* Queue Table (all tickets) */}
      <QueueTable tickets={tickets} />
    </div>
  )
}
