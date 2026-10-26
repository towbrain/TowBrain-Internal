import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Kanban, Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-4 flex items-center justify-between px-2">
        <span className="text-lg font-semibold text-foreground">CRM</span>
        {onNavigate && (
          <button onClick={onNavigate} className="rounded-sm p-1 hover:bg-accent md:hidden" aria-label="Close menu">
            <X className="size-5" />
          </button>
        )}
      </div>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              isActive && 'bg-accent text-accent-foreground',
            )
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
