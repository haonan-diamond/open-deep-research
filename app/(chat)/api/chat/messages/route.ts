import { auth } from '@/app/(auth)/auth';
import { getMessagesByChatId } from '@/lib/db/queries';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the chat ID from the URL query parameters
    const url = new URL(request.url);
    const chatId = url.searchParams.get('chatId');

    if (!chatId) {
      return Response.json(
        { error: 'Missing required parameter: chatId' },
        { status: 400 }
      );
    }

    const messages = await getMessagesByChatId({ id: chatId });
    return Response.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return Response.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 