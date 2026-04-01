import { NavLink } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/enums'
import { cn } from '@/utils/cn'

interface NavItem {
  label: string
  icon: string
  to: string
  roles?: UserRole[]
  isPrimary?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', to: '/' },
  { label: 'My Tickets', icon: 'confirmation_number', to: '/my-tickets' },
  { label: 'Notifications', icon: 'notifications', to: '/notifications' },
  {
    label: 'New Request',
    icon: 'add_circle',
    to: '/new-request',
    roles: [UserRole.Requester, UserRole.SystemAdministrator],
    isPrimary: true,
  },
  {
    label: 'Team Queue',
    icon: 'inbox',
    to: '/team-queue',
    roles: [UserRole.Reviewer, UserRole.Approver, UserRole.IntegrationTeam, UserRole.ProvisioningAgent, UserRole.SystemAdministrator],
  },
  { label: 'Partners', icon: 'business', to: '/partners' },
  { label: 'Search', icon: 'search', to: '/search' },
]

const adminItems: NavItem[] = [
  { label: 'Users', icon: 'group', to: '/admin/users' },
  { label: 'Workflows', icon: 'account_tree', to: '/admin/workflows' },
  { label: 'SLA Settings', icon: 'schedule', to: '/admin/sla' },
  { label: 'Business Hours', icon: 'calendar_month', to: '/admin/business-hours' },
]

const reportItem: NavItem = {
  label: 'Reports',
  icon: 'bar_chart',
  to: '/reports',
  roles: [UserRole.Reviewer, UserRole.Approver, UserRole.SystemAdministrator],
}

export function Sidebar() {
  const { user } = useAuth()
  const role = user?.role

  const visibleNav = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  )
  const showAdmin = role === UserRole.SystemAdministrator
  const showReports = role ? reportItem.roles?.includes(role) : false

  return (
    <aside className="fixed left-0 top-16 bottom-6 w-60 bg-surface-container-low rounded-br-3xl z-30 flex flex-col py-4 px-3 overflow-y-auto">
      <nav className="flex flex-col gap-1 flex-1">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'text-primary-container bg-surface-container-lowest'
                  : 'text-on-surface-variant hover:bg-surface-container-highest',
                item.isPrimary && !isActive && 'text-primary-container',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-container" />
                )}
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}

        {showAdmin && (
          <>
            <div className="mt-4 mb-1 px-3">
              <span className="text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-wider">
                Admin
              </span>
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                    isActive
                      ? 'text-primary-container bg-surface-container-lowest'
                      : 'text-on-surface-variant hover:bg-surface-container-highest',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-container" />
                    )}
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reports at bottom */}
        {showReports && (
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'text-primary-container bg-surface-container-lowest'
                  : 'text-on-surface-variant hover:bg-surface-container-highest',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-container" />
                )}
                <span className="material-symbols-outlined text-xl">{reportItem.icon}</span>
                {reportItem.label}
              </>
            )}
          </NavLink>
        )}
      </nav>
    </aside>
  )
}
