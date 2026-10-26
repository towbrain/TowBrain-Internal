import { useState, type ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/auth/useAuth'
import { useTheme } from '@/hooks/useTheme'

export function AppLayout({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const { profile } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  useTheme(profile?.preferences.theme)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-60 bg-card shadow-lg">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} profile={profile} onMenuClick={() => setMobileOpen(true)} actions={actions} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
