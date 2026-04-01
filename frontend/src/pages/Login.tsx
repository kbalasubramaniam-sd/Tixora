import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      navigate('/', { replace: true })
    } catch {
      setError('Invalid email or password')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-svh bg-surface bg-[radial-gradient(circle_at_50%_50%,rgba(35,162,163,0.03),transparent_70%)]">
      <div className="w-full max-w-[400px] bg-surface-container-lowest rounded-3xl p-8 shadow-ambient">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-container tracking-tight">
            Tixora
          </h1>
          <p className="text-xs font-medium text-on-surface-variant mt-1">
            Powering Every Request
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          <div className="mt-2">
            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="w-full"
            >
              Sign In
            </Button>
          </div>

          {error && (
            <p className="text-xs text-error text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}
