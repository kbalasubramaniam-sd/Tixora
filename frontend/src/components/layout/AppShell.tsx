import { Outlet, useLocation } from 'react-router'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from './ErrorBoundary'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/utils/cn'

export function AppShell() {
  const { mode, isOverlayOpen, toggleOverlay, setOverlayOpen, toggleCollapse } = useSidebar()
  const location = useLocation()

  const mainMargin =
    mode === 'full' ? 'ml-60' : mode === 'collapsed' ? 'ml-16' : 'ml-0'

  return (
    <div className="min-h-svh bg-surface">
      <TopBar
        showMenuButton={mode === 'mobile'}
        onMenuToggle={toggleOverlay}
      />
      <Sidebar
        mode={mode}
        isOverlayOpen={isOverlayOpen}
        onClose={() => setOverlayOpen(false)}
        onToggleCollapse={toggleCollapse}
      />
      <main className={cn('pt-16 min-h-svh transition-all duration-200', mainMargin)}>
        <div className="p-8">
          <div className="max-w-screen-xl mx-auto">
            <ErrorBoundary>
              <div
                key={location.pathname}
                className="animate-[fadeIn_200ms_ease-out]"
              >
                <Outlet />
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  )
}
