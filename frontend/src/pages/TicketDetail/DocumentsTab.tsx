import { useRef } from 'react'
import { useDocuments, useUploadDocument } from '@/api/hooks/useTickets'
import { getDocumentDownloadUrl } from '@/api/endpoints/tickets'

interface DocumentsTabProps {
  ticketId: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsTab({ ticketId }: DocumentsTabProps) {
  const { data: documents = [], isLoading } = useDocuments(ticketId)
  const uploadMutation = useUploadDocument(ticketId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
      e.target.value = ''
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-surface-container-low rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex justify-end">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 primary-gradient text-on-primary rounded-lg text-xs font-bold disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">upload_file</span>
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">folder_open</span>
          <p className="text-sm text-on-surface-variant">No documents uploaded</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">description</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">{doc.fileName}</p>
                <p className="text-[10px] text-on-surface-variant">
                  {formatSize(doc.sizeBytes)} · {doc.uploadedBy} · {formatDate(doc.uploadedAt)}
                </p>
              </div>
              <a
                href={getDocumentDownloadUrl(doc.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <span className="material-symbols-outlined">download</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
