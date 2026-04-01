import { Link } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardStats, useActionRequired, useRecentActivity } from '@/api/hooks/useDashboard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { TicketRow } from '@/components/shared/TicketRow'
import { UserRole } from '@/types/enums'
import { cn } from '@/utils/cn'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: tickets, isLoading: ticketsLoading } = useActionRequired()
  const { data: activity, isLoading: activityLoading } = useRecentActivity()

  const isRequester = user?.role === UserRole.Requester || user?.role === UserRole.SystemAdministrator

  return (
    <div>
      {/* Header */}
      <h1 className="text-3xl font-semibold text-on-surface tracking-tight">
        {getGreeting()}, {user?.firstName}
      </h1>
      <div className="mt-1 mb-8">
        <Chip>{user?.role}</Chip>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-9 w-16 bg-surface-container-low rounded mb-1" />
              <div className="h-3 w-24 bg-surface-container-low rounded" />
            </Card>
          ))
        ) : stats ? (
          [stats.stat1, stats.stat2, stats.stat3, stats.stat4].map((stat, i) => (
            <Card key={i}>
              <p className={cn(
                'text-3xl font-semibold',
                stat.highlight === 'amber' && Number(stat.value) > 0 ? 'text-warning' :
                stat.highlight === 'red' && Number(stat.value) > 0 ? 'text-error' :
                'text-on-surface',
              )}>
                {stat.value}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">{stat.label}</p>
            </Card>
          ))
        ) : null}
      </div>

      {/* Main content: Action Required + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
        {/* Action Required (left, 60%) */}
        <div className="lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-on-surface">Action Required</h2>
                <p className="text-xs text-on-surface-variant">Tickets waiting for your response</p>
              </div>
              {isRequester && (
                <Link to="/new-request">
                  <Button size="sm">
                    <span className="material-symbols-outlined text-base">add</span>
                    New Request
                  </Button>
                </Link>
              )}
            </div>

            {ticketsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-surface-container-low rounded-lg animate-pulse" />
                ))}
              </div>
            ) : tickets && tickets.length > 0 ? (
              <div className="flex flex-col gap-3">
                {tickets.slice(0, 5).map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} />
                ))}
                {tickets.length > 5 && (
                  <Link
                    to="/my-tickets"
                    className="text-sm font-medium text-primary text-center py-2 hover:text-primary-container transition-colors"
                  >
                    View All ({tickets.length})
                  </Link>
                )}
              </div>
            ) : (
              <EmptyState
                icon="check_circle"
                title="You're all caught up"
                description="No tickets currently require your action"
              />
            )}
          </Card>
        </div>

        {/* Recent Activity (right, 40%) */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold text-on-surface mb-4">Recent Activity</h2>

            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-surface-container-low shrink-0 mt-1.5" />
                    <div className="flex-1">
                      <div className="h-3 w-full bg-surface-container-low rounded animate-pulse" />
                      <div className="h-2 w-16 bg-surface-container-low rounded animate-pulse mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[3px] top-2 bottom-2 w-[2px] bg-outline-variant/20" />

                <div className="flex flex-col gap-4">
                  {activity.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex gap-3 relative">
                      <span className="w-2 h-2 rounded-full bg-primary-container shrink-0 mt-1.5 z-10" />
                      <div className="min-w-0">
                        <p className="text-[0.8125rem] text-on-surface leading-snug">{entry.description}</p>
                        <p className="text-[0.6875rem] text-on-surface-variant mt-0.5">{entry.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon="history"
                title="No recent activity"
                description="Your activity will appear here"
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
