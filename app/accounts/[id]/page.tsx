'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Building, ArrowLeft, User, Play, Plus, Globe, Info, X, ExternalLink, History, Clock, MessageSquare, Calendar } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { useChat } from 'ai/react'
import { Message } from 'ai'
import { generateUUID } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { DEFAULT_MODEL_NAME, DEFAULT_REASONING_MODEL_NAME } from '@/lib/ai/models'
import { Markdown } from '@/components/markdown'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createAgentRun, getAgentRunsByAccountId, updateAgentRunStatus } from '@/lib/db/queries'
import { saveChat } from '@/lib/db/queries'
import { Badge } from '@/components/ui/badge'

interface Account {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  logo: string | null;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
  isActive: boolean;
  searchType: string;
}

interface CompanyInfo {
  name: string;
  description: string;
  industry: string;
  products: string;
  uniqueFeatures: string;
}

// Interface for search results
interface SearchResult {
  title: string;
  url: string;
  description?: string;
  source?: string;
  favicon?: string;
}

// Interface for sources
interface Source {
  url: string;
  title: string;
  relevance?: number;
}

// Interface for agent runs
interface AgentRun {
  id: string;
  agentId: string;
  accountId: string;
  chatId: string;
  userId: string;
  searchType: string;
  status: string;
  createdAt: string;
}

// Add interface for complex message content
interface ComplexMessageContent {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: any;
  result?: {
    data?: any;
    success?: boolean;
    error?: string;
  };
}

// Update Message interface to handle complex content
interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string | ComplexMessageContent[];
  createdAt: string;
}

// Utility function to extract sources from content
function extractSourcesFromContent(content: string): Source[] {
  const sources: Source[] = [];
  
  try {
    // Look for sources in the message using the ```sources format
    const sourcesMatch = content.match(/```sources\n([\s\S]*?)\n```/);
    if (sourcesMatch && sourcesMatch[1]) {
      try {
        const sourcesData = JSON.parse(sourcesMatch[1]);
        if (Array.isArray(sourcesData)) {
          return sourcesData;
        }
      } catch (e) {
        console.error('Failed to parse sources:', e);
      }
    }
    
    // Also look for sources in the message using the <sources> format (alternative format)
    const altSourcesMatch = content.match(/<sources>([\s\S]*?)<\/sources>/);
    if (altSourcesMatch && altSourcesMatch[1]) {
      try {
        const sourcesData = JSON.parse(altSourcesMatch[1]);
        if (Array.isArray(sourcesData)) {
          return sourcesData;
        }
      } catch (e) {
        console.error('Failed to parse alternative sources format:', e);
      }
    }
  } catch (error) {
    console.error('Error extracting sources from content:', error);
  }
  
  return sources;
}

// Utility function to clean message content
function cleanMessageContent(content: string): string {
  return content
    .replace(/```search-results\n[\s\S]*?\n```/g, '')
    .replace(/```sources\n[\s\S]*?\n```/g, '')
    .replace(/<sources>[\s\S]*?<\/sources>/g, '')
    .trim();
}

// Add this function to format tool call messages for display
function formatToolCall(toolCall: ComplexMessageContent): string {
  if (toolCall.type !== 'tool-call') return '';
  
  let formattedText = '';
  
  if (toolCall.toolName === 'search') {
    formattedText = `🔍 **Searching for:** "${toolCall.args?.query}"`;
  } else if (toolCall.toolName === 'extract') {
    formattedText = `📄 **Extracting data from:** ${Array.isArray(toolCall.args?.urls) ? toolCall.args.urls.join(', ') : toolCall.args?.urls}\n\n**Extraction prompt:** ${toolCall.args?.prompt}`;
  } else if (toolCall.toolName === 'scrape') {
    formattedText = `🌐 **Scraping website:** ${toolCall.args?.url}\n\n**Scrape prompt:** ${toolCall.args?.prompt}`;
  } else if (toolCall.toolName === 'deepResearch') {
    formattedText = `🔬 **Performing deep research on:** "${toolCall.args?.query}"`;
  } else {
    formattedText = `🛠️ **Using tool:** ${toolCall.toolName}\n\n**Arguments:** \`\`\`json\n${JSON.stringify(toolCall.args, null, 2)}\n\`\`\``;
  }
  
  return formattedText;
}

