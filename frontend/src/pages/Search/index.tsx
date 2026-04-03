import { useState, useCallback } from 'react'
import { useAdvancedSearch } from '@/api/hooks/useSearch'
import type { AdvancedSearchFilters } from '@/api/endpoints/search'
import { ApiError } from '@/components/ui/ApiError'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar } from '@/pages/TeamQueue/FilterBar'
import { QueueTable } from '@/pages/TeamQueue/QueueTable'

export default function Search() {
  const [product, setProduct] = useState('All')
  const [task, setTask] = useState('All')
  const [status, setStatus] = useState('All')
  const [slaStatus, setSlaStatus] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const hasFilters =
    product !== 'All' ||
    task !== 'All' ||
    status !== 'All' ||
    slaStatus !== 'All' ||
    dateFrom !== '' ||
    dateTo !== ''

  const filters: AdvancedSearchFilters = {
    productCode: product !== 'All' ? product : undefined,
    taskType: task !== 'All' ? task : undefined,
    status: status !== 'All' ? status : undefined,
    slaStatus: slaStatus !== 'All' ? slaStatus : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize,
  }

  const { data, isLoading, isError, refetch } = useAdvancedSearch(filters, hasFilters)
  const tickets = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const totalCount = data?.totalCount ?? 0

  const clearFilters = useCallback(() => {
    setProduct('All')
    setTask('All')
    setStatus('All')
    setSlaStatus('All')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }, [])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  // Build page numbers for pagination
  const pageNumbers: number[] = []
  const maxVisible = 5
  let start = Math.max(1, page - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  for (let i = start; i <= end; i++) {
    pageNumbers.push(i)
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-on-surface tracking-tight mb-2 font-headline">Advanced Search</h1>
        <p className="text-on-surface-variant max-w-2xl text-lg">
          Search across all tickets using filters to find exactly what you need.
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar
        product={product}
        onProductChange={(v) => { setProduct(v); setPage(1) }}
        task={task}
        onTaskChange={(v) => { setTask(v); setPage(1) }}
        slaStatus={slaStatus}
        onSlaChange={(v) => { setSlaStatus(v); setPage(1) }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1) }}
        onClear={clearFilters}
        hasExtraFilters={dateFrom !== '' || dateTo !== ''}
      >
        {/* Date range inputs */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/60 flex-shrink-0">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="bg-surface-container-lowest border border-outline-variant rounded-full px-3 py-1.5 text-xs font-bold text-on-surface focus:ring-1 focus:ring-primary/20 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/60 flex-shrink-0">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="bg-surface-container-lowest border border-outline-variant rounded-full px-3 py-1.5 text-xs font-bold text-on-surface focus:ring-1 focus:ring-primary/20 outline-none"
          />
        </div>
      </FilterBar>

      {/* Results */}
      {!hasFilters ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3 block">manage_search</span>
          <h3 className="text-lg font-bold text-on-surface mb-1">Set filters to search</h3>
          <p className="text-sm text-on-surface-variant">
            Use the filters above to search across all tickets in the system.
          </p>
        </div>
      ) : isError ? (
        <ApiError title="Failed to search tickets" onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon="search_off"
          title="No results found"
          description="Try adjusting your filters to find what you're looking for."
        />
      ) : (
        <>
          <QueueTable
            tickets={tickets}
            emptyIcon="search_off"
            emptyTitle="No results found"
            emptyMessage="Try adjusting your filters"
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 bg-surface-container-low rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <span className="text-sm text-on-surface-variant">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} results
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-white transition-colors disabled:opacity-40"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={
                      p === page
                        ? 'w-10 h-10 rounded-full primary-gradient text-white flex items-center justify-center font-bold'
                        : 'w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-white transition-colors'
                    }
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-white transition-colors disabled:opacity-40"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
