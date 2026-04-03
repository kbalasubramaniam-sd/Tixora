import { useState, useMemo } from 'react'
import { useWorkflowConfig } from '@/api/hooks/useAdmin'
import type { WorkflowStageConfig } from '@/api/endpoints/admin'
import { PRODUCT_LABELS, TASK_LABELS, ROLE_LABELS } from '@/utils/labels'

// --- Types ---

interface Stage {
  name: string
  team: string
  teamLabel: string
  stageType: string
  slaHours: number | null
}

// --- Sub-components ---

function StageCard({ stage, index, isLast }: { stage: Stage; index: number; isLast: boolean }) {
  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 border-l-2 border-primary/20" />
      )}

      <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-sm">
        {index + 1}
      </div>

      <div className="flex-1 bg-surface-container-lowest p-5 rounded-xl mb-3">
        <h3 className="font-bold text-on-surface text-sm mb-3">{stage.name}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase">
            {stage.teamLabel}
          </span>
          <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            {stage.stageType}
          </span>
          {stage.slaHours !== null ? (
            <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-xs font-bold">
              {stage.slaHours}h SLA
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">
              No SLA — External Wait
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Main Page ---

export default function Workflows() {
  const { data: workflows, isLoading, error } = useWorkflowConfig()

  const products = useMemo(() => {
    if (!workflows) return []
    return [...new Set(workflows.map((w) => w.productCode))]
  }, [workflows])

  const tasks = useMemo(() => {
    if (!workflows) return []
    return [...new Set(workflows.map((w) => w.taskType))].sort()
  }, [workflows])

  const [product, setProduct] = useState('')
  const [task, setTask] = useState('')

  const activeProduct = product || products[0] || ''
  const activeTask = task || tasks[0] || ''

  // Find matching workflow(s) — T-03 may have multiple (PortalOnly, PortalAndApi)
  const matchingWorkflows = useMemo(() => {
    if (!workflows) return []
    return workflows.filter(
      (w) => w.productCode === activeProduct && w.taskType === activeTask,
    )
  }, [workflows, activeProduct, activeTask])

  const stages: Stage[] = useMemo(() => {
    if (matchingWorkflows.length === 0) return []
    // Use first matching workflow (or could let user pick provisioning path)
    const wf = matchingWorkflows[0]
    return wf.stages
      .sort((a: WorkflowStageConfig, b: WorkflowStageConfig) => a.stageOrder - b.stageOrder)
      .map((s: WorkflowStageConfig) => ({
        name: s.stageName,
        team: s.assignedRole,
        teamLabel: ROLE_LABELS[s.assignedRole as keyof typeof ROLE_LABELS] ?? s.assignedRole,
        stageType: s.stageType,
        slaHours: s.slaBusinessHours === 0 ? null : s.slaBusinessHours,
      }))
  }, [matchingWorkflows])

  const totalSlaHours = stages.reduce((sum, s) => sum + (s.slaHours ?? 0), 0)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-surface-container-low rounded w-1/3" />
          <div className="h-6 bg-surface-container-low rounded w-1/2" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-surface-container-low rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-error-container text-on-error-container p-6 rounded-xl">
          <p className="font-bold">Failed to load workflow configuration</p>
          <p className="text-sm mt-1">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest text-secondary font-extrabold mb-2">
          Systems Operations
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface flex-1">
            Workflow Management
          </h1>

          <div className="flex items-center gap-3">
            <select
              value={activeProduct}
              onChange={(e) => setProduct(e.target.value)}
              className="bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p} value={p}>
                  {PRODUCT_LABELS[p] ?? p}
                </option>
              ))}
            </select>

            <select
              value={activeTask}
              onChange={(e) => setTask(e.target.value)}
              className="bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              {tasks.map((t) => (
                <option key={t} value={t}>
                  {TASK_LABELS[t] ?? t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-2 text-sm text-on-surface-variant font-medium">
          {TASK_LABELS[activeTask] ?? activeTask}
          {matchingWorkflows.length > 1 && (
            <span className="ml-2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {matchingWorkflows.length} variants
            </span>
          )}
        </p>
      </div>

      {/* Stage List */}
      <div className="mb-6">
        {stages.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-on-surface-variant text-sm">
            No workflow configured for this combination.
          </div>
        ) : (
          <div>
            {stages.map((stage, i) => (
              <StageCard
                key={`${activeProduct}-${activeTask}-${i}`}
                stage={stage}
                index={i}
                isLast={i === stages.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/20">
        <div className="flex flex-wrap gap-6 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-extrabold text-on-surface-variant/60 mb-1">
              Total Stages
            </p>
            <p className="text-2xl font-extrabold text-on-surface">{stages.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-extrabold text-on-surface-variant/60 mb-1">
              Total Cycle Time
            </p>
            <p className="text-2xl font-extrabold text-on-surface">
              {totalSlaHours > 0 ? `${totalSlaHours}h` : '—'}
            </p>
            {totalSlaHours > 0 && (
              <p className="text-[10px] text-on-surface-variant/60 mt-0.5">business hours</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 pt-4 border-t border-outline-variant/20">
          <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 flex-shrink-0">info</span>
          <p className="text-xs text-on-surface-variant">
            Workflows are read-only in MVP 1. Configuration editing coming in a future release.
          </p>
        </div>
      </div>
    </div>
  )
}
