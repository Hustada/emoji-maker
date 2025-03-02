import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  addEmojis: (newEmojis: string[], prompt: string) => void
  toggleLike: (id: string) => void
  clearEmojis: () => void
  setShowLikedOnly: (show: boolean) => void
  setSortOrder: (order: SortOrder) => void
}

export const useEmojiStore = create<EmojiStore>()(
  persist(
    (set) => ({
      emojis: [],
      showLikedOnly: false,
      sortOrder: 'newest',
      addEmojis: (newEmojis: string[], prompt: string) => 
        set((state) => ({
          emojis: [
            ...newEmojis.map((url) => ({
              id: crypto.randomUUID(),
              url,
              prompt,
              createdAt: new Date().toISOString(),
              liked: false,
            })),
            ...state.emojis,
          ],
        })),
      toggleLike: (id: string) =>
        set((state) => ({
          emojis: state.emojis.map((emoji) =>
            emoji.id === id ? { ...emoji, liked: !emoji.liked } : emoji
          ),
        })),
      clearEmojis: () => set({ emojis: [] }),
      setShowLikedOnly: (show: boolean) => set({ showLikedOnly: show }),
      setSortOrder: (order: SortOrder) => set({ sortOrder: order }),
    }),
    {
      name: 'emoji-storage',
    }
  )
) 