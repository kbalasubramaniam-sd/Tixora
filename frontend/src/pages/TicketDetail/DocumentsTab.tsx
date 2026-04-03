import { useRef, useMemo } from 'react'
import { useDocuments, useUploadDocument } from '@/api/hooks/useTickets'
import { getDocumentDownloadUrl } from '@/api/endpoints/tickets'
import type { DocumentResponse } from '@/api/endpoints/tickets'

interface DocumentsTabProps {
  ticketId: string
  /** Render as an inline card instead of tab content */
  inline?: boolean
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsTab({ ticketId, inline = false }: DocumentsTabProps) {
  const { data: documents = [], isLoading } = useDocuments(ticketId)
  const uploadMutation = useUploadDocument(ticketId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate({ file, documentType: 'Other' })
      e.target.value = ''
    }
  }

  // Group documents by uploader (name + role) — must be before any early returns
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; role: string; docs: DocumentResponse[] }>()
    for (const doc of documents) {
      const key = `${doc.uploadedBy}|${doc.uploadedByRole}`
      if (!map.has(key)) map.set(key, { name: doc.uploadedBy, role: doc.uploadedByRole, docs: [] })
      map.get(key)!.docs.push(doc)
    }
    return Array.from(map.values())
  }, [documents])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-surface-container-low rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  // Don't render inline card if no documents and no upload needed
  if (inline && documents.length === 0 && !uploadMutation.isPending) return null

  function renderDocCard(doc: DocumentResponse) {
    return (
      <div key={doc.id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary">description</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-on-surface truncate">{doc.fileName}</p>
          <p className="text-[10px] text-on-surface-variant">
            {formatSize(doc.sizeBytes)} · {formatDate(doc.uploadedAt)}
            {doc.documentType !== 'Other' && ` · ${doc.documentType}`}
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
    )
  }

  const formatRole = (role: string) => role.replace(/([A-Z])/g, ' $1').trim()

  const content = (
    <>
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

      {/* Document list grouped by uploader */}
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">folder_open</span>
          <p className="text-sm text-on-surface-variant">No documents uploaded</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={`${group.name}|${group.role}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {group.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <span className="text-sm font-bold text-on-surface">{group.name}</span>
                <span className="text-[10px] font-medium text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full">
                  {formatRole(group.role)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.docs.map(renderDocCard)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )

  if (inline) {
    return (
      <div className="bg-surface-container-lowest p-8 rounded-xl custom-shadow space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">attach_file</span>
          <h3 className="text-xl font-extrabold text-on-surface">Documents</h3>
          {documents.length > 0 && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {documents.length}
            </span>
          )}
        </div>
        {content}
      </div>
    )
  }

  return <div className="space-y-4">{content}</div>
}
