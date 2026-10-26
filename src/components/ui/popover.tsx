import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger

export function PopoverContent({ className, sideOffset = 4, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        className={cn('z-50 w-72 rounded-md border border-border bg-card p-4 shadow-md', className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
