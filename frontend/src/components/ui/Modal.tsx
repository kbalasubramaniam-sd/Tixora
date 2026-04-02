import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onOpenChange, title, description, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-[100] transition-opacity duration-200" />
        <Dialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]',
            'bg-white rounded-3xl p-8 shadow-ambient',
            'w-full max-w-md max-h-[85vh] overflow-y-auto',
            'transition-all duration-200',
            className,
          )}
        >
          <Dialog.Title className="text-lg font-extrabold text-on-surface">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="text-sm text-on-surface-variant mt-1">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-6">{children}</div>
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
