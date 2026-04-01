import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type CardSurface = 'lowest' | 'low' | 'base' | 'highest'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface
  children: ReactNode
}

const surfaceStyles: Record<CardSurface, string> = {
  lowest: 'bg-surface-container-lowest',
  low: 'bg-surface-container-low',
  base: 'bg-surface',
  highest: 'bg-surface-container-highest',
}

export function Card({ surface = 'lowest', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg p-5', surfaceStyles[surface], className)}
      {...props}
    >
      {children}
    </div>
  )
}
