import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/api/client'
import type { User } from '@/types/user'
import type { UserRole } from '@/types/enums'
import { TixoraLogo } from '@/components/ui/TixoraLogo'

/** Map PascalCase role strings to readable labels */
const roleLabels: Record<string, string> = {
  PartnershipTeam: 'Partnership Team',
  LegalTeam: 'Legal Team',
  ProductTeam: 'Product Team',
  ExecutiveAuthority: 'Executive Authority',
  IntegrationTeam: 'Integration Team',
  DevTeam: 'Dev Team',
  BusinessTeam: 'Business Team',
  PartnerOps: 'Partner Ops',
  SystemAdministrator: 'System Admin',
}

/** Distinct avatar background colors per role */
const roleColors: Record<string, string> = {
  PartnershipTeam: 'bg-primary',
  LegalTeam: 'bg-tertiary',
  ProductTeam: 'bg-secondary',
  ExecutiveAuthority: 'bg-[#7c3aed]',
  IntegrationTeam: 'bg-[#2563eb]',
  DevTeam: 'bg-[#059669]',
  BusinessTeam: 'bg-[#d97706]',
  PartnerOps: 'bg-primary-container',
  SystemAdministrator: 'bg-[#dc2626]',
}

function formatRole(role: UserRole): string {
  return roleLabels[role] ?? String(role).replace(/([a-z])([A-Z])/g, '$1 $2')
}

function avatarColor(role: UserRole): string {
  return roleColors[role] ?? 'bg-primary'
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loggingInId, setLoggingInId] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get<User[]>('/auth/demo-users')
      .then((res) => setUsers(res.data))
      .catch(() => setError('Failed to load demo users. Is the API running?'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSelect(user: User) {
    if (loggingInId) return
    setError('')
    setLoggingInId(user.id)
    localStorage.removeItem('tixora_token')

    try {
      await login({ email: user.email, password: 'Password1!' })
      navigate('/', { replace: true })
    } catch {
      setError('Login failed. Please try again.')
      setLoggingInId(null)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-svh bg-surface bg-[radial-gradient(circle_at_50%_50%,rgba(35,162,163,0.03),transparent_70%)]">
      <div className="w-full max-w-2xl px-6 py-12">
        {/* Branding */}
        <div className="text-center mb-10 flex flex-col items-center">
          <img src="/tixora-logo.svg" alt="Tixora" className="w-full max-w-md mb-4" />
          <p className="text-sm font-medium text-on-surface-variant">
            Select a user to continue
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-on-surface-variant">Loading users...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && !users.length && (
          <div className="bg-error-container/40 rounded-xl p-6 text-center">
            <span className="material-symbols-outlined text-3xl text-error mb-2 block">error</span>
            <p className="text-sm text-on-error-container">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Inline error (login failure) */}
        {error && users.length > 0 && (
          <p className="text-xs text-error text-center mb-4">{error}</p>
        )}

        {/* User grid */}
        {!loading && users.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => {
              const isLoggingIn = loggingInId === user.id
              const isDisabled = loggingInId !== null && !isLoggingIn

              return (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  disabled={isDisabled}
                  className={[
                    'group relative bg-surface-container-lowest rounded-2xl p-5 text-left',
                    'shadow-sm hover:shadow-lg hover:-translate-y-0.5',
                    'transition-all duration-200 ease-out',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20',
                    'active:scale-[0.98]',
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  {/* Loading overlay */}
                  {isLoggingIn && (
                    <div className="absolute inset-0 bg-surface-container-lowest/80 rounded-2xl flex items-center justify-center z-10">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Avatar */}
                  <div
                    className={[
                      'w-11 h-11 rounded-full flex items-center justify-center mb-3',
                      avatarColor(user.role),
                    ].join(' ')}
                  >
                    <span className="text-lg font-bold text-white">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Name */}
                  <p className="text-sm font-semibold text-on-surface truncate">
                    {user.fullName}
                  </p>

                  {/* Role badge */}
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase rounded-full bg-primary/8 text-primary">
                    {formatRole(user.role)}
                  </span>

                  {/* Email */}
                  <p className="text-xs text-on-surface-variant mt-2 truncate">
                    {user.email}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
