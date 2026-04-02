import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/utils/cn'

export interface SearchableDropdownOption {
  label: string
  value: string
  sublabel?: string
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: string
  className?: string
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  icon = 'search',
  className,
}: SearchableDropdownProps) {
  const [inputText, setInputText] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Sync inputText when value changes externally
  useEffect(() => {
    if (!value) {
      setInputText('')
    } else {
      const found = options.find((o) => o.value === value)
      if (found) setInputText(found.label)
    }
  }, [value, options])

  // Click outside closes dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setHighlighted(-1)
        // If no value selected, clear text; if value selected, restore label
        if (!value) {
          setInputText('')
        } else {
          const found = options.find((o) => o.value === value)
          setInputText(found?.label ?? '')
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value, options])

  const filtered = inputText
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(inputText.toLowerCase()) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(inputText.toLowerCase())),
      )
    : options

  const selectOption = useCallback(
    (opt: SearchableDropdownOption) => {
      onChange(opt.value)
      setInputText(opt.label)
      setOpen(false)
      setHighlighted(-1)
    },
    [onChange],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)
    setOpen(true)
    setHighlighted(-1)
    // If user edits text after selecting, clear selection
    if (value) {
      const found = options.find((o) => o.value === value)
      if (found && e.target.value !== found.label) {
        onChange('')
      }
    }
  }

  const handleFocus = () => {
    setOpen(true)
    setHighlighted(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setOpen(true)
        return
      }
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted((prev) => Math.min(prev + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlighted >= 0 && highlighted < filtered.length) {
          selectOption(filtered[highlighted])
        }
        break
      case 'Escape':
        setOpen(false)
        setHighlighted(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlighted])

  const handleClear = () => {
    onChange('')
    setInputText('')
    setOpen(false)
    setHighlighted(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-surface-container-low border-none rounded-full py-3.5 pl-12 pr-10 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest shadow-sm transition-all duration-300 placeholder-slate-400 outline-none"
        autoComplete="off"
      />

      {/* Left icon */}
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-[20px] text-teal-600">{icon}</span>
      </div>

      {/* Right: clear button or nothing */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-error transition-colors"
          tabIndex={-1}
          aria-label="Clear selection"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-outline-variant/30 p-1.5 z-50 max-h-[280px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-on-surface-variant text-center">No results found</div>
          ) : (
            <div ref={listRef}>
              {filtered.map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => {
                    // Use mousedown to fire before blur
                    e.preventDefault()
                    selectOption(opt)
                  }}
                  onMouseEnter={() => setHighlighted(idx)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2',
                    highlighted === idx
                      ? 'bg-surface-container-low text-on-surface'
                      : 'text-on-surface-variant hover:bg-surface-container-low',
                  )}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-xs text-slate-400 ml-1">{opt.sublabel}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
