export function GlobalFallback() {
  return (
    <div className="flex items-center justify-center min-h-svh bg-surface">
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient max-w-md text-center">
        <div className="text-5xl mb-4">⚠</div>
        <h1 className="text-xl font-bold text-on-surface mb-2">
          Tixora encountered an error
        </h1>
        <p className="text-sm text-on-surface-variant mb-6">
          Please refresh the page. If the problem persists, contact your system administrator.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="primary-gradient text-on-primary font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}
