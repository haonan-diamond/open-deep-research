'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Building, ArrowLeft, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

export default function CreateAccountPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    website: 'https://',
  })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Account name is required')
      return
    }

    if (!formData.website.trim()) {
      toast.error('Website URL is required')
      return
    }

    // Basic URL validation
    if (!formData.website.startsWith('http://') && !formData.website.startsWith('https://')) {
      toast.error('Website URL must start with http:// or https://')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const account = await response.json()
      toast.success('Account created successfully')
      router.push(`/accounts/${account.id}`)
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-6 border-b">
        <Link href="/accounts" className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create New Account</h1>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>New Account</CardTitle>
            <CardDescription>
              Enter the account name and website URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Account Name *
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter account name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="website" className="text-sm font-medium flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Website URL *
              </label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter a valid URL starting with http:// or https://
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSave}
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 