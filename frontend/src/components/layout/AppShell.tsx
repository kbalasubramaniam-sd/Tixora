import { Outlet } from 'react-router'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from './ErrorBoundary'

export function AppShell() {
  return (
    <div className="min-h-svh bg-surface">
      <TopBar />
      <Sidebar />
      <main className="ml-60 pt-16 min-h-svh">
        <div className="p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
