'use client'

import { useState, useEffect } from 'react'
import { Building } from 'lucide-react'
import Link from 'next/link'
import { User } from 'next-auth'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface Account {
  id: string
  name: string
  website: string | null
}

export function SidebarAccounts({ user }: { user: User | undefined }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

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
  }, [user?.id])

  return (
    <div className="px-2 py-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">Recent Accounts</h2>
        <Link href="/accounts/create">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-brand-secondary">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-xs text-muted-foreground px-2 py-1">
          No accounts found
        </div>
      ) : (
        <div className="space-y-1">
          {accounts.map(account => (
            <Link 
              key={account.id} 
              href={`/accounts/${account.id}`}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md w-full",
                pathname?.includes(`/accounts/${account.id}`) 
                  ? "bg-brand-secondary text-brand-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-brand-secondary/50"
              )}
            >
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{account.name}</span>
            </Link>
          ))}
        </div>
      )}
      
      <div className="mt-3 px-2">
        <Link href="/accounts/create">
          <Button variant="outline" className="w-full border-dashed border-brand-accent/50 hover:border-brand-accent hover:bg-brand-secondary/50 flex items-center justify-center gap-1">
            <PlusIcon className="h-4 w-4" />
            <span>New Account</span>
          </Button>
        </Link>
      </div>
    </div>
  )
} 