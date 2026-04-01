import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type ChipVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant
}

const variantStyles: Record<ChipVariant, string> = {
  default: 'bg-secondary-container text-on-secondary-container',
  success: 'bg-success-container text-success',
  warning: 'bg-warning-container text-warning',
  error: 'bg-error-container text-error',
  info: 'bg-secondary-container text-on-secondary-container',
}

export function Chip({ variant = 'default', className, children, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
