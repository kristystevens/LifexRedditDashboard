'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, MessageCircle, User, Clock, ArrowUp, ArrowDown, ExternalLink, Loader2, Minus } from 'lucide-react'

interface Comment {
  id: string
  author: string
  body: string
  score: number
  created_utc: number
  permalink: string
  isTracked?: boolean
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
  trackedUsernames?: string[]
}

interface CommentsDropdownProps {
  permalink: string
  numComments: number
}

export default function CommentsDropdown({ permalink, numComments }: CommentsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [commentsData, setCommentsData] = useState<CommentsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleToggle = () => {
    if (!isOpen && !commentsData && !loading) {
      fetchComments()
    }
    setIsOpen(!isOpen)
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

    const isPositive = comment.score > 0
    const isNegative = comment.score < 0
    const isTracked = comment.isTracked

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-3 border-gray-300 pl-6' : ''}`}>
        <div className={`${isTracked 
          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-lg' 
          : 'bg-white border border-gray-200 shadow-sm hover:shadow-lg'
        } rounded-xl p-5 transition-all duration-200`}>
          {/* Comment Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isTracked ? 'bg-yellow-100 ring-2 ring-yellow-400' :
                isPositive ? 'bg-green-100' : isNegative ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <User className={`w-5 h-5 ${
                  isTracked ? 'text-yellow-600' :
                  isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
                }`} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className={`font-bold text-base ${
                  isTracked ? 'text-yellow-800' : 'text-gray-900'
                }`}>u/{comment.author}</span>
                {isTracked && (
                  <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                    TRACKED ACCOUNT
                  </span>
                )}
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  isPositive ? 'bg-green-100 text-green-700' : 
                  isNegative ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {isPositive ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : isNegative ? (
                    <ArrowDown className="w-4 h-4" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                  <span>{formatScore(comment.score)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{formatTime(comment.created_utc)}</span>
              </div>
        </div>
      </div>
      
          {/* Comment Body */}
          <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
            {comment.body.length > 500 ? (
              <div>
                {comment.body.substring(0, 500)}
                <span className="text-gray-500 font-medium">... (click "View on Reddit" to read more)</span>
              </div>
            ) : (
              comment.body
            )}
        </div>
      </div>
      
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && depth < 2 && (
          <div className="mt-4 space-y-4">
            {comment.replies.slice(0, 3).map(reply => renderComment(reply, depth + 1))}
            {comment.replies.length > 3 && (
              <div className="ml-8 pl-6 border-l-3 border-gray-300">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 text-center border border-gray-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MessageCircle className="w-5 h-5 text-gray-600" />
                    <p className="text-base text-gray-700 font-semibold">
                      +{comment.replies.length - 3} more replies
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Click "View on Reddit" to see the full discussion
                  </p>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  )
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg transition-all duration-200 text-sm font-medium border border-blue-200 hover:border-blue-300"
      >
        <MessageCircle className="w-4 h-4" />
        <span>{numComments}</span>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl w-[800px] max-h-[600px] overflow-hidden">
          <div className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Reddit Thread Comments</h3>
                    <p className="text-sm text-gray-600">Live comments from Reddit</p>
                  </div>
              </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="mt-6 text-base text-gray-700 font-semibold">Loading comments from Reddit...</p>
                  <p className="text-sm text-gray-500 mt-2">Fetching the latest discussion</p>
                </div>
              )}

              {error && (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-800 text-lg mb-2">Unable to load comments</h4>
                        <p className="text-red-700 mb-4">{error}</p>
                        <button
                          onClick={fetchComments}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {commentsData && !loading && (
                <div className="p-6 space-y-6">
                  {/* Post Info Card */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-lg leading-tight mb-3">
                          {commentsData.post.title}
                        </h4>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-semibold">u/{commentsData.post.author}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowUp className="w-4 h-4 text-green-600" />
                            <span className="font-semibold">{formatScore(commentsData.post.score)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span className="font-semibold">{commentsData.post.num_comments} comments</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-semibold">{formatTime(commentsData.post.created_utc)}</span>
                          </div>
                        </div>
                        {commentsData.post.selftext && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {commentsData.post.selftext.length > 200 
                                ? `${commentsData.post.selftext.substring(0, 200)}...` 
                                : commentsData.post.selftext
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                          {/* Tracked Comments Section */}
                          {commentsData.comments.some(comment => comment.isTracked) && (
                            <div className="space-y-4">
                              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-yellow-600" />
                                  </div>
                                  <h5 className="font-bold text-yellow-800 text-lg">Tracked Account Comments</h5>
                                </div>
                                <p className="text-yellow-700 text-sm mb-4">
                                  Comments from your monitored Reddit accounts are highlighted below
                                </p>
                                <div className="space-y-3">
                                  {commentsData.comments
                                    .filter(comment => comment.isTracked)
                                    .map(comment => renderComment(comment))}
                                </div>
              </div>
            </div>
                          )}

                          {/* Comments Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-gray-900 text-lg">All Discussion Comments</h5>
                              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                                {commentsData.totalComments} total comments
                              </span>
                            </div>
                    
                    {commentsData.comments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-600 text-lg font-semibold">No comments found</p>
                        <p className="text-gray-500 text-sm mt-2">This thread might be new or locked</p>
            </div>
          ) : (
                              <div className="space-y-4">
                                {commentsData.comments
                                  .filter(comment => !comment.isTracked)
                                  .slice(0, 8)
                                  .map(comment => renderComment(comment))}
                        
                        {commentsData.comments.length > 8 && (
                          <div className="pt-4 border-t border-gray-200">
                            <a
                              href={permalink.startsWith('http') ? permalink : `https://reddit.com${permalink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-colors"
                            >
                              <ExternalLink className="w-5 h-5" />
                              View all {commentsData.totalComments} comments on Reddit
                            </a>
            </div>
          )}
                      </div>
                    )}
                  </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
