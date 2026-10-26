import { useNavigate } from 'react-router-dom'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Menu, Search, LogOut, UserCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/domain'

export function Topbar({
  title,
  profile,
  onMenuClick,
  actions,
}: {
  title: string
  profile: Profile | null
  onMenuClick: () => void
  actions?: ReactNode
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    navigate(`/leads?search=${encodeURIComponent(search)}`)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="rounded-sm p-1 hover:bg-accent md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <form onSubmit={handleSearch} className="hidden max-w-sm flex-1 md:block">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads…"
            className="pl-8"
            aria-label="Search leads"
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        {actions}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 hover:bg-accent focus-visible:outline-none">
            <Avatar name={profile?.full_name ?? '?'} src={profile?.avatar_url} />
            <span className="hidden text-sm font-medium text-foreground sm:inline">
              {profile?.full_name ?? 'Loading…'}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{profile?.full_name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/settings')}>
              <UserCircle className="size-4" /> My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
