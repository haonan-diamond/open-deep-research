import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getAccountById } from '@/lib/db/queries';

// GET /api/accounts/[id] - Get a single account by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await context.params;
    const account = await getAccountById(id);
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Check if the account belongs to the current user
    if (account.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error getting account:', error);
    return NextResponse.json(
      { error: 'Failed to get account' },
      { status: 500 }
    );
  }
} 