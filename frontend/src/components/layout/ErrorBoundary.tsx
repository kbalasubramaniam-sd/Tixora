import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorKey: number
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorKey: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.props.onReset?.()
    // Increment key to force children to remount fresh
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorKey: prev.errorKey + 1,
    }))
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="bg-surface-container-lowest rounded-lg p-8 shadow-ambient max-w-md text-center">
            <div className="text-4xl mb-4">⚠</div>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="gradient-primary text-on-primary font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    // Key forces fresh mount of children on reset
    return <div key={this.state.errorKey}>{this.props.children}</div>
  }
}
