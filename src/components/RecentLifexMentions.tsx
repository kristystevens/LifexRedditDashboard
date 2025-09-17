'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Clock, MessageCircle, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'

interface LifexMention {
  id: string
  type: 'post' | 'comment'
  subreddit: string
  permalink: string
  author: string
  title?: string
  body?: string
  createdUtc: string
  label: 'negative' | 'neutral' | 'positive'
  confidence: number
  score: number
  ignored?: boolean
  urgent?: boolean
  numComments?: number
  keywordsMatched?: string[]
  ingestedAt?: string
}

interface LifexStats {
  totalRecent: number
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
  urgent: number
  posts: number
  comments: number
  topSubreddits: Array<{ subreddit: string; count: number }>
  timeRange: string
}

interface LifexData {
  mentions: LifexMention[]
  stats: LifexStats
  lastUpdated: string
}

export default function RecentLifexMentions() {
  const [data, setData] = useState<LifexData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'3d' | '7d' | '14d'>('7d')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const days = timeRange === '3d' ? 3 : timeRange === '7d' ? 7 : 14
      const response = await fetch(`/api/lifes-mentions?days=${days}&limit=15`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch recent mentions')
      }
    } catch (err) {
      setError('Failed to fetch recent mentions')
      console.error('Error fetching lifes mentions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'text-green-600 bg-green-50'
      case 'negative':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const highlightLifex = (text: string) => {
    if (!text) return text
    
    const lifexPattern = /\b(lifex|lifes)\b/gi
    return text.replace(lifexPattern, '<mark class="bg-yellow-200 px-1 rounded font-medium">$1</mark>')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading recent Lifex mentions...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Error Loading Recent Mentions</h3>
          <p className="text-red-600 mb-3">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data || data.mentions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Lifex Mentions</h3>
          <p className="text-gray-600">No mentions found in the past {timeRange}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Lifex Mentions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Latest mentions from the past {timeRange} • {data.stats.totalRecent} total
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['3d', '7d', '14d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Positive</span>
            </div>
            <p className="text-lg font-bold text-blue-600 mt-1">{data.stats.sentiment.positive}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Neutral</span>
            </div>
            <p className="text-lg font-bold text-gray-600 mt-1">{data.stats.sentiment.neutral}</p>
          </div>
          
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Negative</span>
            </div>
            <p className="text-lg font-bold text-red-600 mt-1">{data.stats.sentiment.negative}</p>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Urgent</span>
            </div>
            <p className="text-lg font-bold text-orange-600 mt-1">{data.stats.urgent}</p>
          </div>
        </div>
      </div>

      {/* Mentions List */}
      <div className="divide-y divide-gray-200">
        {data.mentions.map((mention) => (
          <div key={mention.id} className={`p-6 transition-all duration-200 ${
            mention.urgent 
              ? 'bg-orange-50 border-l-4 border-orange-400 hover:bg-orange-100' 
              : 'hover:bg-gray-50'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {mention.urgent && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      URGENT
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSentimentColor(mention.label)}`}>
                    {mention.label}
                  </span>
                  <a
                    href={`https://reddit.com/r/${mention.subreddit}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    r/{mention.subreddit}
                  </a>
                  <span className="text-gray-500"> by </span>
                  <a
                    href={`https://reddit.com/u/${mention.author}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    u/{mention.author}
                  </a>
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(mention.createdUtc)}
                  </div>
                </div>
                
                <a
                  href={mention.permalink.startsWith('http') ? mention.permalink : `https://reddit.com${mention.permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:bg-gray-50 p-2 -m-2 rounded"
                >
                  <h3 
                    className="text-lg font-semibold mb-2 hover:text-blue-600 text-gray-900"
                    dangerouslySetInnerHTML={{
                      __html: highlightLifex(mention.title || 'Comment')
                    }}
                  />
                  {mention.body && (
                    <p 
                      className="mb-3 text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: highlightLifex(
                          mention.body.substring(0, 200) + (mention.body.length > 200 ? '...' : '')
                        )
                      }}
                    />
                  )}
                </a>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Score: {mention.score}</span>
                  {mention.numComments && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {mention.numComments} comments
                    </div>
                  )}
                  <span className="capitalize">{mention.type}</span>
                  <span>Confidence: {Math.round(mention.confidence * 100)}%</span>
                  <a
                    href={mention.permalink.startsWith('http') ? mention.permalink : `https://reddit.com${mention.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View on Reddit →
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <a
                  href={mention.permalink.startsWith('http') ? mention.permalink : `https://reddit.com${mention.permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Open in Reddit"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
