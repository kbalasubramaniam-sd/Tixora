import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-3xl font-semibold text-on-surface tracking-tight">
        Good morning, {user?.firstName}
      </h1>
      <div className="mt-1 mb-8">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-secondary-container text-on-secondary-container">
          {user?.role}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <p className="text-3xl font-semibold text-on-surface">—</p>
            <p className="text-xs text-on-surface-variant mt-1">Stat {i}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6 mt-8">
        <div className="col-span-3">
          <Card>
            <h2 className="text-lg font-semibold text-on-surface mb-4">Action Required</h2>
            <p className="text-sm text-on-surface-variant">No pending actions. Dashboard data will be wired in S-01.</p>
          </Card>
        </div>
        <div className="col-span-2">
          <Card>
            <h2 className="text-lg font-semibold text-on-surface mb-4">Recent Activity</h2>
            <p className="text-sm text-on-surface-variant">Activity timeline will be wired in S-01.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
