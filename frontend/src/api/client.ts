import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL as string

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tixora_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Clear token on 401 — AuthContext and ProtectedRoute handle the redirect
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tixora_token')
    }
    return Promise.reject(error)
  },
)
