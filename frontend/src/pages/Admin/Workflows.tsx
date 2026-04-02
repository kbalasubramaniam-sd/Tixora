import { useState } from 'react'

// --- Types ---

interface Stage {
  name: string
  team: string
  slaHours: number | null // null = no SLA (external wait gate)
  docs?: string[]
  conditional?: boolean
}

interface WorkflowData {
  [product: string]: {
    [task: string]: Stage[]
  }
}

// --- Mock Data ---

const WORKFLOWS: WorkflowData = {
  Rabet: {
    'T-01': [
      {
        name: 'Legal Review',
        team: 'Legal Team',
        slaHours: 8,
        docs: ['Trade License', 'Agreement Draft'],
      },
      {
        name: 'Product Review',
        team: 'Product Team',
        slaHours: 16,
        docs: ['Product Assessment'],
      },
      {
        name: 'EA Sign-off',
        team: 'Executive Authority',
        slaHours: 4,
      },
    ],
    'T-02': [
      { name: 'Integration Review', team: 'Integration Team', slaHours: 8 },
      { name: 'Access Provisioning', team: 'Integration Team', slaHours: 16 },
      { name: 'UAT Signal', team: 'Integration Team', slaHours: null },
      { name: 'UAT Sign-off', team: 'Integration Team', slaHours: 4 },
    ],
    'T-03': [
      { name: 'Partner Ops Review', team: 'Partner Ops', slaHours: 8 },
      { name: 'Product Sign-off', team: 'Product Team', slaHours: 8 },
      { name: 'Portal Provisioning', team: 'Business Team', slaHours: 16 },
      {
        name: 'API Provisioning',
        team: 'Dev Team',
        slaHours: 16,
        conditional: true,
      },
    ],
    'T-04': [
      { name: 'Support Triage', team: 'Dev Team', slaHours: 4 },
    ],
  },
  Rhoon: {
    'T-01': [
      {
        name: 'Legal Review',
        team: 'Legal Team',
        slaHours: 8,
        docs: ['Trade License', 'Agreement Draft'],
      },
      {
        name: 'Product Review',
        team: 'Product Team',
        slaHours: 16,
        docs: ['Product Assessment'],
      },
      {
        name: 'EA Sign-off',
        team: 'Executive Authority',
        slaHours: 4,
      },
    ],
    'T-02': [
      { name: 'Integration Review', team: 'Integration Team', slaHours: 8 },
      { name: 'Access Provisioning', team: 'Integration Team', slaHours: 16 },
      { name: 'UAT Signal', team: 'Integration Team', slaHours: null },
      { name: 'UAT Sign-off', team: 'Integration Team', slaHours: 4 },
    ],
    'T-03': [
      { name: 'Partner Ops Review', team: 'Partner Ops', slaHours: 8 },
      { name: 'Product Sign-off', team: 'Product Team', slaHours: 8 },
      { name: 'Portal Provisioning', team: 'Business Team', slaHours: 16 },
      {
        name: 'API Provisioning',
        team: 'Dev Team',
        slaHours: 16,
        conditional: true,
      },
    ],
    'T-04': [
      { name: 'Support Triage', team: 'Integration Team', slaHours: 4 },
    ],
  },
  Wtheeq: {
    'T-01': [
      {
        name: 'Legal Review',
        team: 'Legal Team',
        slaHours: 8,
        docs: ['Trade License', 'Agreement Draft'],
      },
      {
        name: 'Product Review',
        team: 'Product Team',
        slaHours: 16,
        docs: ['Product Assessment'],
      },
      {
        name: 'EA Sign-off',
        team: 'Executive Authority',
        slaHours: 4,
      },
    ],
    'T-02': [
      { name: 'Integration Review', team: 'Integration Team', slaHours: 8 },
      { name: 'Access Provisioning', team: 'Integration Team', slaHours: 16 },
      { name: 'UAT Signal', team: 'Integration Team', slaHours: null },
      { name: 'UAT Sign-off', team: 'Integration Team', slaHours: 4 },
    ],
    'T-03': [
      { name: 'Partner Ops Review', team: 'Partner Ops', slaHours: 8 },
      { name: 'Product Sign-off', team: 'Product Team', slaHours: 8 },
      { name: 'Portal Provisioning', team: 'Business Team', slaHours: 16 },
      {
        name: 'API Provisioning',
        team: 'Dev Team',
        slaHours: 16,
        conditional: true,
      },
    ],
    'T-04': [
      { name: 'Support Triage', team: 'Business Team', slaHours: 4 },
    ],
  },
  Mulem: {
    'T-01': [
      {
        name: 'Legal Review',
        team: 'Legal Team',
        slaHours: 8,
        docs: ['Trade License', 'Agreement Draft'],
      },
      {
        name: 'Product Review',
        team: 'Product Team',
        slaHours: 16,
        docs: ['Product Assessment'],
      },
      {
        name: 'EA Sign-off',
        team: 'Executive Authority',
        slaHours: 4,
      },
    ],
    'T-02': [
      { name: 'Integration Review', team: 'Integration Team', slaHours: 8 },
      { name: 'Access Provisioning', team: 'Integration Team', slaHours: 16 },
      { name: 'UAT Signal', team: 'Integration Team', slaHours: null },
      { name: 'UAT Sign-off', team: 'Integration Team', slaHours: 4 },
    ],
    'T-03': [
      { name: 'Partner Ops Review', team: 'Partner Ops', slaHours: 8 },
      { name: 'Product Sign-off', team: 'Product Team', slaHours: 8 },
      { name: 'Portal Provisioning', team: 'Business Team', slaHours: 16 },
      {
        name: 'API Provisioning',
        team: 'Dev Team',
        slaHours: 16,
        conditional: true,
      },
    ],
    'T-04': [
      { name: 'Support Triage', team: 'Business Team', slaHours: 4 },
    ],
  },
}

