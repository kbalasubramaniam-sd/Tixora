import type { UserRole } from './enums'

export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}
