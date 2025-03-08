'use client'

import type { User } from 'next-auth'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

import { PlusIcon, BuildingIcon } from '@/components/icons'
import { SidebarHistory } from '@/components/sidebar-history'
import { SidebarUserNav } from '@/components/sidebar-user-nav'
import { SidebarAccounts } from '@/components/sidebar-accounts'
import { Button } from '@/components/ui/button'
import { CompanyModal } from '@/components/ui/company-modal'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar
} from '@/components/ui/sidebar'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { toast } from 'sonner'

// Add this function to render the Percipient logo
function PercipientLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-black rounded-full p-2 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
          <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="white" opacity="0.5" />
        </svg>
      </div>
      <span className="font-bold text-xl">PERCIPIENT</span>
    </div>
  );
}

export function AppSidebar ({ user }: { user: User | undefined }) {
  const router = useRouter()
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [existingCompany, setExistingCompany] = useState<{
    id: string;
    name: string;
    description: string;
    useCase: string;
  } | null>(null)
  const [currentAccount, setCurrentAccount] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompany = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/company?userId=${user.id}`)
          const data = await response.json()
          
          if (response.ok && data) {
            setExistingCompany({
              id: data.id,
              name: data.name,
              description: data.description,
              useCase: data.useCase,
            })
          }
        } catch (error) {
          console.error('Failed to fetch company:', error)
          toast.error('Failed to fetch company information')
        }
      }
    }

    fetchCompany()
  }, [user?.id])

  // Get current account name from URL
  useEffect(() => {
    const fetchAccountName = async () => {
      if (pathname?.includes('/accounts/')) {
        const accountId = pathname.split('/accounts/')[1]
        if (accountId && accountId !== 'create') {
          try {
            const response = await fetch(`/api/accounts/${accountId}`)
            if (response.ok) {
              const data = await response.json()
              setCurrentAccount(data.name)
            }
          } catch (error) {
            console.error('Failed to fetch account:', error)
          }
        } else {
          setCurrentAccount(null)
        }
      } else {
        setCurrentAccount(null)
      }
    }

    fetchAccountName()
  }, [pathname])

  const handleCompanySubmit = async (data: {
    name: string
    description: string
    useCase: string
  }) => {
    if (!user?.id) {
      toast.error('You must be logged in to save company information')
      return
    }

    try {
      const url = existingCompany ? '/api/company' : '/api/company'
      const method = existingCompany ? 'PUT' : 'POST'
      const body = existingCompany 
        ? { id: existingCompany.id, ...data }
        : { ...data, userId: user.id }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('Failed to save company information')
      }

      toast.success(existingCompany 
        ? 'Company information updated successfully'
        : 'Company information saved successfully'
      )

      // Refresh the company data
      const updatedResponse = await fetch(`/api/company?userId=${user.id}`)
      const updatedData = await updatedResponse.json()
      
      if (updatedResponse.ok && updatedData) {
        setExistingCompany({
          id: updatedData.id,
          name: updatedData.name,
          description: updatedData.description,
          useCase: updatedData.useCase,
        })
      }
    } catch (error) {
      console.error('Failed to save company:', error)
      toast.error('Failed to save company information')
    }
  }

  return (
    <Sidebar className='group-data-[side=left]:border-r-0 bg-brand-background'>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <div className='flex flex-row justify-between items-center'>
            <PercipientLogo />
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    type='button'
                    className='p-2 h-fit'
                    onClick={() => setIsCompanyModalOpen(true)}
                  >
                    <BuildingIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align='end'>Company Info</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    type='button'
                    className='p-2 h-fit'
                    onClick={() => {
                      setOpenMobile(false)
                      router.push('/')
                      router.refresh()
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align='end'>New Chat</TooltipContent>
              </Tooltip>
            </div>
          </div>
          {currentAccount && (
            <div className="mt-2 text-sm text-muted-foreground">
              {currentAccount}
            </div>
          )}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarAccounts user={user} />
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {user && <SidebarUserNav user={user} />}
      </SidebarFooter>

      <CompanyModal 
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSubmit={handleCompanySubmit}
        initialData={existingCompany}
      />
    </Sidebar>
  )
}