const PRODUCTS = ['Rabet', 'Rhoon', 'Wtheeq', 'Mulem']
const TASKS = ['T-01', 'T-02', 'T-03', 'T-04']

const TASK_LABELS: Record<string, string> = {
  'T-01': 'T-01 — Agreement Validation & Sign-off',
  'T-02': 'T-02 — UAT Access Creation',
  'T-03': 'T-03 — Production Account Creation',
  'T-04': 'T-04 — Access & Credential Support',
}

// --- Sub-components ---

function StageCard({ stage, index, isLast }: { stage: Stage; index: number; isLast: boolean }) {
  return (
    <div className="relative flex gap-4">
      {/* Connecting line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 border-l-2 border-primary/20" />
      )}

      {/* Number circle */}
      <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-sm">
        {index + 1}
      </div>

      {/* Card content */}
      <div className="flex-1 bg-surface-container-lowest p-5 rounded-xl mb-3">
        <div className="flex flex-wrap items-start gap-2 mb-3">
          <h3 className="font-bold text-on-surface text-sm flex-1 min-w-0">
            {stage.name}
            {stage.conditional && (
              <span className="ml-2 text-[10px] font-extrabold tracking-wider uppercase text-on-surface-variant/60">
                conditional
              </span>
            )}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Team chip */}
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase">
            {stage.team}
          </span>

          {/* SLA badge */}
          {stage.slaHours !== null ? (
            <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-xs font-bold">
              {stage.slaHours}h SLA
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">
              No SLA — External Wait Gate
            </span>
          )}
        </div>

        {/* Required docs */}
        {stage.docs && stage.docs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-outline-variant/20">
            <p className="text-[10px] font-extrabold tracking-wider uppercase text-on-surface-variant/60 mb-1.5">
              Required Documents
            </p>
            <div className="flex flex-wrap gap-1.5">
              {stage.docs.map((doc) => (
                <span
                  key={doc}
                  className="flex items-center gap-1 bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded text-xs"
                >
                  <span className="material-symbols-outlined text-[12px]">description</span>
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main Page ---

export default function Workflows() {
  const [product, setProduct] = useState('Rabet')
  const [task, setTask] = useState('T-01')

  const stages: Stage[] = WORKFLOWS[product]?.[task] ?? []

  const totalSlaHours = stages.reduce((sum, s) => sum + (s.slaHours ?? 0), 0)
  const stageCount = stages.length

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

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              {PRODUCTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              {TASKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subtitle */}
        <p className="mt-2 text-sm text-on-surface-variant font-medium">
          {TASK_LABELS[task]}
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
                key={`${product}-${task}-${i}`}
                stage={stage}
                index={i}
                isLast={i === stages.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/20">
        <div className="flex flex-wrap gap-6 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-extrabold text-on-surface-variant/60 mb-1">
              Total Stages
            </p>
            <p className="text-2xl font-extrabold text-on-surface">{stageCount}</p>
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
          <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 flex-shrink-0">
            info
          </span>
          <p className="text-xs text-on-surface-variant">
            Workflows are read-only in MVP 1. Configuration editing coming in a future release.
          </p>
        </div>
      </div>
    </div>
  )
}
