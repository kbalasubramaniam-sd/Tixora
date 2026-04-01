import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { apiClient } from '@/api/client'
import type { User, AuthResponse, LoginRequest } from '@/types/user'

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
        // Token is invalid — clear it
        localStorage.removeItem('tixora_token')
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const login = useCallback(async (credentials: LoginRequest) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials)
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem('tixora_token', newToken)
    setToken(newToken)
    setUser(newUser)
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
