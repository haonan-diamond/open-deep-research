import { auth } from '@/app/(auth)/auth';
import { saveChat } from '@/lib/db/queries';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, title } = await request.json();

    if (!id || !title) {
      return Response.json(
        { error: 'Missing required fields: id and title' },
        { status: 400 }
      );
    }

    await saveChat({
      id,
      userId: session.user.id,
      title,
    });

    return Response.json({ success: true, id, title });
  } catch (error) {
    console.error('Error creating chat:', error);
    return Response.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
} 