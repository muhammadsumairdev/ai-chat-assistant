import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Toaster } from 'sonner'
import { useStore } from '@/lib/store'
import { Sidebar } from '@/components/Sidebar'
import { ChatView } from '@/components/ChatView'
import { SettingsModal } from '@/components/SettingsModal'

const isDesktop = () => window.matchMedia('(min-width: 768px)').matches

function App() {
  const init = useStore((s) => s.init)
  const theme = useStore((s) => s.settings.theme)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    void init()
  }, [init])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
  }, [theme])

  const openNav = () => (isDesktop() ? setSidebarOpen(true) : setMobileOpen(true))
  const closeNav = () => {
    setSidebarOpen(false)
    setMobileOpen(false)
  }

  const sidebar = (
    <Sidebar
      onClose={closeNav}
      onOpenSettings={() => setSettingsOpen(true)}
      onNavigate={() => setMobileOpen(false)}
    />
  )

  return (
    <div className="flex h-full overflow-hidden bg-bg text-text">
      {/* Desktop sidebar — collapsible */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="hidden shrink-0 overflow-hidden border-r border-border md:block"
          >
            <div className="h-full w-[280px]">{sidebar}</div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 w-[280px] border-r border-border bg-surface"
            >
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="flex min-w-0 flex-1 flex-col">
        <ChatView
          sidebarOpen={sidebarOpen}
          onOpenNav={openNav}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <Toaster
        theme={theme}
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text)',
          },
        }}
      />
    </div>
  )
}

export default App
