import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { apiClient } from '@/api/client'
import type { User, AuthResponse, LoginRequest } from '@/types/user'
import { UserRole } from '@/types/enums'

const DEV_USER: User = {
  id: 'dev-1',
  fullName: 'Karthik Dev',
  email: 'admin@tixora.dev',
  role: UserRole.SystemAdministrator,
  isActive: true,
}

const IS_DEV = import.meta.env.DEV

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('tixora_token'),
  )
  const [isLoading, setIsLoading] = useState(true)

  // On mount, if we have a token, fetch the current user
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    apiClient
      .get<User>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        if (IS_DEV) {
          // Dev mode: use mock user instead of clearing token
          setUser(DEV_USER)
        } else {
          localStorage.removeItem('tixora_token')
          setToken(null)
        }
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      const res = await apiClient.post<AuthResponse>('/auth/login', credentials)
      const { token: newToken, user: newUser } = res.data
      localStorage.setItem('tixora_token', newToken)
      setToken(newToken)
      setUser(newUser)
    } catch {
      if (IS_DEV) {
        // Dev mode: bypass auth, set fake token and dev user
        localStorage.setItem('tixora_token', 'dev-token')
        setToken('dev-token')
        setUser(DEV_USER)
      } else {
        throw new Error('Invalid credentials')
      }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tixora_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
