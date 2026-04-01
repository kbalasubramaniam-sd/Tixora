interface EmptyStateProps {
  icon?: string
  title: string
  description: string
}

export function EmptyState({ icon = 'inbox', title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">
        {icon}
      </span>
      <h3 className="text-base font-semibold text-on-surface mb-1">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-sm">{description}</p>
    </div>
  )
}
