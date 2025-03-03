'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { generateUUIDFromString } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [prompt, setPrompt] = useState('happy cat')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [addingCredits, setAddingCredits] = useState(false)

  async function loadCredits() {
    if (!isSignedIn || !user) return
    
    try {
      const supabaseUserId = generateUUIDFromString(user.id)
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', supabaseUserId)
        .single()
      
      if (error) {
        console.error('Error loading credits:', error)
        return
      }
      
      setCredits(data?.credits || 0)
    } catch (err) {
      console.error('Error checking credits:', err)
    }
  }
  
  async function handleAddCredits() {
    if (!isSignedIn || !user) return
    
    setAddingCredits(true)
    try {
      // Call the admin API to add credits
      const response = await fetch('/api/admin/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: 10 })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error adding credits:', errorData)
        setError('Failed to add credits: ' + (errorData.error || response.statusText))
        return
      }
      
      const data = await response.json()
      console.log('Credits added:', data)
      
      await loadCredits()
      setError(null)
    } catch (err) {
      console.error('Error adding credits:', err)
      setError(err instanceof Error ? err.message : 'Failed to add credits')
    } finally {
      setAddingCredits(false)
    }
  }
  
  // Load credits when user is loaded
  if (isLoaded && isSignedIn && credits === null) {
    loadCredits()
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!prompt || !isSignedIn) {
      setError('Please enter a prompt and sign in')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setImageUrl(null)

    try {
      // Call the test-generate API (doesn't require credits)
      console.log('Calling test-generate API with prompt:', prompt)
      const response = await fetch('/api/test-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      
      console.log('Response status:', response.status)
      
      const data = await response.json()
      console.log('Response data:', data)
      
      setResult(data)
      
      if (data.imageUrl) {
        setImageUrl(data.imageUrl)
      } else {
        setError('No image URL in response')
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Emoji Generator Test</h1>
        <a 
          href="/" 
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Go to Main App
        </a>
      </div>
      
      {!isLoaded ? (
        <p>Loading authentication...</p>
      ) : isSignedIn ? (
        <div className="mb-4 p-2 bg-green-100 rounded">
          <p>✅ Signed in as: {user?.firstName || user?.emailAddresses[0]?.emailAddress}</p>
          <p className="mt-1">Credits: {credits !== null ? credits : 'Loading...'}</p>
          <button
            onClick={handleAddCredits}
            disabled={addingCredits}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:bg-gray-300"
          >
            {addingCredits ? 'Adding...' : 'Add 10 Credits'}
          </button>
        </div>
      ) : (
        <div className="mb-4 p-2 bg-yellow-100 rounded">
          <p>⚠️ Not signed in. Please sign in to test the API.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label htmlFor="prompt" className="block mb-1 font-medium">
            Prompt:
          </label>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter a prompt (e.g., happy cat)"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !isSignedIn}
          className="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {isLoading ? 'Generating...' : 'Generate Emoji'}
        </button>
      </form>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">API Response:</h2>
          <pre className="text-xs overflow-auto p-2 bg-gray-800 text-white rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      {imageUrl && (
        <div className="mb-4">
          <h2 className="font-bold mb-2">Generated Emoji:</h2>
          <img 
            src={imageUrl} 
            alt="Generated emoji" 
            className="w-full h-auto rounded border"
            onError={() => setError('Failed to load image')}
          />
        </div>
      )}
    </div>
  )
}
