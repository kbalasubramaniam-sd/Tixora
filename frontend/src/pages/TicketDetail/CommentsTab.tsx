import { useState } from 'react'
import { useComments, usePostComment } from '@/api/hooks/useTickets'
import { getInitials, timeAgo } from '@/utils/format'

interface CommentsTabProps {
  ticketId: string
}

export function CommentsTab({ ticketId }: CommentsTabProps) {
  const { data: comments = [], isLoading } = useComments(ticketId)
  const postMutation = usePostComment(ticketId)
  const [newComment, setNewComment] = useState('')

  const handlePost = () => {
    if (!newComment.trim()) return
    postMutation.mutate(newComment.trim(), {
      onSuccess: () => setNewComment(''),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-surface-container-low rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comment Feed */}
      {comments.length === 0 && (
        <p className="text-sm text-on-surface-variant italic py-4">No comments yet.</p>
      )}
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-on-secondary-container">{getInitials(comment.authorName)}</span>
          </div>
          <div className="flex-1 bg-surface-container p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-on-surface">{comment.authorName}</span>
                <span className="text-[10px] text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded uppercase font-bold">
                  {comment.authorRole}
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-on-surface leading-relaxed">{comment.content}</p>
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
            maxLength={2000}
          />
          <button
            onClick={handlePost}
            disabled={!newComment.trim() || postMutation.isPending}
            className="absolute bottom-4 right-4 primary-gradient text-on-primary px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {postMutation.isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>
    </div>
  )
}
