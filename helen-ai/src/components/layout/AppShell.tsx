import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { useReadingTheme } from '@/context/ReadingThemeContext'
import { QuickThoughtCapture } from '@/components/QuickThoughtCapture'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const focusMode = useLocation().pathname === '/focus'
  const { adhdEnabled } = useReadingTheme()

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev)

  return (
    <div className="flex min-h-screen overflow-hidden bg-background text-text">
      {!focusMode && <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />}

      {/* Overlay for mobile when sidebar is open */}
      {!focusMode && isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Page content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className={focusMode ? 'flex-1 overflow-y-auto px-4 py-3' : 'flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 md:px-8 md:pb-6'}>
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      {!focusMode && <MobileBottomNav maxVisible={4} />}
      {!focusMode && adhdEnabled && <QuickThoughtCapture />}
    </div>
  )
}
