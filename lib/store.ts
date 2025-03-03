import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from './supabase'

interface Emoji {
  id: string
  url: string
  prompt: string
  createdAt: string
  liked?: boolean
}

type SortOrder = 'newest' | 'oldest'

interface EmojiStore {
  emojis: Emoji[]
  showLikedOnly: boolean
  sortOrder: SortOrder
  addEmojis: (newEmojis: Emoji[]) => void
  toggleLike: (id: string) => void
  clearEmojis: () => void
  setShowLikedOnly: (show: boolean) => void
  setSortOrder: (order: SortOrder) => void
  fetchEmojis: () => Promise<void>
}

export const useEmojiStore = create<EmojiStore>()(
  persist(
    (set) => ({
      emojis: [],
      showLikedOnly: false,
      sortOrder: 'newest',
      addEmojis: (newEmojis: Emoji[]) => {
        console.log('📝 Adding new emojis:', newEmojis)
        set((state) => {
          console.log('🔄 Current emoji count:', state.emojis.length)
          console.log('🔄 New total emoji count:', state.emojis.length + newEmojis.length)
          return {
            emojis: [...newEmojis, ...state.emojis],
          }
        })
      },
      toggleLike: async (id: string) => {
        set((state) => {
          const updatedEmojis = state.emojis.map((emoji) =>
            emoji.id === id ? { ...emoji, liked: !emoji.liked } : emoji
          )
          const likedEmoji = updatedEmojis.find(emoji => emoji.id === id)
          
          // Call the API to update likes in the database
          fetch('/api/emojis/like', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important: include credentials
            body: JSON.stringify({
              emojiId: id,
              like: likedEmoji?.liked
            })
          }).catch(err => console.error('Failed to update like status:', err))
          
          return { emojis: updatedEmojis }
        })
      },
      clearEmojis: () => {
        console.log('🗑️ Clearing all emojis')
        set({ emojis: [] })
      },
      setShowLikedOnly: (show: boolean) => {
        console.log('🔎 Setting showLikedOnly:', show)
        set({ showLikedOnly: show })
      },
      setSortOrder: (order: SortOrder) => {
        console.log('🔄 Setting sort order:', order)
        set({ sortOrder: order })
      },
      fetchEmojis: async () => {
        console.log('📡 Fetching emojis from database')
        const { data, error } = await supabase
          .from('emojis')
          .select('*')
          .order('created_at', { ascending: false })
        
        console.log('📥 Database query completed')

        if (error) {
          console.error('❌ Failed to fetch emojis:', error)
          return
        }
        console.log('✅ Successfully fetched emojis')
        
        console.log('📝 Fetched emojis count:', data.length)
        console.log('📝 First few emojis:', data.slice(0, 3))

        const mappedEmojis = data.map(emoji => ({
          id: emoji.id.toString(),
          url: emoji.image_url,
          prompt: emoji.prompt,
          createdAt: emoji.created_at,
          liked: false
        }))
        
        console.log('🔄 Setting emojis in store, count:', mappedEmojis.length)
        set({ emojis: mappedEmojis })
      }
    }),
    {
      name: 'emoji-storage',
    }
  )
) 