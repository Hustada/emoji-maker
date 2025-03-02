'use client'

import { Download, Heart } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { useEmojiStore } from '@/lib/store'
import { EmojiControls } from './emoji-controls'

export function EmojiGrid() {
  const emojis = useEmojiStore((state) => state.emojis)
  const showLikedOnly = useEmojiStore((state) => state.showLikedOnly)
  const sortOrder = useEmojiStore((state) => state.sortOrder)
  const toggleLike = useEmojiStore((state) => state.toggleLike)

  const handleDownload = async (imageUrl: string) => {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'emoji.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const filteredAndSortedEmojis = emojis
    .filter(emoji => !showLikedOnly || emoji.liked)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  return (
    <div className="space-y-4">
      <EmojiControls />
      {filteredAndSortedEmojis.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {showLikedOnly ? 'No liked emojis yet' : 'No emojis generated yet'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredAndSortedEmojis.map((emoji) => (
            <Card key={emoji.id} className="group relative aspect-square">
              <img
                src={emoji.url}
                alt={`Generated emoji for "${emoji.prompt}"`}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDownload(emoji.url)}
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => toggleLike(emoji.id)}
                >
                  <Heart 
                    className={`h-5 w-5 ${emoji.liked ? 'fill-current text-red-500' : ''}`} 
                  />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 