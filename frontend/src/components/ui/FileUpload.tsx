import { useRef, useState } from 'react'
import { cn } from '@/utils/cn'

interface FileUploadProps {
  label: string
  icon?: string // Material icon name, defaults to 'description'
  file: File | null
  onFileSelect: (file: File | null) => void
  accept?: string // e.g. '.pdf,.docx,.xlsx,.png,.jpg'
  maxSizeMB?: number // default 10
  showError?: boolean // only show "Missing required file" when true (e.g. after submit attempt)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  label,
  icon = 'description',
  file,
  onFileSelect,
  accept,
  maxSizeMB = 10,
  showError = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function handleUploadClick() {
    setError(null)
    inputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    if (!selected) return

    const maxBytes = maxSizeMB * 1024 * 1024
    if (selected.size > maxBytes) {
      setError(`File exceeds ${maxSizeMB} MB limit`)
      e.target.value = ''
      return
    }

    setError(null)
    onFileSelect(selected)
    e.target.value = ''
  }

  function handleRemove() {
    setError(null)
    onFileSelect(null)
  }

  return (
    <div className="flex flex-col gap-1">
      {file ? (
        // Uploaded state
        <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl group transition-all min-h-[80px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface">{label}</p>
              <p className="text-xs text-primary font-medium truncate">
                {file.name} ({formatFileSize(file.size)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            title="Remove file"
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full',
              'text-xs font-bold shrink-0 hover:bg-error/10 hover:text-error transition-colors',
            )}
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            uploaded
          </button>
        </div>
      ) : (
        // Pending state
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-all cursor-pointer min-h-[80px]"
          onClick={handleUploadClick}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-outline shadow-sm shrink-0">
              <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{label}</p>
              <p className={cn('text-xs font-medium', error ? 'text-error' : showError ? 'text-error' : 'text-outline-variant')}>
                {error ?? (showError ? 'Missing required file' : 'Click to upload')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleUploadClick()
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 bg-white text-on-surface-variant rounded-lg',
              'text-xs font-bold shadow-sm hover:text-primary transition-colors shrink-0',
            )}
          >
            <span className="material-symbols-outlined text-[16px]">upload</span>
            Upload
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
