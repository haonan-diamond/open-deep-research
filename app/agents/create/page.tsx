'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InfoIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export default function CreateAgentPage() {
  const [agentName, setAgentName] = useState('BP Tractors Sales Agent')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState(`Role:
- You are a sales agent for BP Tractors, a company specializing in high-quality tractors. Your name is Ronald the Tractor Man.
- Speak like an experienced farmer, using friendly and knowledgeable language.

Objective:
- Answer customer questions about BP Tractors' products using information from the knowledge base.
- Respond to general questions about tractors and farming by searching the web.

Engagement Strategy:
- Ask questions to understand the user's specific needs.
- Recommend relevant products from the knowledge base based on the user's responses. Do not give more than 3 options at a time

Sales Process:
- If the user expresses interest in a tractor, politely ask for their contact information.
- Use the "Create Lead" action in SalesForce to generate a lead.
- Make sure to gather all the necessary input data for "Create Lead" action
- Generate a brief summary of the conversation.
  Store this summary in the "Description" field.
  Include any useful insights for the sales agent.
  Inform the user that a representative will contact them shortly (avoid using the word "lead")`)
  const [isActive, setIsActive] = useState(true)
  const [searchType, setSearchType] = useState('web-search')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!agentName.trim()) {
      toast.error('Agent name is required')
      return
    }

    if (!instructions.trim()) {
      toast.error('Instructions are required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: agentName,
          description,
          instructions,
          isActive,
          searchType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create agent')
      }

      toast.success('Agent created successfully')
      router.push('/agents')
    } catch (error) {
      console.error('Error creating agent:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create agent')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-2xl font-bold">Create Agent</h1>
        <Button 
          onClick={handleSave} 
          className="bg-orange-500 hover:bg-orange-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Agent'
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto py-6 px-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Name</CardTitle>
                <CardDescription>Give your agent a descriptive name</CardDescription>
              </CardHeader>
              <CardContent>
                <Input 
                  value={agentName} 
                  onChange={(e) => setAgentName(e.target.value)} 
                  placeholder="Enter agent name" 
                />
              </CardContent>
              <CardFooter className="flex items-center space-x-2">
                <Label htmlFor="active-status" className="font-medium">Active</Label>
                <Switch 
                  id="active-status" 
                  checked={isActive} 
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-orange-500" 
                />
                <span className="text-sm text-muted-foreground ml-2">
                  Agent is {isActive ? 'active and available for use' : 'inactive'}
                </span>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
                <CardDescription>Provide a brief description of what this agent does</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a description for this agent"
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Instructions <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  className="min-h-[300px] font-mono"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Knowledge bases <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-center py-8">
                  Web search is enabled by default
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 