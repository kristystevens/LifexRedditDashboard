'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw } from 'lucide-react'
import LiveDashboard from '@/components/LiveDashboard'
import MentionTagger from '@/components/MentionTagger'

interface Stats {
  countsByLabel: {
    negative: number
    neutral: number
    positive: number
  }
  averageScore: number
  totalMentions: number
  topNegative: Array<{
    id: string
    subreddit: string
    title?: string
    body?: string
    score: number
    permalink: string
  }>
}

interface Mention {
  id: string
  type: string
  subreddit: string
  author?: string
  title?: string
  body?: string
  createdUtc: string
  label: string
  score: number
  permalink: string
  manualLabel?: string
  manualScore?: number
  taggedBy?: string
  taggedAt?: string
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [mentions, setMentions] = useState<Mention[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      const [statsRes, mentionsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/mentions?limit=10')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.data)
      }

      if (mentionsRes.ok) {
        const mentionsData = await mentionsRes.json()
        setMentions(mentionsData.data.mentions)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLastUpdated(new Date())
    }
  }

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 5 minutes (300000ms)
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...')
      fetchData()
    }, 300000)
    
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleMentionTagUpdate = (mentionId: string, newLabel: string, newScore: number) => {
    setMentions(prevMentions =>
      prevMentions.map(mention =>
        mention.id === mentionId
          ? {
              ...mention,
              label: newLabel,
              score: newScore,
              manualLabel: newLabel,
              manualScore: newScore,
              taggedBy: 'user',
              taggedAt: new Date().toISOString(),
            }
          : mention
      )
    )
    
    // Refresh stats to reflect the change
    fetchData()
  }


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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading LifeX mentions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Lifex Reddit Monitor</h1>
          <p className="text-gray-600 text-lg">Real-time monitoring of Reddit mentions with sentiment analysis</p>
        </div>

        {/* Status Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-blue-900 font-medium">Bot Status:</span>
            <span className="text-blue-800">Monitoring Reddit every 5 minutes for "Lifex" and "Lifex Research" mentions</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className="text-blue-900 font-medium">Data Range:</span>
            <span className="text-blue-800">Last 1 year ({stats?.totalMentions || 0} mentions found)</span>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Mentions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalMentions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Positive</p>
                  <p className="text-3xl font-bold text-green-600">{stats.countsByLabel.positive}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Neutral</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.countsByLabel.neutral}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Negative</p>
                  <p className="text-3xl font-bold text-red-600">{stats.countsByLabel.negative}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range:</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Time</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subreddit:</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Subreddits</option>
                <option>investing</option>
                <option>biotech</option>
                <option>longevity</option>
                <option>stocks</option>
                <option>HealthInsurance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sentiment:</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Sentiments</option>
                <option>Positive</option>
                <option>Neutral</option>
                <option>Negative</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Comments:</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Any</option>
                <option>1+</option>
                <option>5+</option>
                <option>10+</option>
                <option>25+</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Live Dashboard */}
        <LiveDashboard />

        {/* All Lifex Mentions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Lifex Mentions</h2>
            <p className="text-sm text-gray-500 mt-1">Showing {mentions.length} mentions</p>
          </div>
          <div className="divide-y divide-gray-200">
            {mentions.map((mention) => (
              <div key={mention.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
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
                      <span className="text-gray-500 text-sm">
                        {new Date(mention.createdUtc).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </span>
                      <MentionTagger
                        mentionId={mention.id}
                        currentLabel={mention.label}
                        currentScore={mention.score}
                        isManuallyTagged={!!mention.manualLabel}
                        onTagUpdate={(newLabel, newScore) => 
                          handleMentionTagUpdate(mention.id, newLabel, newScore)
                        }
                      />
        </div>
        <a
                      href={`https://reddit.com${mention.permalink}`}
          target="_blank"
          rel="noopener noreferrer"
                      className="block hover:bg-gray-50 p-2 -m-2 rounded"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
                        {mention.title || 'Comment'}
                      </h3>
                      <p className="text-gray-700 mb-3">
                        {mention.body?.substring(0, 200) + (mention.body && mention.body.length > 200 ? '...' : '')}
                      </p>
                    </a>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Score: {mention.score}</span>
                      <span>Comments: 0</span>
                      <span className="capitalize">{mention.type}</span>
                      {mention.manualLabel && (
                        <span className="text-blue-600 text-xs font-medium">Manually tagged</span>
                      )}
                      <a
                        href={`https://reddit.com${mention.permalink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View on Reddit →
                      </a>
                    </div>
                  </div>
                  <a
                    href={`https://reddit.com${mention.permalink}`}
          target="_blank"
          rel="noopener noreferrer"
                    className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                    title="Open in Reddit"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
