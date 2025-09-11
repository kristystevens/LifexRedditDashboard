'use client'

import { useState } from 'react'
import { Tag, Check, X, RotateCcw, Filter, FilterX } from 'lucide-react'

interface MentionTaggerProps {
  mentionId: string
  currentLabel: string
  currentScore: number
  isManuallyTagged: boolean
  isIgnored: boolean
  onTagUpdate: (newLabel: string, newScore: number) => void
  onIgnoreToggle: (isIgnored: boolean) => void
}

export default function MentionTagger({
  mentionId,
  currentLabel,
  currentScore,
  isManuallyTagged,
  isIgnored,
  onTagUpdate,
  onIgnoreToggle,
}: MentionTaggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleTag = async (label: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/mentions/${mentionId}/tag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label,
          taggedBy: 'user',
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const newScore = result.data.manualScore
        onTagUpdate(label, newScore)
        setIsOpen(false)
      } else {
        console.error('Failed to tag mention')
      }
    } catch (error) {
      console.error('Error tagging mention:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveTag = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/mentions/${mentionId}/tag`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        onTagUpdate(result.data.label, result.data.score)
        setIsOpen(false)
      } else {
        console.error('Failed to remove tag')
      }
    } catch (error) {
      console.error('Error removing tag:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIgnoreToggle = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/mentions/${mentionId}/ignore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ignored: !isIgnored,
        }),
      })

      if (response.ok) {
        onIgnoreToggle(!isIgnored)
      } else {
        console.error('Failed to toggle ignore')
      }
    } catch (error) {
      console.error('Error toggling ignore:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200'
    }
  }

  const getLabelIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return <Check className="w-3 h-3" />
      case 'negative':
        return <X className="w-3 h-3" />
      default:
        return <div className="w-3 h-3 rounded-full bg-current" />
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${
            isManuallyTagged 
              ? 'ring-2 ring-blue-500 ring-offset-1' 
              : ''
          } ${getLabelColor(currentLabel)} hover:opacity-80 disabled:opacity-50`}
        >
          {getLabelIcon(currentLabel)}
          {currentLabel.charAt(0).toUpperCase() + currentLabel.slice(1)}
          {isManuallyTagged && <Tag className="w-3 h-3 ml-1" />}
        </button>

      {isOpen && (
        <div className="absolute top-8 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[120px]">
          <div className="space-y-1">
            <button
              onClick={() => handleTag('positive')}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-green-50 text-green-700 disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              Positive
            </button>
            <button
              onClick={() => handleTag('neutral')}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-amber-50 text-amber-700 disabled:opacity-50"
            >
              <div className="w-3 h-3 rounded-full bg-current" />
              Neutral
            </button>
            <button
              onClick={() => handleTag('negative')}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-red-50 text-red-700 disabled:opacity-50"
            >
              <X className="w-3 h-3" />
              Negative
            </button>
            {isManuallyTagged && (
              <>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={handleRemoveTag}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to AI
                </button>
              </>
            )}
            <div className="border-t border-gray-200 my-1" />
            <button
              onClick={handleIgnoreToggle}
              disabled={isLoading}
              className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded disabled:opacity-50 ${
                isIgnored 
                  ? 'hover:bg-green-50 text-green-700' 
                  : 'hover:bg-red-50 text-red-700'
              }`}
            >
              {isIgnored ? <FilterX className="w-3 h-3" /> : <Filter className="w-3 h-3" />}
              {isIgnored ? 'Unignore' : 'Ignore'}
            </button>
          </div>
        </div>
      )}

        {/* Backdrop to close dropdown */}
        {isOpen && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
      
      {/* Filter toggle button */}
      <button
        onClick={handleIgnoreToggle}
        disabled={isLoading}
        className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors ${
          isIgnored 
            ? 'text-red-600 bg-red-50 hover:bg-red-100' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
        title={isIgnored ? 'Unignore this mention' : 'Ignore this mention'}
      >
        {isIgnored ? <FilterX className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
      </button>
    </div>
  )
}
