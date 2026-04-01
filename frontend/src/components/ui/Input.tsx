import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  endAdornment?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, endAdornment, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-on-surface-variant">
            {label}
            {props.required && <span className="text-primary-container ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-12 w-full px-4 rounded-lg bg-surface-container-lowest text-sm text-on-surface',
              'placeholder:text-on-surface-variant/50 outline-none transition-shadow',
              'focus-glow',
              error && 'shadow-[inset_0_-2px_0_0_rgba(211,47,47,0.6)]',
              endAdornment && 'pr-12',
              className,
            )}
            {...props}
          />
          {endAdornment && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {endAdornment}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-[0.6875rem] text-on-surface-variant/70">{helperText}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
