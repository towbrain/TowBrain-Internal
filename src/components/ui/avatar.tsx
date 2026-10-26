import { cn } from '@/lib/utils'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function Avatar({
  name,
  src,
  className,
}: {
  name: string
  src?: string | null
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-medium text-accent-foreground',
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        initials(name || '?')
      )}
    </span>
  )
}
