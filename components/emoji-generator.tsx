'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { EmojiGrid } from './emoji-grid'
import { Loader2 } from 'lucide-react'
import { useEmojiStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import { generateUUIDFromString } from '@/lib/utils'

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
  const { user } = useUser()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('🚀 handleSubmit called with prompt:', prompt)
    
    if (!prompt || !user) {
      console.log('❌ Missing prompt or user:', { prompt: !!prompt, user: !!user })
      return
    }

    console.log('👤 User:', user.id)
    setIsLoading(true)
    setError(null)

    try {
      // 1. Generate image with API
      console.log('📡 Sending request to /api/generate endpoint')
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      console.log('📥 Received response:', response.status, response.statusText)
      
      if (!response.ok) {
        console.log('❌ API error:', response.status, response.statusText)
        throw new Error(`Server error (${response.status})`)
      }
      
      const data = await response.json()
      console.log('📦 API Response:', data)

      // 2. Handle the image URL based on its format
      console.log('📥 Image URL type:', typeof data.imageUrl)
      const fileName = `${user.id}/${Date.now()}.png`
      console.log('📄 Generated filename:', fileName)
      
      let uploadResponse;
      
      if (data.imageUrl.startsWith('data:')) {
        // It's a data URL, send it directly to the upload endpoint
        console.log('📤 Uploading data URL to Supabase Storage')
        uploadResponse = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-emoji-prompt': prompt // Pass the prompt in headers
          },
          body: JSON.stringify({
            dataUrl: data.imageUrl,
            fileName: fileName,
            userId: user?.id // Include the userId in the request
          })
        })
      } else {
        // It's a regular URL, fetch it first
        console.log('📥 Fetching image from URL:', data.imageUrl)
        const imageResponse = await fetch(data.imageUrl)
        console.log('📦 Image response status:', imageResponse.status)
        const imageBlob = await imageResponse.blob()
        console.log('📦 Image blob size:', imageBlob.size)
        
        // Create a FormData object to send the blob
        const formData = new FormData()
        formData.append('file', imageBlob)
        formData.append('fileName', fileName)
        // Add userId to the form data
        if (user?.id) {
          formData.append('userId', user.id)
        }
        
        // Use a server API endpoint to handle the upload with admin privileges
        console.log('📤 Uploading blob to Supabase Storage')
        uploadResponse = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: {
            'x-emoji-prompt': prompt // Pass the prompt in headers
          },
          body: formData
        })
      }
      
      const uploadResult = await uploadResponse.json()
      console.log('📤 Upload result:', uploadResult)
      
      if (!uploadResult.success) {
        console.error('❌ Upload failed:', uploadResult.error)
        setError('Failed to upload emoji')
        setIsLoading(false)
        return
      }
      
      const storageData = {
        path: uploadResult.path
      }

      console.log('✅ Image uploaded successfully')
      
      // Get the public URL for the stored image
      console.log('🔗 Getting public URL for uploaded image')
      const publicUrlData = {
        publicUrl: uploadResult.publicUrl
      }
      
      console.log('🔗 Public URL data:', publicUrlData)  
        
      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.log('❌ Failed to get public URL')
        throw new Error('Failed to get public URL for image')
      }
      
      console.log('✅ Got public URL:', publicUrlData.publicUrl)

      // 4. Check if the upload API already inserted the emoji metadata
      console.log('📝 Checking emoji metadata from upload response')
      
      if (uploadResult.dbError) {
        console.error('❌ Database error from upload API:', uploadResult.dbError)
        setError('Failed to save emoji metadata')
        setIsLoading(false)
        return
      }
      
      // If we have emojiData in the upload result, use it
      const emojiData = uploadResult.emojiData
      
      if (emojiData) {
        console.log('✅ Emoji metadata inserted by upload API:', emojiData)
      } else {
        console.log('⚠️ No emoji metadata in upload response')
      }
      console.log('✅ Emoji metadata saved successfully')

      // 5. Update local store
      console.log('🔄 Adding emoji to local state')
      addEmojis([{
        id: emojiData.id.toString(),
        url: emojiData.image_url,
        prompt: prompt,
        createdAt: new Date().toISOString(),
        liked: false
      }])
      console.log('✅ Emoji added to local state')

    } catch (error) {
      console.error('❌ Generation Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate emoji')
    } finally {
      console.log('🔄 Resetting loading state')
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
        <Button type="submit" disabled={isLoading || !user}>
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
      {!user && (
        <div className="text-yellow-500 text-sm">Please sign in to generate emojis</div>
      )}
      <EmojiGrid />
    </div>
  )
} 