'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, ChevronDown, ChevronUp, ExternalLink, User } from 'lucide-react'

interface Comment {
  id: string
  author: string
  body: string
  score: number
  createdUtc: string
  permalink: string
  replies?: Comment[]
}

interface CommentsDropdownProps {
  mentionId: string
  isPost: boolean
  numComments?: number
}

export default function CommentsDropdown({ mentionId, isPost, numComments = 0 }: CommentsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchComments = async () => {
    if (!isPost || comments.length > 0) return // Only fetch for posts and only once
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/mentions/${mentionId}/comments`)
      const data = await response.json()
      
      if (data.success) {
        setComments(data.data.comments)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch comments')
      }
    } catch (err) {
      setError('Failed to fetch comments')
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (!isOpen && comments.length === 0) {
      fetchComments()
    }
    setIsOpen(!isOpen)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const highlightMentions = (text: string) => {
    if (!text) return text
    return text.replace(
      /\b(lifex|lifex research)\b/gi,
      '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
    )
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-3 mb-2">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <User className="w-3 h-3" />
          <a
            href={`https://reddit.com/u/${comment.author}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 font-medium"
          >
            u/{comment.author}
          </a>
          <span>•</span>
          <span>{comment.score} points</span>
          <span>•</span>
          <span>{formatDate(comment.createdUtc)}</span>
          <a
            href={`https://reddit.com${comment.permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto hover:text-blue-600"
            title="View on Reddit"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div 
          className="text-sm text-gray-800"
          dangerouslySetInnerHTML={{
            __html: highlightMentions(comment.body)
          }}
        />
      </div>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  )

  if (!isPost) {
    return null // Don't show comments dropdown for comment mentions
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
      >
        <MessageSquare className="w-4 h-4" />
        <span>
          {loading ? 'Loading...' : `${numComments} comment${numComments !== 1 ? 's' : ''}`}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {isOpen && (
        <div className="mt-3 border border-gray-200 rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
          {error ? (
            <div className="text-red-600 text-sm">
              <div className="mb-2">
                Unable to load comments: {error}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setError(null)
                    setRetryCount(prev => prev + 1)
                    fetchComments()
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                >
                  Retry
                </button>
                <a
                  href={`https://reddit.com${mentionId.replace('t3_', '/comments/')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                >
                  View on Reddit
                </a>
              </div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-gray-500 text-sm">
              No comments found or comments are disabled for this post.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-3">
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </div>
              {comments.map(comment => renderComment(comment))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
