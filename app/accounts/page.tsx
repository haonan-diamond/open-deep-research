'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Globe, Building, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

interface Account {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  logo: string | null;
  createdAt: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/accounts')
        
        if (!response.ok) {
          throw new Error('Failed to fetch accounts')
        }
        
        const data = await response.json()
        setAccounts(data)
      } catch (error) {
        console.error('Error fetching accounts:', error)
        toast.error('Failed to load accounts')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAccounts()
  }, [])

  const handleSelectAccount = (account: Account) => {
    router.push(`/accounts/${account.id}`)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Link href="/accounts/create">
          <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
            <Plus className="h-4 w-4" />
            New Account
          </Button>
        </Link>
      </div>
      
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Building className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h2 className="text-xl font-medium mb-2">No accounts found</h2>
            <p className="text-muted-foreground mb-6">Create your first account to get started</p>
            <Link href="/accounts/create">
              <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                <Plus className="h-4 w-4" />
                Create Account
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card 
                key={account.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectAccount(account)}
              >
                <div className="p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {account.logo ? (
                      <img src={account.logo} alt={account.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <Building className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{account.name}</p>
                    {account.website && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{account.website}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 