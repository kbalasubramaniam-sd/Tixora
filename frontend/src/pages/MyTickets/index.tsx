import { useState, useMemo } from 'react'
import { useMyTickets } from '@/api/hooks/useMyTickets'
import { ApiError } from '@/components/ui/ApiError'
import { FilterBar } from '@/pages/TeamQueue/FilterBar'
import { QueueTable } from '@/pages/TeamQueue/QueueTable'
import { TicketStatus } from '@/types/enums'

export default function MyTickets() {
  const [product, setProduct] = useState('All')
  const [task, setTask] = useState('All')
  const [slaStatus, setSlaStatus] = useState('All')
  const [status, setStatus] = useState('All')

  const { data: result, isLoading, isError, refetch } = useMyTickets()
  const allTickets = result?.items ?? []

  // Client-side filtering (backend GetMyTickets does not support filter params)
  const tickets = useMemo(() => {
    let filtered = allTickets
    if (product !== 'All') {
      filtered = filtered.filter((t) => t.productCode === product)
    }
    if (task !== 'All') {
      filtered = filtered.filter((t) => t.taskType === task)
    }
    if (slaStatus !== 'All') {
      filtered = filtered.filter((t) => t.slaStatus === slaStatus)
    }
    if (status !== 'All') {
      // Map friendly filter values to actual TicketStatus values
      const statusMap: Record<string, string[]> = {
        Open: [TicketStatus.Submitted],
        InProgress: [TicketStatus.InReview, TicketStatus.PendingRequesterAction, TicketStatus.InProvisioning, TicketStatus.Phase1Complete, TicketStatus.AwaitingUatSignal, TicketStatus.Phase2InReview],
        Completed: [TicketStatus.Completed],
        Cancelled: [TicketStatus.Cancelled, TicketStatus.Rejected],
      }
      const matchStatuses = statusMap[status] ?? [status]
      filtered = filtered.filter((t) => matchStatuses.includes(t.status))
    }
    return filtered
  }, [allTickets, product, task, slaStatus, status])

  const clearFilters = () => {
    setProduct('All')
    setTask('All')
    setSlaStatus('All')
    setStatus('All')
  }

  if (isError) {
    return <ApiError title="Failed to load your tickets" onRetry={() => refetch()} />
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
      <div className="mb-12">
        <h1 className="text-[2rem] font-bold text-on-surface leading-tight tracking-tight mb-2">My Tickets</h1>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">
          Track your submitted requests and monitor their progress across all products.
        </p>
      </div>

      {/* Filter Bar (with status filter) */}
      <FilterBar
        product={product}
        task={task}
        slaStatus={slaStatus}
        onProductChange={setProduct}
        onTaskChange={setTask}
        onSlaChange={setSlaStatus}
        onClear={clearFilters}
        status={status}
        onStatusChange={setStatus}
      />

      {/* Ticket Table */}
      <QueueTable
        tickets={tickets}
        emptyIcon="confirmation_number"
        emptyTitle="No tickets found"
        emptyMessage="You haven't submitted any requests yet, or no tickets match your filters."
      />
    </div>
  )
}
