import type { TicketDocument } from '@/types/ticket'

interface DocumentsTabProps {
  documents: TicketDocument[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function DocumentsTab({ documents }: DocumentsTabProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">folder_open</span>
        <p className="text-sm text-on-surface-variant">No documents uploaded</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary">description</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{doc.name}</p>
            <p className="text-[10px] text-on-surface-variant">
              {doc.size} · {doc.uploadedBy} · {formatDate(doc.uploadedAt)}
            </p>
          </div>
          <button className="text-primary hover:text-primary/80 transition-colors">
            <span className="material-symbols-outlined">download</span>
          </button>
        </div>
      ))}
    </div>
  )
}
