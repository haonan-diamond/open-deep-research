import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { updateAgentRunStatus } from '@/lib/db/queries';
import { z } from 'zod';

// Schema for updating an agent run
const updateAgentRunSchema = z.object({
  status: z.enum(['active', 'completed', 'failed']),
});

// PATCH /api/agent-runs/[id] - Update an agent run status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure params is properly awaited
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Agent run ID is required' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    
    const validatedData = updateAgentRunSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    const { status } = validatedData.data;
    
    const agentRun = await updateAgentRunStatus({
      id,
      status,
    });
    
    if (!agentRun) {
      return NextResponse.json(
        { error: 'Agent run not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(agentRun);
  } catch (error) {
    console.error('Error updating agent run:', error);
    return NextResponse.json(
      { error: 'Failed to update agent run' },
      { status: 500 }
    );
  }
} 