import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models, reasoningModels, DEFAULT_REASONING_MODEL_NAME } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { ChatWithParams } from '@/components/chat-with-params';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  const reasoningModelIdFromCookie = cookieStore.get('reasoning-model-id')?.value;

  const selectedReasoningModelId =
    reasoningModels.find((model) => model.id === reasoningModelIdFromCookie)?.id ||
    DEFAULT_REASONING_MODEL_NAME;

  // Extract query parameters
  const params = await searchParams;
  const initialPrompt = params.initialPrompt as string | undefined;
  const searchType = params.searchType as string | undefined;
  const accountId = params.accountId as string | undefined;
  const agentId = params.agentId as string | undefined;

  // If we have query parameters, use the ChatWithParams component
  if (initialPrompt && searchType) {
    return (
      <ChatWithParams
        id={id}
        initialPrompt={initialPrompt}
        searchType={searchType}
        accountId={accountId}
        agentId={agentId}
        selectedModelId={selectedModelId}
        selectedReasoningModelId={selectedReasoningModelId}
      />
    );
  }

  // Otherwise, use the regular Chat component
  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedModelId={selectedModelId}
        selectedReasoningModelId={selectedReasoningModelId}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
