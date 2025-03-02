'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { EmojiGrid } from './emoji-grid'
import { Loader2 } from 'lucide-react'
import { useEmojiStore } from '@/lib/store'

// Placeholder emoji images
const placeholderEmojis = [
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Grinning%20face/3D/grinning_face_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Smiling%20face%20with%20hearts/3D/smiling_face_with_hearts_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Star-struck/3D/star-struck_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Nerd%20face/3D/nerd_face_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Partying%20face/3D/partying_face_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Winking%20face/3D/winking_face_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Money-mouth%20face/3D/money-mouth_face_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sunglasses/3D/sunglasses_3d.png'
]

export function EmojiGenerator() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addEmojis = useEmojiStore((state) => state.addEmojis)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Server error (${response.status}): ${errorData}`)
      }
      
      const data = await response.json()
      console.log('API Response:', data)
      
      if (Array.isArray(data.emojis)) {
        addEmojis(data.emojis, prompt)
      } else {
        throw new Error('Invalid response format: Expected array of emojis')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      setError(errorMessage)
      console.error('Failed to generate emoji:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter text to generate an emoji..."
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </form>
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      <EmojiGrid />
    </div>
  )
} 