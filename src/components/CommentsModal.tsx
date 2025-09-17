'use client'

import { useState, useEffect } from 'react'
import { X, MessageCircle, User, Clock, ArrowUp, ArrowDown } from 'lucide-react'

interface Comment {
  id: string
  author: string
  body: string
  score: number
  created_utc: number
  permalink: string
  replies: Comment[]
}

interface Post {
  id: string
  title: string
  author: string
  selftext: string
  score: number
  num_comments: number
  created_utc: number
  subreddit: string
  permalink: string
}

interface CommentsData {
  post: Post
  comments: Comment[]
  totalComments: number
}

interface CommentsModalProps {
  isOpen: boolean
  onClose: () => void
  permalink: string
}

export default function CommentsModal({ isOpen, onClose, permalink }: CommentsModalProps) {
  const [commentsData, setCommentsData] = useState<CommentsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && permalink) {
      fetchComments()
    }
  }, [isOpen, permalink])

  const fetchComments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/reddit-comments?permalink=${encodeURIComponent(permalink)}`)
      const result = await response.json()
      
      if (result.success) {
        setCommentsData(result.data)
      } else {
        setError(result.error || 'Failed to fetch comments')
      }
    } catch (err) {
      setError('Error fetching comments')
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString()
  }

  const formatScore = (score: number) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`
    }
    return score.toString()
  }

  const renderComment = (comment: Comment, depth = 0) => {
    if (!comment.body || comment.body === '[deleted]' || comment.body === '[removed]') {
      return null
    }

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="bg-white rounded-lg p-4 mb-3 shadow-sm border">
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span className="font-medium">u/{comment.author}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              {comment.score >= 0 ? (
                <ArrowUp className="w-3 h-3 text-green-600" />
              ) : (
                <ArrowDown className="w-3 h-3 text-red-600" />
              )}
              <span>{formatScore(comment.score)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(comment.created_utc)}</span>
            </div>
          </div>
          
          <div className="text-gray-800 whitespace-pre-wrap">
            {comment.body}
          </div>
        </div>
        
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Reddit Comments</h2>
            {commentsData && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                {commentsData.totalComments} comments
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading comments...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-medium">Error loading comments</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={fetchComments}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {commentsData && !loading && (
            <div className="space-y-6">
              {/* Post Info */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-semibold text-lg mb-2">{commentsData.post.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>u/{commentsData.post.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowUp className="w-4 h-4 text-green-600" />
                    <span>{formatScore(commentsData.post.score)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{commentsData.post.num_comments} comments</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(commentsData.post.created_utc)}</span>
                  </div>
                </div>
                {commentsData.post.selftext && (
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {commentsData.post.selftext}
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Comments</h4>
                {commentsData.comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No comments found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commentsData.comments.map(comment => renderComment(comment))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
