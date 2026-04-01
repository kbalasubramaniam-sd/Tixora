import { useState, useEffect, useCallback } from 'react'

type SidebarMode = 'full' | 'collapsed' | 'mobile'

function getMode(width: number): SidebarMode {
  if (width >= 1024) return 'full'
  if (width >= 768) return 'collapsed'
  return 'mobile'
}

export function useSidebar() {
  const [mode, setMode] = useState<SidebarMode>(() => getMode(window.innerWidth))
  const [isOverlayOpen, setOverlayOpen] = useState(false)

  useEffect(() => {
    function handleResize() {
      const newMode = getMode(window.innerWidth)
      setMode(newMode)
      if (newMode !== 'mobile') setOverlayOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleOverlay = useCallback(() => {
    setOverlayOpen((prev) => !prev)
  }, [])

  return { mode, isOverlayOpen, setOverlayOpen, toggleOverlay }
}
