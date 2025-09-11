'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, ExternalLink, Activity, Clock } from 'lucide-react'

interface LiveMention {
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
}

interface LiveStats {
  negative: number
  neutral: number
  positive: number
}

interface LiveData {
  mentions: LiveMention[]
  stats: LiveStats
  timestamp: string
}

export default function LiveDashboard() {
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [isLive, setIsLive] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected')

  const fetchLiveData = async () => {
    try {
      const response = await fetch('/api/live')
      if (response.ok) {
        const data = await response.json()
        setLiveData(data.data)
        setLastUpdate(new Date())
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Error fetching live data:', error)
      setConnectionStatus('disconnected')
    }
  }

  const triggerIngestion = async () => {
    try {
      setConnectionStatus('connected')
      const response = await fetch('/api/ingest/trigger', { method: 'POST' })
      if (response.ok) {
        const result = await response.json()
        console.log('Ingestion result:', result)
        // Refresh data after ingestion
        setTimeout(fetchLiveData, 2000)
      }
    } catch (error) {
      console.error('Error triggering ingestion:', error)
      setConnectionStatus('error')
    }
  }

  useEffect(() => {
    if (!isLive) return

    // Fetch immediately
    fetchLiveData()

    // Then fetch every 30 seconds for real-time updates
    const interval = setInterval(fetchLiveData, 30000)

    return () => clearInterval(interval)
  }, [isLive])

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 bg-green-100'
      case 'disconnected':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Live Status Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getConnectionStatusColor()}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Data Feed</h2>
              <p className="text-sm text-gray-600">
                {isLive ? 'Real-time monitoring active' : 'Live monitoring paused'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={triggerIngestion}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                Fetch Live Data
              </button>
              <button
                onClick={fetchLiveData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Refresh
              </button>
              <button
                onClick={() => setIsLive(!isLive)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isLive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLive ? 'Pause Live' : 'Start Live'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      {liveData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Negative</p>
                <p className="text-2xl font-bold text-red-600">{liveData.stats.negative}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Minus className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Neutral</p>
                <p className="text-2xl font-bold text-gray-600">{liveData.stats.neutral}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Positive</p>
                <p className="text-2xl font-bold text-green-600">{liveData.stats.positive}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Mentions Feed */}
      {liveData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Live Mentions Feed</h3>
            <p className="text-sm text-gray-600">Latest mentions as they're discovered</p>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {liveData.mentions.slice(0, 10).map((mention) => (
              <div key={mention.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">r/{mention.subreddit}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSentimentColor(mention.label)}`}>
                        {mention.label}
                      </span>
                      <span className="text-sm text-gray-500">Score: {mention.score}/100</span>
                      <span className="text-xs text-gray-400">
                        {new Date(mention.createdUtc).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {mention.title || mention.body?.substring(0, 100) + '...'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      by {mention.author}
                    </p>
                  </div>
                  <a
                    href={`https://reddit.com${mention.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
