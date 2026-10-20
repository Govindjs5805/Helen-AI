import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { useReadingTheme } from '@/context/ReadingThemeContext'
import { QuickThoughtCapture } from '@/components/QuickThoughtCapture'
import { useTheme } from '@/context/ThemeContext'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    window.matchMedia('(min-width: 768px)').matches
  )
  const location = useLocation()
  const focusMode = location.pathname === '/focus'
  const { adhdEnabled } = useReadingTheme()
  const { activeDisabilityPreset } = useTheme()
  const adhdDashboard = activeDisabilityPreset === 'adhd' && location.pathname === '/dashboard'

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev)

  useEffect(() => {
    const desktopMedia = window.matchMedia('(min-width: 768px)')
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      setIsSidebarOpen(event.matches)
    }

    desktopMedia.addEventListener('change', handleBreakpointChange)
    return () => desktopMedia.removeEventListener('change', handleBreakpointChange)
  }, [])

  return (
    <div className="flex min-h-dvh w-full overflow-x-clip bg-background text-text">
      {!focusMode && !adhdDashboard && <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />}

      {/* Overlay for mobile when sidebar is open */}
      {!focusMode && !adhdDashboard && isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Page content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className={focusMode ? 'min-w-0 flex-1 px-4 py-3' : 'min-w-0 flex-1 px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 md:px-8 md:pb-6'}>
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      {!focusMode && !adhdDashboard && <MobileBottomNav maxVisible={4} />}
      {!focusMode && !adhdDashboard && adhdEnabled && <QuickThoughtCapture />}
    </div>
  )
}
