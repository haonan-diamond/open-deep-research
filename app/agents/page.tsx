'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { PlusIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Agent {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agents')
        
        if (!response.ok) {
          throw new Error('Failed to fetch agents')
        }
        
        const data = await response.json()
        setAgents(data)
      } catch (error) {
        console.error('Error fetching agents:', error)
        toast.error('Failed to load agents')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAgents()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/agents?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete agent')
      }
      
      setAgents(agents.filter(agent => agent.id !== id))
      toast.success('Agent deleted successfully')
    } catch (error) {
      console.error('Error deleting agent:', error)
      toast.error('Failed to delete agent')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-2xl font-bold">Agents</h1>
        <Link href="/agents/create">
          <Button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600">
            <PlusIcon className="h-4 w-4" />
            <span>New Agent</span>
          </Button>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-center">
            <p className="text-muted-foreground mb-4">No agents found</p>
            <Link href="/agents/create">
              <Button className="bg-orange-500 hover:bg-orange-600">Create your first agent</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableCaption>A list of your agents</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map(agent => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>{agent.description || 'No description'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        agent.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(agent.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/agents/${agent.id}`)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500"
                        onClick={() => handleDelete(agent.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
} 