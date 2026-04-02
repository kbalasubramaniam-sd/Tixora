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
        // Uploaded state — Stitch card style
        <div className="bg-surface-container-lowest p-6 rounded-xl border-2 border-primary/20 min-h-[160px] flex flex-col">
          <div className="mb-4 flex justify-between items-start">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            <span
              className="material-symbols-outlined text-primary text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h3 className="font-bold mb-1 text-on-surface">{label}</h3>
          <p className="text-xs text-primary font-medium truncate mb-6">{file.name} ({formatFileSize(file.size)})</p>
          <button
            type="button"
            onClick={handleRemove}
            title="Remove file"
            className="w-full py-3 bg-error-container/20 text-error text-sm font-bold rounded-lg hover:bg-error-container/40 transition-colors flex items-center justify-center gap-2 mt-auto"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Remove
          </button>
        </div>
      ) : (
        // Pending state — Stitch card style
        <div className="bg-surface-container-lowest p-6 rounded-xl group transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer min-h-[160px] flex flex-col">
          <div className="mb-6 flex justify-between items-start">
            <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">{icon}</span>
            <span className="material-symbols-outlined text-error text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
          </div>
          <h3 className="font-bold mb-1 text-on-surface">{label}</h3>
          <p className={cn('text-xs mb-6 leading-relaxed', error ? 'text-error' : showError ? 'text-error' : 'text-on-surface-variant')}>
            {error ?? (showError ? 'Missing required file' : 'Click to upload file')}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleUploadClick()
            }}
            className="w-full py-3 bg-surface-container-low text-on-surface text-sm font-bold rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 mt-auto"
          >
            <span className="material-symbols-outlined text-sm">upload</span>
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
