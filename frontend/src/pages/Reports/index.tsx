import { useState } from 'react'
import { useReportOverview, useExportCsv } from '@/api/hooks/useReports'
import { ApiError } from '@/components/ui/ApiError'
import { PRODUCT_LABELS, TASK_LABELS, STATUS_LABELS } from '@/utils/labels'
import { cn } from '@/utils/cn'

interface StatCardProps {
  label: string
  value: number | string
  icon: string
  iconBg: string
  iconColor: string
}

function StatCard({ label, value, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xl shadow-teal-900/5 group hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-4">
        <span className={cn('p-2 rounded-lg', iconBg, iconColor)}>
          <span className="material-symbols-outlined">{icon}</span>
        </span>
      </div>
      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-4xl font-extrabold tracking-tighter text-on-surface">{value}</h3>
    </div>
  )
}

interface BarChartRowProps {
  label: string
  count: number
  maxCount: number
  color?: string
}

function BarChartRow({ label, count, maxCount, color = 'bg-primary' }: BarChartRowProps) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-on-surface w-40 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1 bg-surface-container-highest rounded-full h-3 overflow-hidden">
          <div
            className={cn('h-3 rounded-full transition-all duration-500', color)}
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
        <span className="text-xs font-bold text-on-surface-variant w-10 text-right flex-shrink-0">{count}</span>
      </div>
    </div>
  )
}

const barColors = [
  'bg-primary',
  'bg-secondary',
  'bg-tertiary',
  'bg-warning',
  'bg-error',
  'bg-primary/60',
  'bg-secondary/60',
  'bg-tertiary/60',
]

export default function Reports() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading, isError, refetch } = useReportOverview(
    dateFrom || undefined,
    dateTo || undefined,
  )

  const exportCsv = useExportCsv()

  const handleExport = () => {
    exportCsv.mutate({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold text-on-surface tracking-tight mb-2 font-headline">Reports</h1>
          <p className="text-on-surface-variant max-w-2xl text-lg">
            Overview of ticket metrics, SLA performance, and operational breakdowns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-4 py-2.5">
            <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/60 flex-shrink-0">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-on-surface outline-none"
            />
            <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/60 flex-shrink-0 ml-2">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-on-surface outline-none"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={exportCsv.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold text-sm hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {exportCsv.isPending ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {isError ? (
        <ApiError title="Failed to load report data" onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
        </div>
      ) : data ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
            <StatCard label="Total Tickets" value={data.totalTickets} icon="confirmation_number" iconBg="bg-primary/10" iconColor="text-primary" />
            <StatCard label="Open" value={data.openTickets} icon="pending" iconBg="bg-secondary/10" iconColor="text-secondary" />
            <StatCard label="Completed" value={data.completedTickets} icon="check_circle" iconBg="bg-primary/10" iconColor="text-primary" />
            <StatCard label="Rejected" value={data.rejectedTickets} icon="cancel" iconBg="bg-error/10" iconColor="text-error" />
            <StatCard label="Cancelled" value={data.cancelledTickets} icon="block" iconBg="bg-warning/10" iconColor="text-warning" />
          </div>

          {/* SLA Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xl shadow-teal-900/5">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">SLA Compliance</p>
              <h3 className={cn(
                'text-5xl font-extrabold tracking-tighter',
                data.slaCompliancePercent >= 80 ? 'text-primary' : data.slaCompliancePercent >= 50 ? 'text-warning' : 'text-error',
              )}>
                {data.slaCompliancePercent.toFixed(1)}%
              </h3>
              <div className="mt-3 bg-surface-container-highest rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-700',
                    data.slaCompliancePercent >= 80 ? 'bg-primary' : data.slaCompliancePercent >= 50 ? 'bg-warning' : 'bg-error',
                  )}
                  style={{ width: `${data.slaCompliancePercent}%` }}
                />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xl shadow-teal-900/5">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">SLA Breaches</p>
              <h3 className={cn(
                'text-5xl font-extrabold tracking-tighter',
                data.slaBreachCount > 0 ? 'text-error' : 'text-primary',
              )}>
                {data.slaBreachCount}
              </h3>
              <p className="text-sm text-on-surface-variant mt-2">breached tickets</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xl shadow-teal-900/5">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Avg Resolution</p>
              <h3 className="text-5xl font-extrabold tracking-tighter text-on-surface">
                {data.avgResolutionHours.toFixed(1)}
              </h3>
              <p className="text-sm text-on-surface-variant mt-2">business hours</p>
            </div>
          </div>

          {/* Breakdown Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* By Product */}
            <div className="bg-surface-container-lowest rounded-xl shadow-xl shadow-teal-900/5 p-6">
              <h2 className="text-lg font-extrabold text-on-surface tracking-tight uppercase mb-6">By Product</h2>
              <div className="space-y-4">
                {data.byProduct.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No data</p>
                ) : (
                  data.byProduct.map((item, i) => (
                    <BarChartRow
                      key={item.productCode}
                      label={PRODUCT_LABELS[item.productCode] ?? item.productCode}
                      count={item.count}
                      maxCount={Math.max(...data.byProduct.map((p) => p.count))}
                      color={barColors[i % barColors.length]}
                    />
                  ))
                )}
              </div>
            </div>

            {/* By Task Type */}
            <div className="bg-surface-container-lowest rounded-xl shadow-xl shadow-teal-900/5 p-6">
              <h2 className="text-lg font-extrabold text-on-surface tracking-tight uppercase mb-6">By Task Type</h2>
              <div className="space-y-4">
                {data.byTaskType.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No data</p>
                ) : (
                  data.byTaskType.map((item, i) => (
                    <BarChartRow
                      key={item.taskType}
                      label={TASK_LABELS[item.taskType] ?? item.taskType}
                      count={item.count}
                      maxCount={Math.max(...data.byTaskType.map((t) => t.count))}
                      color={barColors[i % barColors.length]}
                    />
                  ))
                )}
              </div>
            </div>

            {/* By Status */}
            <div className="bg-surface-container-lowest rounded-xl shadow-xl shadow-teal-900/5 p-6">
              <h2 className="text-lg font-extrabold text-on-surface tracking-tight uppercase mb-6">By Status</h2>
              <div className="space-y-4">
                {data.byStatus.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No data</p>
                ) : (
                  data.byStatus.map((item, i) => (
                    <BarChartRow
                      key={item.status}
                      label={(STATUS_LABELS as Record<string, string>)[item.status] ?? item.status}
                      count={item.count}
                      maxCount={Math.max(...data.byStatus.map((s) => s.count))}
                      color={barColors[i % barColors.length]}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