// Enhanced message component for in-place chat
function ChatMessage({ message }: { message: ChatMessage }) {
  // Extract search results and sources from message content if available
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [showReferences, setShowReferences] = useState(false)
  const [displayContent, setDisplayContent] = useState<string>('')

  useEffect(() => {
    // Parse message content for search results and sources
    try {
      // Handle different content formats
      if (typeof message.content === 'string') {
        // Handle string content (original format)
        setDisplayContent(message.content)
        
        // Look for search results in the message
        const searchResultsMatch = message.content.match(/```search-results\n([\s\S]*?)\n```/)
        if (searchResultsMatch && searchResultsMatch[1]) {
          try {
            const results = JSON.parse(searchResultsMatch[1])
            setSearchResults(Array.isArray(results) ? results : [])
          } catch (e) {
            console.error('Failed to parse search results:', e)
          }
        }

        // Extract sources using our utility function
        const extractedSources = extractSourcesFromContent(message.content)
        if (extractedSources.length > 0) {
          setSources(extractedSources)
          setShowReferences(true)
        } else {
          // Fallback to the old method if no sources found
          const sourcesMatch = message.content.match(/```sources\n([\s\S]*?)\n```/)
          if (sourcesMatch && sourcesMatch[1]) {
            try {
              const sourcesData = JSON.parse(sourcesMatch[1])
              setSources(Array.isArray(sourcesData) ? sourcesData : [])
            } catch (e) {
              console.error('Failed to parse sources:', e)
            }
          }
        }

        // If we found search results or sources, show the references tab
        if ((searchResultsMatch && searchResultsMatch[1]) || sources.length > 0) {
          setShowReferences(true)
        }
      } else if (Array.isArray(message.content)) {
        // Handle array content (new format)
        let textContent = '';
        let foundSources = false;
        
        // Process each content item
        message.content.forEach(item => {
          if (item.type === 'text') {
            // Add text content
            textContent += item.text;
          } else if (item.type === 'tool-call') {
            // Format tool call for display
            const toolCallText = formatToolCall(item);
            if (toolCallText) {
              textContent += (textContent ? '\n\n' : '') + toolCallText;
            }
          } else if (item.type === 'tool-result' && item.toolName === 'search' && item.result?.success) {
            // Extract search results
            const results = item.result.data || [];
            setSearchResults(results);
            
            if (results.length > 0) {
              foundSources = true;
              
              // Convert search results to sources
              const searchSources = results.map((result: any, index: number) => ({
                url: result.url,
                title: result.title,
                relevance: 1 - (index * 0.1) // Decrease relevance for each subsequent result
              }));
              
              setSources(prev => [...prev, ...searchSources]);
              
              // Add a summary of search results to the text content
              textContent += (textContent ? '\n\n' : '') + `📊 **Found ${results.length} search results**`;
            }
          } else if (item.type === 'tool-result' && item.toolName === 'extract' && item.result?.success) {
            // Add extracted data as formatted text
            if (item.result.data) {
              textContent += (textContent ? '\n\n' : '') + '📋 **Extracted Data:**\n```json\n' + 
                JSON.stringify(item.result.data, null, 2) + 
                '\n```\n';
            }
          } else if (item.type === 'tool-result' && !item.result?.success) {
            // Add error message for failed tool calls
            textContent += (textContent ? '\n\n' : '') + `❌ **Tool Error (${item.toolName}):** ${item.result?.error || 'Unknown error'}`;
          }
        });
        
        setDisplayContent(textContent);
        
        if (foundSources) {
          setShowReferences(true);
        }
      }
    } catch (error) {
      console.error('Error parsing message content:', error)
      
      // Fallback: if we can't parse the content, display it as is
      if (typeof message.content === 'string') {
        setDisplayContent(message.content)
      } else if (Array.isArray(message.content)) {
        // Try to extract any text content
        const textItems = message.content.filter(item => item.type === 'text')
        if (textItems.length > 0) {
          setDisplayContent(textItems.map(item => item.text).join('\n\n'))
        } else {
          setDisplayContent(JSON.stringify(message.content, null, 2))
        }
      } else {
        setDisplayContent(JSON.stringify(message.content, null, 2))
      }
    }
  }, [message.content, message.role])

  // Clean the message content by removing the search results and sources blocks
  const cleanContent = useMemo(() => {
    if (typeof displayContent !== 'string') return ''
    
    return cleanMessageContent(displayContent)
  }, [displayContent])

  return (
    <div className={cn(
      "flex flex-col gap-2 p-4 rounded-lg w-full max-w-3xl",
      message.role === 'user' ? "bg-muted self-end" : 
      message.role === 'assistant' ? "bg-primary/10 self-start" :
      message.role === 'tool' ? "bg-secondary/10 self-start border border-secondary/20" : 
      "bg-primary/10 self-start"
    )}>
      <div className="font-semibold text-sm flex items-center gap-2">
        {message.role === 'user' ? (
          <>
            <span className="size-5 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-xs">U</span>
            <span>You</span>
          </>
        ) : message.role === 'assistant' ? (
          <>
            <span className="size-5 flex items-center justify-center bg-orange-500 text-white rounded-full text-xs">A</span>
            <span>Agent</span>
          </>
        ) : message.role === 'tool' ? (
          <>
            <span className="size-5 flex items-center justify-center bg-secondary text-secondary-foreground rounded-full text-xs">T</span>
            <span>Tool</span>
          </>
        ) : (
          <>
            <span className="size-5 flex items-center justify-center bg-orange-500 text-white rounded-full text-xs">A</span>
            <span>Agent</span>
          </>
        )}
      </div>
      
      {showReferences ? (
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="references">References</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="mt-0">
            <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
              <Markdown>{cleanContent}</Markdown>
            </div>
          </TabsContent>
          
          <TabsContent value="references" className="mt-0">
            {searchResults.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Search Results</h4>
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <div key={index} className="p-2 border rounded-md text-sm">
                      <div className="flex items-center gap-2">
                        {result.favicon && (
                          <img src={result.favicon} alt="" className="w-4 h-4" />
                        )}
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-500 hover:underline flex items-center gap-1"
                        >
                          {result.title || result.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {result.description && (
                        <p className="text-muted-foreground text-xs mt-1">{result.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {sources.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Sources</h4>
                <div className="space-y-2">
                  {sources.map((source, index) => (
                    <div key={index} className="p-2 border rounded-md text-sm">
                      <div className="flex items-center gap-2">
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-500 hover:underline flex items-center gap-1"
                        >
                          {source.title || source.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {source.relevance !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            Relevance: {Math.round(source.relevance * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
          <Markdown>{cleanContent}</Markdown>
        </div>
      )}
    </div>
  )
}

// Simple messages list component
function ChatMessages({ messages, isLoading }: { messages: ChatMessage[], isLoading: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map(message => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-primary/10 self-start">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Thinking...</span>
        </div>
      )}
    </div>
  )
}

export default function AccountDetailPage() {
  const params = useParams()
  const accountId = params.id as string
  
  const [account, setAccount] = useState<Account | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [saving, setSaving] = useState(false)
  const [website, setWebsite] = useState('')
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(false)
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<'search' | 'deep-research'>('search')
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([])
  const [loadingAgentRuns, setLoadingAgentRuns] = useState(false)
  const [currentAgentRunId, setCurrentAgentRunId] = useState<string | null>(null)
  
  const router = useRouter()

  console.log(searchMode)

  // Initialize chat when an agent is activated
  const {
    messages: chatMessages,
    setMessages,
    input,
    setInput,
    handleSubmit,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id: chatId || undefined,
    body: { 
      id: chatId, 
      modelId: DEFAULT_MODEL_NAME,
      reasoningModelId: DEFAULT_REASONING_MODEL_NAME,
      experimental_deepResearch: searchMode === 'deep-research',
      experimental_activeTools: searchMode === 'deep-research' 
        ? ['deepResearch', 'search', 'extract', 'scrape']
        : ['search', 'extract', 'scrape'],
    },
    initialMessages: [],
    experimental_throttle: 100,
    api: '/api/chat', // Explicitly set the API endpoint
    onFinish: () => {
      // Handle chat completion if needed
    },
    onError: (error) => {
      console.error('Chat error:', error)
      toast.error('Error in conversation: ' + (error.message || 'Unknown error'))
    },
  })

  // Convert the messages to our ChatMessage type with proper type handling
  const messages = useMemo(() => {
    return chatMessages.map(msg => ({
      ...msg,
      chatId: chatId || '',
      // Ensure createdAt is a string
      createdAt: msg.createdAt ? (typeof msg.createdAt === 'string' ? msg.createdAt : msg.createdAt.toISOString()) : new Date().toISOString()
    })) as unknown as ChatMessage[];
  }, [chatMessages, chatId]);

  // Add this useEffect to load messages when chatId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) return;
      
      try {
        const response = await fetch(`/api/chat/messages?chatId=${chatId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load conversation history');
      }
    };
    
    loadMessages();
  }, [chatId, setMessages]);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const response = await fetch(`/api/accounts/${accountId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Account not found')
            router.push('/accounts')
            return
          }
          throw new Error('Failed to fetch account')
        }
        
        const data = await response.json()
        setAccount(data)
        setWebsite(data.website || '')
        
        // If website is available, fetch company info
        if (data.website) {
          fetchCompanyInfo(data.website)
        }
      } catch (error) {
        console.error('Error fetching account:', error)
        toast.error('Failed to load account')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAccount()
  }, [accountId, router])

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agents')
        
        if (!response.ok) {
          throw new Error('Failed to fetch agents')
        }
        
        const data = await response.json()
        console.log('Fetched agents:', data)
        setAgents(data)
      } catch (error) {
        console.error('Error fetching agents:', error)
        toast.error('Failed to load agents')
      } finally {
        setLoadingAgents(false)
      }
    }
    
    fetchAgents()
  }, [])

  const fetchCompanyInfo = async (websiteUrl: string) => {
    if (!websiteUrl) return
    
    setLoadingCompanyInfo(true)
    try {
      const response = await fetch('/api/company-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ website: websiteUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch company information')
      }

      const data = await response.json()
      setCompanyInfo(data)
    } catch (error) {
      console.error('Error fetching company info:', error)
      toast.error('Failed to fetch company information')
    } finally {
      setLoadingCompanyInfo(false)
    }
  }

  const handleSave = async () => {
    if (!website.trim()) {
      toast.error('Website URL is required')
      return
    }

    // Basic URL validation
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      toast.error('Website URL must start with http:// or https://')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/accounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: accountId,
          name: account?.name,
          website,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update account')
      }

      const updatedAccount = await response.json()
      setAccount(updatedAccount)
      toast.success('Account updated successfully')
      
      // Fetch company info after saving website
      if (website) {
        fetchCompanyInfo(website)
      }
    } catch (error) {
      console.error('Error updating account:', error)
      toast.error('Failed to update account')
    } finally {
      setSaving(false)
    }
  }

  const handleStartAgent = async (agent: Agent) => {
    if (!account?.website) {
      toast.error('Account must have a website URL to start an agent')
      return
    }

    try {
      // Set the active agent and create a new chat ID
      setActiveAgent(agent)
      setSearchMode(agent.searchType === 'deep-research' ? 'deep-research' : 'search')
      const newChatId = generateUUID()
      setChatId(newChatId)
      
      // Clear any existing messages
      setMessages([])
      
      // Create a chat in the database
      const chatResponse = await fetch('/api/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newChatId,
          title: `${agent.name} - ${account.name}`,
        }),
      })
      
      if (!chatResponse.ok) {
        throw new Error('Failed to create chat')
      }
      
      // Create an agent run record
      const agentRunResponse = await fetch('/api/agent-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          accountId,
          chatId: newChatId,
          searchType: agent.searchType,
        }),
      })
      
      if (!agentRunResponse.ok) {
        throw new Error('Failed to create agent run')
      }
      
      const agentRunData = await agentRunResponse.json()
      setCurrentAgentRunId(agentRunData.id)
      
      // Prepare the initial message based on the agent and account
      const initialPrompt = `${agent.instructions}\n\nCompany Website: ${account.website}\nCompany Name: ${account.name}`
      
      // Show a toast notification
      toast.success(`Starting ${agent.searchType === 'deep-research' ? 'deep research' : 'web search'} with ${agent.name}`)
      
      // Log the configuration for debugging
      console.log('Chat configuration:', {
        chatId: newChatId,
        modelId: DEFAULT_MODEL_NAME,
        reasoningModelId: DEFAULT_REASONING_MODEL_NAME,
        searchMode: agent.searchType,
        experimental_deepResearch: agent.searchType === 'deep-research',
        experimental_activeTools: agent.searchType === 'deep-research' 
          ? ['deepResearch', 'search', 'extract', 'scrape']
          : ['search', 'extract', 'scrape'],
      })
      
      // Add a small delay to ensure the chat is initialized
      setTimeout(async () => {
        try {
          // Send the initial message
          await append({
            id: generateUUID(),
            role: 'user',
            content: initialPrompt,
          })
        } catch (error) {
          console.error('Error sending initial message:', error)
          toast.error('Failed to start the conversation')
          
          // Update agent run status to failed
          if (currentAgentRunId) {
            await fetch(`/api/agent-runs/${currentAgentRunId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: 'failed',
              }),
            })
          }
        }
      }, 500) // Increased delay to ensure chat is fully initialized
    } catch (error) {
      console.error('Error starting agent:', error)
      toast.error('Failed to start conversation with agent')
      setActiveAgent(null)
      setChatId(null)
      setCurrentAgentRunId(null)
    }
  }

  const handleCloseChat = async () => {
    // Update agent run status to completed
    if (currentAgentRunId) {
      try {
        await fetch(`/api/agent-runs/${currentAgentRunId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'completed',
          }),
        })
        
        // Refresh agent runs
        const response = await fetch(`/api/agent-runs?accountId=${accountId}`)
        if (response.ok) {
          const data = await response.json()
          setAgentRuns(data)
        }
      } catch (error) {
        console.error('Error updating agent run status:', error)
      }
    }
    
    setActiveAgent(null)
    setChatId(null)
    setMessages([])
    setCurrentAgentRunId(null)
  }

  const handleLoadAgentRun = async (agentRun: AgentRun) => {
    try {
      // Find the agent
      const agent = agents.find(a => a.id === agentRun.agentId)
      if (!agent) {
        toast.error('Agent not found')
        return
      }
      
      // Set the active agent and chat ID
      setActiveAgent(agent)
      setChatId(agentRun.chatId)
      setSearchMode(agentRun.searchType === 'deep-research' ? 'deep-research' : 'search')
      setCurrentAgentRunId(agentRun.id)
      
      // Clear any existing messages
      setMessages([])
      
      // Show a toast notification
      toast.success(`Loading conversation with ${agent.name}`)
    } catch (error) {
      console.error('Error loading agent run:', error)
      toast.error('Failed to load conversation')
    }
  }

  // Fetch agent runs for this account
  useEffect(() => {
    const fetchAgentRuns = async () => {
      if (!accountId) return
      
      setLoadingAgentRuns(true)
      try {
        const response = await fetch(`/api/agent-runs?accountId=${accountId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch agent runs')
        }
        
        const data = await response.json()
        setAgentRuns(data)
      } catch (error) {
        console.error('Error fetching agent runs:', error)
        toast.error('Failed to load agent history')
      } finally {
        setLoadingAgentRuns(false)
      }
    }
    
    fetchAgentRuns()
  }, [accountId])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-6 border-b">
          <Link href="/accounts" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Account Details</h1>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }
  console.log(messages)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-6 border-b">
        <Link href="/accounts" className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{account?.name}</h1>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        {activeAgent && chatId ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                {activeAgent.name}
                <span className="text-sm text-muted-foreground">
                  ({activeAgent.searchType === 'deep-research' ? 'Deep Research' : 'Web Search'})
                </span>
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCloseChat}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
            
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="h-[500px] flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4">
                    <ChatMessages
                      messages={messages}
                      isLoading={isLoading}
                    />
                  </div>
                  
                  <div className="border-t p-4">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                      <Input
                        placeholder="Ask a follow-up question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        variant="brand"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  Website URL *
                </CardTitle>
                <CardDescription>
                  Enter the website URL for this account (required)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || !website.trim()}
                    variant="brand"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {companyInfo && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Name</h3>
                      <p className="text-sm">{companyInfo.name}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Industry</h3>
                      <p className="text-sm">{companyInfo.industry}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Description</h3>
                      <p className="text-sm">{companyInfo.description}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Products</h3>
                      <p className="text-sm">{companyInfo.products}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Unique Features</h3>
                      <p className="text-sm">{companyInfo.uniqueFeatures}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {loadingCompanyInfo && (
              <Card className="mb-6">
                <CardContent className="flex justify-center items-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Fetching company information...</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Available Agents</h2>
              
              {loadingAgents ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-muted-foreground">No agents available</p>
                  <p className="text-sm text-muted-foreground mt-1">Create an agent in the Agents section</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.filter(agent => agent.isActive).map(agent => (
                    <Card key={agent.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        {agent.description && (
                          <CardDescription>{agent.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {agent.instructions}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs font-normal">
                            {agent.searchType === 'deep-research' ? 'Deep Research' : 'Web Search'}
                          </Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button 
                          onClick={() => handleStartAgent(agent)}
                          className="w-full"
                          variant="brand"
                        >
                          Start Conversation
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            {agentRuns.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Previous Conversations</h2>
                
                {loadingAgentRuns ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {agentRuns.map(agentRun => {
                      const agent = agents.find(a => a.id === agentRun.agentId);
                      return (
                        <Card key={agentRun.id} className="overflow-hidden">
                          <CardHeader className="py-3">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {agent?.name || 'Unknown Agent'}
                              </CardTitle>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleLoadAgentRun(agentRun)}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Load
                              </Button>
                            </div>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(agentRun.createdAt).toLocaleString()}</span>
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 