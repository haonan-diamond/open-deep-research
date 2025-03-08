import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createAgentRun, getAgentRunsByAccountId, getAgentRunsByAgentId } from '@/lib/db/queries';
import { z } from 'zod';

// Schema for creating an agent run
const createAgentRunSchema = z.object({
  agentId: z.string().uuid('Invalid agent ID'),
  accountId: z.string().uuid('Invalid account ID'),
  chatId: z.string().uuid('Invalid chat ID'),
  searchType: z.string(),
});

// GET /api/agent-runs - Get agent runs by account ID or agent ID
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const agentId = searchParams.get('agentId');
    
    if (!accountId && !agentId) {
      return NextResponse.json(
        { error: 'Either accountId or agentId is required' },
        { status: 400 }
      );
    }
    
    let agentRuns;
    
    if (accountId) {
      agentRuns = await getAgentRunsByAccountId(accountId);
    } else if (agentId) {
      agentRuns = await getAgentRunsByAgentId(agentId);
    }
    
    return NextResponse.json(agentRuns);
  } catch (error) {
    console.error('Error getting agent runs:', error);
    return NextResponse.json(
      { error: 'Failed to get agent runs' },
      { status: 500 }
    );
  }
}

// POST /api/agent-runs - Create a new agent run
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const validatedData = createAgentRunSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    const agentRun = await createAgentRun({
      ...validatedData.data,
      userId: session.user.id,
    });
    
    return NextResponse.json(agentRun, { status: 201 });
  } catch (error) {
    console.error('Error creating agent run:', error);
    return NextResponse.json(
      { error: 'Failed to create agent run' },
      { status: 500 }
    );
  }
} 