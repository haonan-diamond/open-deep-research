import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { auth } from '../(auth)/auth'

export default async function AgentsLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()])
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true'

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <SidebarInset className="p-0 flex flex-col">{children}</SidebarInset>
    </SidebarProvider>
  )
} 