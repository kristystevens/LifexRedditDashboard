'use client'

import { useState, useEffect } from 'react'
import { Filter, X, Calendar, MessageSquare, Hash } from 'lucide-react'

interface MentionFiltersProps {
  onFiltersChange: (filters: {
    subreddit: string
    sentiment: string
    sortBy: string
    showIgnored: boolean
    showUrgent: boolean
    minComments: number
  }) => void
  availableSubreddits: string[]
  totalMentions: number
  activeMentions: number
}

export default function MentionFilters({
  onFiltersChange,
  availableSubreddits,
  totalMentions,
  activeMentions
}: MentionFiltersProps) {
  const [filters, setFilters] = useState({
    subreddit: '',
    sentiment: '',
    sortBy: 'newest',
    showIgnored: false,
    showUrgent: false,
    minComments: 0
  })

  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  useEffect(() => {
    const hasFilters = 
      filters.subreddit !== '' ||
      filters.sentiment !== '' ||
      filters.sortBy !== 'newest' ||
      filters.showIgnored ||
      filters.showUrgent ||
      filters.minComments > 0

    setHasActiveFilters(hasFilters)
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }


  const clearAllFilters = () => {
    setFilters({
      subreddit: '',
      sentiment: '',
      sortBy: 'newest',
      showIgnored: false,
      showUrgent: false,
      minComments: 0
    })
  }

  const getFilterCount = () => {
    let count = 0
    if (filters.subreddit) count++
    if (filters.sentiment) count++
    if (filters.sortBy !== 'newest') count++
    if (filters.showIgnored) count++
    if (filters.showUrgent) count++
    if (filters.minComments > 0) count++
    return count
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {getFilterCount()}
                </span>
              )}
            </div>
            
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>

          <div className="text-sm text-gray-500">
            Showing {activeMentions} of {totalMentions} mentions
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Subreddit Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Subreddit
            </label>
            <select
              value={filters.subreddit}
              onChange={(e) => handleFilterChange('subreddit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All subreddits</option>
              {availableSubreddits.map(subreddit => (
                <option key={subreddit} value={subreddit}>
                  r/{subreddit}
                </option>
              ))}
            </select>
          </div>

          {/* Sentiment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sentiment
            </label>
            <select
              value={filters.sentiment}
              onChange={(e) => handleFilterChange('sentiment', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          {/* Comments Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Min Comments
            </label>
            <input
              type="number"
              min="0"
              value={filters.minComments}
              onChange={(e) => handleFilterChange('minComments', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        {/* Sort Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest to Oldest</option>
            <option value="oldest">Oldest to Newest</option>
            <option value="score-high">Highest Score First</option>
            <option value="score-low">Lowest Score First</option>
          </select>
        </div>

        {/* Urgent Filter */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.showUrgent}
              onChange={(e) => handleFilterChange('showUrgent', e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Show only urgent mentions
            </span>
          </label>
        </div>

        {/* Ignored Filter */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.showIgnored}
              onChange={(e) => handleFilterChange('showIgnored', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Show ignored mentions
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}