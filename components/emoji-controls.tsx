'use client'

import { Button } from './ui/button'
import { Heart, Clock, RotateCcw } from 'lucide-react'
import { useEmojiStore } from '@/lib/store'

export function EmojiControls() {
  const showLikedOnly = useEmojiStore((state) => state.showLikedOnly)
  const setShowLikedOnly = useEmojiStore((state) => state.setShowLikedOnly)
  const sortOrder = useEmojiStore((state) => state.sortOrder)
  const setSortOrder = useEmojiStore((state) => state.setSortOrder)
  const clearEmojis = useEmojiStore((state) => state.clearEmojis)

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Button
          variant={showLikedOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowLikedOnly(!showLikedOnly)}
        >
          <Heart className={`h-4 w-4 mr-2 ${showLikedOnly ? 'fill-current' : ''}`} />
          {showLikedOnly ? 'Show All' : 'Show Liked'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
        >
          <Clock className="h-4 w-4 mr-2" />
          {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={clearEmojis}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Clear All
      </Button>
    </div>
  )
} 