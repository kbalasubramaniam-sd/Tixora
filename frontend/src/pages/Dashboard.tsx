import { Link } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardStats, useActionRequired, useRecentActivity } from '@/api/hooks/useDashboard'
import { Button } from '@/components/ui/Button'
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

const roleLabel: Record<string, string> = {
  [UserRole.PartnershipTeam]: 'Partnership Team',
  [UserRole.LegalTeam]: 'Legal Team',
  [UserRole.ProductTeam]: 'Product Team',
  [UserRole.ExecutiveAuthority]: 'Executive Authority',
  [UserRole.IntegrationTeam]: 'Integration Team',
  [UserRole.DevTeam]: 'Dev Team',
  [UserRole.BusinessTeam]: 'Business Team',
  [UserRole.PartnerOps]: 'Partner Ops',
  [UserRole.SystemAdministrator]: 'System Administrator',
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: tickets, isLoading: ticketsLoading } = useActionRequired()
  const { data: activity, isLoading: activityLoading } = useRecentActivity()

  const isRequester = user?.role === UserRole.PartnershipTeam || user?.role === UserRole.SystemAdministrator

  return (
    <div>
      {/* Page Header */}
      <header className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
              {getGreeting()}, {user?.firstName}
            </h1>
            <span className="bg-primary-container/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              {roleLabel[user?.role ?? ''] ?? user?.role}
            </span>
          </div>
          <p className="text-on-surface-variant font-medium">
            Here's an overview of your operations and pending requests.
          </p>
        </div>
        {isRequester && (
          <Link to="/new-request">
            <Button className="shadow-lg shadow-primary/20 rounded-xl">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              New Request
            </Button>
          </Link>
        )}
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statsLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-xl shadow-xl shadow-teal-900/5 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-surface-container-low rounded-lg" />
                <div className="w-12 h-4 bg-surface-container-low rounded" />
              </div>
              <div className="h-3 w-28 bg-surface-container-low rounded mb-2" />
              <div className="h-10 w-20 bg-surface-container-low rounded" />
            </div>
          ))
        ) : stats ? (
          [stats.stat1, stats.stat2, stats.stat3, stats.stat4].map((stat, i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-xl shadow-xl shadow-teal-900/5 group hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-4">
                <span className={cn('p-2 rounded-lg', stat.iconBg, stat.iconColor)}>
                  <span className="material-symbols-outlined">{stat.icon}</span>
                </span>
                {stat.badge && (
                  <span className={stat.badgeStyle ?? 'text-xs font-bold text-on-surface-variant'}>
                    {stat.badge}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className={cn('text-4xl font-extrabold tracking-tighter', stat.valueColor ?? 'text-on-surface')}>
                {stat.value}
              </h3>
            </div>
          ))
        ) : null}
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Action Required (left, 60%) */}
        <section className="lg:col-span-6">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl shadow-teal-900/5 overflow-hidden">
            <div className="p-6 flex justify-between items-center bg-surface-container-low/30">
              <h2 className="text-lg font-extrabold text-on-surface tracking-tight uppercase">Action Required</h2>
              <Link to="/my-tickets" className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">
                View All Queue
              </Link>
            </div>

            {ticketsLoading ? (
              <div className="divide-y divide-surface-container-low">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-10 rounded-full bg-surface-container-low" />
                      <div className="flex-1">
                        <div className="h-4 w-48 bg-surface-container-low rounded mb-2" />
                        <div className="h-3 w-32 bg-surface-container-low rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tickets && tickets.length > 0 ? (
              <div className="divide-y divide-surface-container-low">
                {tickets.slice(0, 5).map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} />
                ))}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon="check_circle"
                  title="You're all caught up"
                  description="No tickets currently require your action"
                />
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity (right, 40%) */}
        <section className="lg:col-span-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl shadow-teal-900/5 p-6 h-full">
            <h2 className="text-lg font-extrabold text-on-surface tracking-tight uppercase mb-8">Recent Activity</h2>

            {activityLoading ? (
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-surface-container-low shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-surface-container-low rounded mb-1" />
                      <div className="h-3 w-full bg-surface-container-low rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="relative space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-surface-container-highest">
                {activity.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="relative pl-10">
                    <div className={cn(
                      'absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-4 border-surface-container-lowest',
                      entry.iconBg,
                    )}>
                      <span
                        className={cn('material-symbols-outlined text-[12px]', entry.iconColor)}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {entry.icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{entry.title}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{entry.description}</p>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase mt-2 block tracking-widest">
                        {entry.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="history"
                title="No recent activity"
                description="Your activity will appear here"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
