import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createAgent, getAgentsByUserId, updateAgent, deleteAgent } from '@/lib/db/queries';
import { z } from 'zod';

// Schema for creating an agent
const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  instructions: z.string().min(1, 'Instructions are required'),
  isActive: z.boolean().default(true),
  searchType: z.string().default('web-search'),
});

// Schema for updating an agent
const updateAgentSchema = z.object({
  id: z.string().uuid('Invalid agent ID'),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  instructions: z.string().min(1, 'Instructions are required').optional(),
  isActive: z.boolean().optional(),
  searchType: z.string().optional(),
});

// GET /api/agents - Get all agents for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const agents = await getAgentsByUserId(session.user.id);
    
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error getting agents:', error);
    return NextResponse.json(
      { error: 'Failed to get agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const validatedData = createAgentSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    const agent = await createAgent({
      ...validatedData.data,
      userId: session.user.id,
    });
    
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}

// PUT /api/agents - Update an agent
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const validatedData = updateAgentSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    const { id, ...data } = validatedData.data;
    
    const agent = await updateAgent({
      id,
      ...data,
    });
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents?id={id} - Delete an agent
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }
    
    const agent = await deleteAgent(id);
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
} 