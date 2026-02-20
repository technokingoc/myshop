"use client";

import { useRouter } from 'next/navigation';
import { MessageThread } from '@/components/messages/message-thread';
import { Card } from '@/components/ui/card';

interface ConversationPageProps {
  params: {
    conversationId: string;
  };
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const router = useRouter();
  const conversationId = parseInt(params.conversationId);

  if (isNaN(conversationId)) {
    router.push('/messages');
    return null;
  }

  const handleBack = () => {
    router.push('/messages');
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="h-full rounded-none border-0 lg:m-4 lg:h-[calc(100vh-2rem)] lg:rounded-lg lg:border lg:shadow-sm">
        <MessageThread
          conversationId={conversationId}
          onBack={handleBack}
        />
      </Card>
    </div>
  );
}