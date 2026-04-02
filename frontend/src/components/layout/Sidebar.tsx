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

interface SidebarProps {
  mode: 'full' | 'collapsed' | 'mobile'
  isOverlayOpen?: boolean
  onClose?: () => void
  onToggleCollapse?: () => void
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', to: '/' },
  { label: 'My Tickets', icon: 'confirmation_number', to: '/my-tickets' },
  { label: 'Notifications', icon: 'notifications', to: '/notifications' },
  {
    label: 'New Request',
    icon: 'add_circle',
    to: '/new-request',
    roles: [UserRole.PartnershipTeam, UserRole.SystemAdministrator],
    isPrimary: true,
  },
  {
    label: 'Team Queue',
    icon: 'inbox',
    to: '/team-queue',
    roles: [UserRole.LegalTeam, UserRole.ProductTeam, UserRole.ExecutiveAuthority, UserRole.IntegrationTeam, UserRole.DevTeam, UserRole.BusinessTeam, UserRole.PartnerOps, UserRole.SystemAdministrator],
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
  roles: [UserRole.ProductTeam, UserRole.ExecutiveAuthority, UserRole.SystemAdministrator],
}

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors relative',
          collapsed && 'justify-center px-2',
          isActive
            ? 'text-primary bg-white shadow-sm font-bold'
            : 'text-on-surface-variant hover:bg-surface-container-highest hover:translate-x-1 transition-transform',
          item.isPrimary && !collapsed && 'text-primary',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary" />
          )}
          <span className="material-symbols-outlined text-xl flex-shrink-0">{item.icon}</span>
          {!collapsed && item.label}
        </>
      )}
    </NavLink>
  )
}

function SidebarContent({ collapsed, onClose, showClose, onToggleCollapse }: { collapsed: boolean; onClose?: () => void; showClose?: boolean; onToggleCollapse?: () => void }) {
  const { user } = useAuth()
  const role = user?.role

  const visibleNav = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  )
  const showAdmin = role === UserRole.SystemAdministrator
  const showReports = role ? reportItem.roles?.includes(role) : false

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-6 bg-surface-container-low rounded-br-3xl z-30 flex flex-col py-4 overflow-y-auto transition-all duration-200',
        collapsed ? 'w-16 px-1' : 'w-60 px-3',
      )}
    >
      {showClose && (
        <button
          onClick={onClose}
          className="self-end mb-2 p-2 rounded-lg hover:bg-surface-container-high transition-colors"
          aria-label="Close navigation menu"
        >
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      )}

      <nav className="flex flex-col gap-1 flex-1">
        {visibleNav.map((item) => (
          <NavItemLink key={item.to} item={item} collapsed={collapsed} />
        ))}

        {showAdmin && (
          <>
            <div className={cn('mt-4 mb-1 px-3', collapsed && 'px-1')}>
              {!collapsed && (
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Admin
                </span>
              )}
              {collapsed && <div className="border-t border-outline-variant my-1" />}
            </div>
            {adminItems.map((item) => (
              <NavItemLink key={item.to} item={item} collapsed={collapsed} />
            ))}
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reports at bottom */}
        {showReports && (
          <NavItemLink item={reportItem} collapsed={collapsed} />
        )}
      </nav>

      {/* Collapse toggle */}
      {onToggleCollapse && (
        <div className="pt-3 mt-auto border-t border-outline-variant/20">
          <button
            onClick={onToggleCollapse}
            className={cn(
              'flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors',
              collapsed && 'justify-center px-2',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-xl flex-shrink-0">
              {collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
            </span>
            {!collapsed && <span className="text-[11px] font-semibold uppercase tracking-wider">Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  )
}

export function Sidebar({ mode, isOverlayOpen, onClose, onToggleCollapse }: SidebarProps) {
  if (mode === 'mobile') {
    if (!isOverlayOpen) return null
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Overlay sidebar */}
        <div className="fixed left-0 top-0 bottom-0 w-60 bg-surface-container-low z-50 flex flex-col py-4 px-3 overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between mb-4 pt-2">
            <span className="text-lg font-bold text-primary">Tixora</span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
              aria-label="Close navigation menu"
            >
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
          <SidebarInner onClose={onClose} />
        </div>
      </>
    )
  }

  return <SidebarContent collapsed={mode === 'collapsed'} onToggleCollapse={onToggleCollapse} />
}

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth()
  const role = user?.role

  const visibleNav = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  )
  const showAdmin = role === UserRole.SystemAdministrator
  const showReports = role ? reportItem.roles?.includes(role) : false

  return (
    <nav className="flex flex-col gap-1 flex-1">
      {visibleNav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors relative',
              isActive
                ? 'text-primary bg-white shadow-sm font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:translate-x-1 transition-transform',
              item.isPrimary && !isActive && 'text-primary',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary" />
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
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Admin
            </span>
          </div>
          {adminItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors relative',
                  isActive
                    ? 'text-primary bg-white shadow-sm font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:translate-x-1 transition-transform',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary" />
                  )}
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </>
      )}

      <div className="flex-1" />

      {showReports && (
        <NavLink
          to="/reports"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors relative',
              isActive
                ? 'text-primary bg-white shadow-sm font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:translate-x-1 transition-transform',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary" />
              )}
              <span className="material-symbols-outlined text-xl">{reportItem.icon}</span>
              {reportItem.label}
            </>
          )}
        </NavLink>
      )}
    </nav>
  )
}
