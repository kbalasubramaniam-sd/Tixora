import { useState, useEffect, useCallback } from 'react'

type SidebarMode = 'full' | 'collapsed' | 'mobile'

function getMode(width: number): SidebarMode {
  if (width >= 1024) return 'full'
  if (width >= 768) return 'collapsed'
  return 'mobile'
}

export function useSidebar() {
  const [autoMode, setAutoMode] = useState<SidebarMode>(() => getMode(window.innerWidth))
  const [manualOverride, setManualOverride] = useState<'full' | 'collapsed' | null>(null)
  const [isOverlayOpen, setOverlayOpen] = useState(false)

  useEffect(() => {
    function handleResize() {
      const newMode = getMode(window.innerWidth)
      setAutoMode(newMode)
      if (newMode !== 'mobile') setOverlayOpen(false)
      // Clear manual override when switching to/from mobile
      if (newMode === 'mobile') setManualOverride(null)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleOverlay = useCallback(() => {
    setOverlayOpen((prev) => !prev)
  }, [])

  const toggleCollapse = useCallback(() => {
    setManualOverride((prev) => {
      if (prev === 'collapsed') return 'full'
      if (prev === 'full') return 'collapsed'
      // No override yet — toggle from current auto mode
      return autoMode === 'full' ? 'collapsed' : 'full'
    })
  }, [autoMode])

  // Mobile always uses mobile mode; otherwise respect manual override
  const mode: SidebarMode = autoMode === 'mobile' ? 'mobile' : (manualOverride ?? autoMode)

  return { mode, isOverlayOpen, setOverlayOpen, toggleOverlay, toggleCollapse }
}
