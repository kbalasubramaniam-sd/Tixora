export function NotificationStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Critical SLA</p>
          <p className="text-3xl font-black text-error">12</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-error-container flex items-center justify-center text-error">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
        </div>
      </div>
      <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Open Tasks</p>
          <p className="text-3xl font-black text-primary">28</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
        </div>
      </div>
      <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Avg Response</p>
          <p className="text-3xl font-black text-on-surface">14m</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-secondary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
        </div>
      </div>
    </div>
  )
}
