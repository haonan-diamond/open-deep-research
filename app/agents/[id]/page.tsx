'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Agent {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
  isActive: boolean;
  searchType: string;
  userId: string;
  createdAt: string;
}

export default function EditAgentPage() {
  const params = useParams()
  const agentId = params.id as string
  const router = useRouter()
  
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [searchType, setSearchType] = useState('web-search')
  
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Agent not found')
            router.push('/agents')
            return
          }
          throw new Error('Failed to fetch agent')
        }
        
        const data = await response.json()
        setAgent(data)
        
        // Initialize form state
        setName(data.name)
        setDescription(data.description || '')
        setInstructions(data.instructions)
        setIsActive(data.isActive)
        setSearchType(data.searchType)
      } catch (error) {
        console.error('Error fetching agent:', error)
        toast.error('Failed to load agent')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAgent()
  }, [agentId, router])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !instructions) {
      toast.error('Name and instructions are required')
      return
    }
    
    setSaving(true)
    
    try {
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: agentId,
          name,
          description: description || null,
          instructions,
          isActive,
          searchType,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update agent')
      }
      
      toast.success('Agent updated successfully')
      router.push('/agents')
    } catch (error) {
      console.error('Error updating agent:', error)
      toast.error('Failed to update agent')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-6 border-b">
          <Link href="/agents" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Agent</h1>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-6 border-b">
        <Link href="/agents" className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Agent</h1>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Agent Details</CardTitle>
                <CardDescription>
                  Update your agent's information and settings
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter agent name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Enter a brief description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions *</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Enter detailed instructions for the agent"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    required
                    className="min-h-[150px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="searchType">Search Type</Label>
                  <Select
                    value={searchType}
                    onValueChange={setSearchType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select search type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web-search">Web Search</SelectItem>
                      <SelectItem value="deep-research">Deep Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/agents')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
} 