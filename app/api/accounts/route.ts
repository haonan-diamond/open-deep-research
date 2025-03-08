import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createAccount, getAccountsByUserId, updateAccount, deleteAccount, searchAccounts } from '@/lib/db/queries';
import { z } from 'zod';

// Schema for creating an account
const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string()
    .min(1, 'Website URL is required')
    .url('Invalid URL format')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      { message: 'URL must start with http:// or https://' }
    ),
  industry: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
});

// Schema for updating an account
const updateAccountSchema = z.object({
  id: z.string().uuid('Invalid account ID'),
  name: z.string().min(1, 'Name is required').optional(),
  website: z.string()
    .min(1, 'Website URL is required')
    .url('Invalid URL format')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      { message: 'URL must start with http:// or https://' }
    ),
  industry: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
});

// GET /api/accounts - Get all accounts for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    
    if (query) {
      const accounts = await searchAccounts(query, session.user.id);
      return NextResponse.json(accounts);
    }
    
    const accounts = await getAccountsByUserId(session.user.id);
    
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error getting accounts:', error);
    return NextResponse.json(
      { error: 'Failed to get accounts' },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create a new account
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const validatedData = createAccountSchema.safeParse(body);
    
    if (!validatedData.success) {
      const formattedErrors = validatedData.error.format();
      let errorMessage = 'Validation failed';
      
      // Extract specific error messages
      if (formattedErrors.website?._errors?.length) {
        errorMessage = formattedErrors.website._errors[0];
      } else if (formattedErrors.name?._errors?.length) {
        errorMessage = formattedErrors.name._errors[0];
      }
      
      return NextResponse.json(
        { error: errorMessage, details: formattedErrors },
        { status: 400 }
      );
    }
    
    const account = await createAccount({
      ...validatedData.data,
      userId: session.user.id,
    });
    
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/accounts - Update an account
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const validatedData = updateAccountSchema.safeParse(body);
    
    if (!validatedData.success) {
      const formattedErrors = validatedData.error.format();
      let errorMessage = 'Validation failed';
      
      // Extract specific error messages
      if (formattedErrors.website?._errors?.length) {
        errorMessage = formattedErrors.website._errors[0];
      } else if (formattedErrors.name?._errors?.length) {
        errorMessage = formattedErrors.name._errors[0];
      } else if (formattedErrors.id?._errors?.length) {
        errorMessage = formattedErrors.id._errors[0];
      }
      
      return NextResponse.json(
        { error: errorMessage, details: formattedErrors },
        { status: 400 }
      );
    }
    
    const { id, ...data } = validatedData.data;
    
    try {
      const account = await updateAccount({
        id,
        ...data,
      });
      
      if (!account) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(account);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Website URL is required')) {
        return NextResponse.json(
          { error: 'Website URL is required' },
          { status: 400 }
        );
      }
      throw error; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error('Error updating account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update account';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/accounts?id={id} - Delete an account
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
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    const account = await deleteAccount(id);
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
} 