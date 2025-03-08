'use client';

import { useEffect } from 'react';
import { Message } from 'ai';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { useChat } from 'ai/react';
import { toast } from 'sonner';

interface ChatWithParamsProps {
  id: string;
  initialPrompt: string;
  searchType: string;
  accountId?: string;
  agentId?: string;
  selectedModelId: string;
  selectedReasoningModelId: string;
}

export function ChatWithParams({
  id,
  initialPrompt,
  searchType,
  accountId,
  agentId,
  selectedModelId,
  selectedReasoningModelId,
}: ChatWithParamsProps) {
  const { append, isLoading, messages, setMessages } = useChat({
    id,
    body: { 
      id, 
      modelId: selectedModelId, 
      reasoningModelId: selectedReasoningModelId,
      experimental_deepResearch: searchType === 'deep-research',
      tools: searchType === 'deep-research' ? ['deepResearch'] : ['search'],
    },
    initialMessages: [],
  });

  // Send the initial prompt when the component mounts
  useEffect(() => {
    const sendInitialPrompt = async () => {
      try {
        await append({
          id: crypto.randomUUID(),
          role: 'user',
          content: initialPrompt,
        });
      } catch (error) {
        console.error('Error sending initial prompt:', error);
        toast.error('Failed to start the conversation');
      }
    };

    if (initialPrompt && messages.length === 0) {
      sendInitialPrompt();
    }
  }, [initialPrompt, append, messages.length]);

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={messages}
        selectedModelId={selectedModelId}
        selectedReasoningModelId={selectedReasoningModelId}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
} 