import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useUnreadCount } from '@/api/hooks/useNotifications'
import { useGlobalSearch } from '@/api/hooks/useSearch'
import { Chip } from '@/components/ui/Chip'

interface TopBarProps {
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

export function TopBar({ onMenuToggle, showMenuButton }: TopBarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { data: unreadCount = 0 } = useUnreadCount()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const { data: searchResults = [], isFetching } = useGlobalSearch(debouncedQuery)

  // Debounce search input by 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass z-50 shadow-sm flex items-center px-6 gap-4">
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
        <span className="text-xl font-bold tracking-tighter text-primary leading-tight">Tixora</span>
        <span className="text-[0.6875rem] text-on-surface-variant leading-tight hidden sm:block">
          Powering Every Request
        </span>
      </div>

      {/* Global Search */}
      <div className="flex-1 flex justify-center">
        <div ref={searchRef} className="relative w-full max-w-[480px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => { if (searchQuery.length >= 2) setShowResults(true) }}
            placeholder="Search tickets, partners, users..."
            aria-label="Global search"
            className="w-full h-10 pl-10 pr-4 rounded-full bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus-glow transition-shadow"
          />

          {/* Search results dropdown */}
          {showResults && debouncedQuery.length >= 2 && (
            <div className="absolute top-12 left-0 right-0 glass rounded-xl shadow-ambient z-50 max-h-80 overflow-y-auto">
              {isFetching ? (
                <div className="flex items-center justify-center p-4">
                  <span className="material-symbols-outlined animate-spin text-primary text-xl">progress_activity</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-sm text-on-surface-variant text-center">
                  No results found
                </div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      setShowResults(false)
                      setSearchQuery('')
                      setDebouncedQuery('')
                      navigate(`/tickets/${result.id}`)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-surface-container-low transition-colors flex flex-col gap-0.5 border-b border-outline-variant/10 last:border-b-0"
                  >
                    <span className="text-sm font-semibold text-on-surface">{result.displayId}</span>
                    <span className="text-sm text-on-surface-variant">{result.title}</span>
                    <span className="text-xs text-on-surface-variant/70">{result.subtitle}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-surface-container-low transition-colors"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
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
                  {user?.fullName}
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
