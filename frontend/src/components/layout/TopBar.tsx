import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Chip } from '@/components/ui/Chip'

interface TopBarProps {
  notificationCount?: number
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

export function TopBar({ notificationCount = 0, onMenuToggle, showMenuButton }: TopBarProps) {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : '??'

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass z-40 flex items-center px-6 gap-4">
      {/* Hamburger menu for mobile */}
      {showMenuButton && (
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-surface-container-low transition-colors lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined text-on-surface-variant">menu</span>
        </button>
      )}

      {/* Logo */}
      <div className="flex flex-col mr-4">
        <span className="text-2xl font-bold tracking-tighter text-primary leading-tight">Tixora</span>
        <span className="text-[0.6875rem] text-on-surface-variant leading-tight hidden sm:block">
          Powering Every Request
        </span>
      </div>

      {/* Global Search */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-[480px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search tickets, partners, users..."
            aria-label="Global search"
            className="w-full h-10 pl-10 pr-4 rounded-full bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus-glow transition-shadow"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg hover:bg-surface-container-low transition-colors"
          aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'}
        >
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-container text-on-primary text-[10px] font-bold flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 rounded-full bg-primary-container text-on-primary text-sm font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
            aria-label="User menu"
          >
            {initials}
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-12 w-56 glass rounded-xl p-4 shadow-ambient z-50">
                <p className="text-sm font-semibold text-on-surface">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-on-surface-variant">{user?.email}</p>
                <Chip className="mt-2">{user?.role}</Chip>
                <button
                  onClick={logout}
                  className="mt-4 w-full text-left text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
