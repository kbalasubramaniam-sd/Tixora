interface ApiErrorProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ApiError({
  title = 'Something went wrong',
  message = 'Failed to load data. Please check your connection and try again.',
  onRetry,
}: ApiErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-error-surface flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-error">cloud_off</span>
      </div>
      <h3 className="text-base font-semibold text-on-surface mb-1">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
