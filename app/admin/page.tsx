'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [credits, setCredits] = useState(10)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const router = useRouter()

  const addCredits = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/admin/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credits }),
      })
      
      const data = await response.json()
      setResult(data)
      
      if (response.ok) {
        // Refresh the app to show updated credits
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (error) {
      console.error('Error adding credits:', error)
      setResult({ error: 'Failed to add credits' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>Add credits to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
              />
            </div>
          </div>
          
          {result && (
            <div className={`mt-4 p-3 rounded-md ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <p>{result.success ? result.message : result.error}</p>
              {result.profile && (
                <pre className="text-xs mt-2 overflow-auto">
                  {JSON.stringify(result.profile, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={addCredits} disabled={loading} className="w-full">
            {loading ? 'Adding Credits...' : 'Add Credits'}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-4 text-center">
        <Button variant="outline" onClick={() => router.push('/')}>
          Back to App
        </Button>
      </div>
    </div>
  )
}
