import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTeamQueue } from '@/api/hooks/useTeamQueue'
import { FilterBar } from './FilterBar'
import { UrgencySection } from './UrgencySection'
import { QueueTable } from './QueueTable'

export default function TeamQueue() {
  const navigate = useNavigate()
  const [product, setProduct] = useState('All')
  const [task, setTask] = useState('All')
  const [slaStatus, setSlaStatus] = useState('All')

  const filters = {
    product: product !== 'All' ? product : undefined,
    task: task !== 'All' ? task : undefined,
    slaStatus: slaStatus !== 'All' ? slaStatus : undefined,
  }

  const { data: tickets = [], isLoading } = useTeamQueue(
    Object.values(filters).some(Boolean) ? filters : undefined,
  )

  const clearFilters = () => {
    setProduct('All')
    setTask('All')
    setSlaStatus('All')
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
        <button
          onClick={() => navigate('/new-request')}
          className="primary-gradient text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>Create Ticket</span>
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        product={product}
        task={task}
        slaStatus={slaStatus}
        onProductChange={setProduct}
        onTaskChange={setTask}
        onSlaChange={setSlaStatus}
        onClear={clearFilters}
      />

      {/* Pinned Urgency Sections (bento grid) */}
      <UrgencySection tickets={tickets} />

      {/* Queue Table (all tickets) */}
      <QueueTable tickets={tickets} />
    </div>
  )
}
