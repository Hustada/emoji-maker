'use client'

import { useEffect, useState, useMemo } from 'react'
import { Download, Heart, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { useEmojiStore } from '@/lib/store'
import { EmojiControls } from './emoji-controls'
import { supabase } from '@/lib/supabase'
// We'll use the client-side supabase instance but with pre-signed URLs

export function EmojiGrid() {
  const emojis = useEmojiStore((state) => state.emojis)
  const showLikedOnly = useEmojiStore((state) => state.showLikedOnly)
  const sortOrder = useEmojiStore((state) => state.sortOrder)
  const toggleLike = useEmojiStore((state) => state.toggleLike)
  const fetchEmojis = useEmojiStore((state) => state.fetchEmojis)
  
  // State to store resolved image URLs
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({})

  // Effect to fetch emojis on component mount
  useEffect(() => {
    console.log('🔍 Fetching emojis on component mount')
    fetchEmojis()
  }, [fetchEmojis])
  
  // Debug the emojis array only when it changes
  useEffect(() => {
    console.log('📝 Debugging emojis array:', emojis)
    console.log('📝 Filtering and sorting emojis:', { 
      totalEmojis: emojis.length, 
      showLikedOnly, 
      sortOrder 
    })
  }, [emojis, showLikedOnly, sortOrder])
  
  // Memoize the filtered and sorted emojis to prevent recalculation on every render
  const filteredAndSortedEmojis = useMemo(() => {
    const filtered = emojis
      .filter(emoji => !showLikedOnly || emoji.liked)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
      })
    
    console.log('📝 Filtered emojis count:', filtered.length)
    return filtered
  }, [emojis, showLikedOnly, sortOrder])

  const getImageUrl = async (path: any) => {
    console.log('🔍 Getting image URL for path type:', typeof path, 'value:', path)
    
    // Handle null/undefined paths
    if (path === null || path === undefined) {
      console.error('❌ Path is null or undefined')
      return '/placeholders/placeholder1.png'
    }
    
    // Convert to string safely
    let pathStr: string
    try {
      pathStr = String(path)
    } catch (e) {
      console.error('❌ Error converting path to string:', e)
      return '/placeholders/placeholder2.png'
    }
    
    // Check if the converted string is empty
    if (!pathStr || pathStr.trim() === '') {
      console.error('❌ Path string is empty after conversion')
      return '/placeholders/placeholder3.png'
    }
    
    // Check if the path is already a full URL
    try {
      if (typeof pathStr === 'string' && 
          (pathStr.startsWith('http://') || pathStr.startsWith('https://'))) {
        console.log('✅ Path is already a full URL')
        return pathStr
      }
    } catch (e) {
      console.error('❌ Error checking if path starts with http:', e)
      return '/placeholders/placeholder4.png'
    }
    
    // Otherwise, get the public URL from Supabase
    console.log('🔗 Getting URL for path:', pathStr)
    try {
      // First try to get a public URL
      const { data: publicUrlData } = supabase.storage
        .from('emojis')
        .getPublicUrl(pathStr)
      
      if (publicUrlData?.publicUrl) {
        console.log('✅ Successfully got public URL')
        return publicUrlData.publicUrl
      }
      
      // If that fails, try to get a signed URL via API
      console.log('🔗 Falling back to signed URL API')
      try {
        const response = await fetch(`/api/storage/signed-url?path=${encodeURIComponent(pathStr)}`)
        const data = await response.json()
        
        if (data.signedUrl) {
          console.log('✅ Successfully got signed URL')
          return data.signedUrl
        }
      } catch (fetchError) {
        console.error('❌ Error fetching signed URL:', fetchError)
        return '/placeholders/placeholder5.png'
      }
      
      console.log('❌ Failed to get URL for path:', pathStr)
      return '/placeholders/placeholder6.png'
    } catch (error) {
      console.error('❌ Error getting image URL for path:', pathStr, error)
      return '/placeholders/placeholder7.png'
    }
  }

  // Effect to resolve all image URLs when emojis change
  useEffect(() => {
    // Skip resolution if there are no emojis
    if (filteredAndSortedEmojis.length === 0) {
      console.log('ℹ️ No emojis to resolve URLs for')
      return
    }
    
    // Check if we already have resolved URLs for all emojis
    const allEmojisHaveUrls = filteredAndSortedEmojis.every(emoji => 
      emoji.id && resolvedUrls[emoji.id] && resolvedUrls[emoji.id].length > 0
    )
    
    if (allEmojisHaveUrls) {
      console.log('✅ All emojis already have resolved URLs')
      return
    }
    
    const resolveUrls = async () => {
      console.log('🔍 Resolving URLs for', filteredAndSortedEmojis.length, 'emojis')
      
      // Create a safe version of the map function that won't crash if an emoji is malformed
      const safeMapEmoji = (emoji: any) => {
        if (!emoji || typeof emoji !== 'object') {
          console.error('❌ Invalid emoji object:', emoji);
          return Promise.resolve({ id: 'unknown', url: '/placeholders/placeholder8.png' });
        }
        
        const emojiId = emoji.id || 'unknown';
        
        try {
          return getImageUrl(emoji.url)
            .then(url => ({ id: emojiId, url }))
            .catch(error => {
              console.error('❌ Error resolving URL for emoji:', emojiId, error);
              return { id: emojiId, url: '/placeholders/placeholder9.png' };
            });
        } catch (error) {
          console.error('❌ Error in URL resolution process for emoji:', emojiId, error);
          return Promise.resolve({ id: emojiId, url: '/placeholders/placeholder10.png' });
        }
      };
      
      try {
        const urlPromises = filteredAndSortedEmojis.map(safeMapEmoji);
        const results = await Promise.all(urlPromises);
        const urlMap: Record<string, string> = {};
        
        results.forEach(result => {
          if (result && result.id && result.url) {
            urlMap[result.id] = result.url;
          }
        });
  
        console.log('✅ Resolved URLs for', Object.keys(urlMap).length, 'emojis')
        setResolvedUrls(urlMap);
      } catch (error) {
        console.error('❌ Error in resolveUrls:', error);
        // Still try to set any URLs we might have resolved
        setResolvedUrls({});
      }
    };

    resolveUrls();
  }, [filteredAndSortedEmojis, resolvedUrls]);

  const handleDownload = async (imageUrl: string) => {
    console.log('📥 Starting download for image:', imageUrl)
    try {
      const response = await fetch(imageUrl)
      console.log('📦 Download response status:', response.status)
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const blob = await response.blob()
      console.log('📦 Downloaded blob size:', blob.size)
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'emoji.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      console.log('✅ Download completed successfully')
    } catch (error) {
      console.error('❌ Download failed:', error)
    }
  }

  // Create a separate component for each emoji card to handle async URL resolution
  function EmojiCard({ emoji, onLike, onDownload }: { 
    emoji: any, 
    onLike: (id: string) => void, 
    onDownload: (url: string) => void 
  }) {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    // Resolve the URL when the component mounts
    useEffect(() => {
      let isMounted = true;
      
      const resolveUrl = async () => {
        try {
          const url = await getImageUrl(emoji.url);
          if (isMounted && url) {
            setImageUrl(url);
          } else if (isMounted) {
            setError(true);
          }
        } catch (err) {
          if (isMounted) {
            console.error('Error resolving URL:', err);
            setError(true);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };
      
      resolveUrl();
      
      return () => {
        isMounted = false;
      };
    }, [emoji.url]);

    if (isLoading) {
      return (
        <Card className="group relative aspect-square">
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      );
    }

    if (error || !imageUrl) {
      return (
        <Card className="group relative aspect-square">
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground text-sm text-center p-2">Failed to load emoji</p>
          </div>
        </Card>
      );
    }

    return (
      <Card className="group relative aspect-square">
        <img
          src={imageUrl}
          alt={`Generated emoji for "${emoji.prompt}"`}
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            console.error('❌ Failed to load image:', {
              id: emoji.id,
              url: imageUrl,
              prompt: emoji.prompt
            });
            console.log('🛠️ Falling back to placeholder image');
            e.currentTarget.src = '/placeholder-emoji.png';
          }}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDownload(imageUrl)}
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => onLike(emoji.id)}
          >
            <Heart 
              className={`h-5 w-5 ${emoji.liked ? 'fill-current text-red-500' : ''}`} 
            />
          </Button>
        </div>
      </Card>
    );
  }

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
            <EmojiCard 
              key={emoji.id} 
              emoji={emoji} 
              onLike={toggleLike} 
              onDownload={handleDownload} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
