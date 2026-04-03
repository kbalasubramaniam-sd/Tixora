import { cn } from '@/utils/cn'

interface FileUploadProps {
  label: string
  icon?: string
  file: File | null
  onUploadClick: () => void
  onRemove: () => void
  error?: string | null
  showError?: boolean
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
  onUploadClick,
  onRemove,
  error,
  showError = false,
}: FileUploadProps) {
  return (
    <div className="flex flex-col gap-1">
      {file ? (
        <div className="bg-surface-container-lowest p-6 rounded-xl border-2 border-primary/20 min-h-[160px] flex flex-col">
          <div className="mb-4 flex justify-between items-start">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h3 className="font-bold mb-1 text-on-surface">{label}</h3>
          <p className="text-xs text-primary font-medium truncate mb-6">{file.name} ({formatFileSize(file.size)})</p>
          <button
            type="button"
            onClick={onRemove}
            title="Remove file"
            className="w-full py-3 bg-error-container/20 text-error text-sm font-bold rounded-lg hover:bg-error-container/40 transition-colors flex items-center justify-center gap-2 mt-auto"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Remove
          </button>
        </div>
      ) : (
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
              onUploadClick()
            }}
            className="w-full py-3 bg-surface-container-low text-on-surface text-sm font-bold rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 mt-auto"
          >
            <span className="material-symbols-outlined text-sm">upload</span>
            Upload
          </button>
        </div>
      )}
    </div>
  )
}
