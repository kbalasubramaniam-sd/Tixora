import { useState } from 'react'
import type { TicketComment } from '@/types/ticket'
import { getInitials, timeAgo } from '@/utils/format'

interface CommentsTabProps {
  comments: TicketComment[]
}

export function CommentsTab({ comments }: CommentsTabProps) {
  const [newComment, setNewComment] = useState('')

  return (
    <div className="space-y-6">
      {/* Comment Feed */}
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-on-secondary-container">{getInitials(comment.author)}</span>
          </div>
          <div className="flex-1 bg-surface-container p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-on-surface">{comment.author}</span>
                <span className="text-[10px] text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded uppercase font-bold">
                  {comment.role}
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-on-surface leading-relaxed">{comment.body}</p>
            {comment.attachment && (
              <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                <span className="material-symbols-outlined text-sm">attach_file</span>
                {comment.attachment.name} ({comment.attachment.size})
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Comment Input */}
      <div className="flex gap-4 mt-8">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white flex-shrink-0">
          <span className="material-symbols-outlined text-sm">edit</span>
        </div>
        <div className="flex-1 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full bg-surface-container-lowest border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 min-h-[100px] shadow-sm"
            placeholder="Add a comment..."
          />
          <button
            disabled={!newComment.trim()}
            className="absolute bottom-4 right-4 primary-gradient text-on-primary px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  )
}
