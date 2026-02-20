"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/language';
import { ConversationList } from '@/components/messages/conversation-list';
import { MessageThread } from '@/components/messages/message-thread';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

function MessagesContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const conversationParam = searchParams.get('conversation');
    if (conversationParam) {
      const conversationId = parseInt(conversationParam);
      if (!isNaN(conversationId)) {
        setSelectedConversationId(conversationId);
      }
    }
  }, [searchParams]);

  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversationId(conversationId);
  };

  const handleBack = () => {
    setSelectedConversationId(null);
  };

  if (isMobile) {
    // Mobile: Show either conversation list or thread
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        {selectedConversationId ? (
          <Card className="h-full rounded-none border-0">
            <MessageThread
              conversationId={selectedConversationId}
              onBack={handleBack}
            />
          </Card>
        ) : (
          <Card className="h-full rounded-none border-0">
            <ConversationList
              onConversationSelect={handleConversationSelect}
              selectedConversationId={selectedConversationId || undefined}
            />
          </Card>
        )}
      </div>
    );
  }

  // Desktop: Show both in split view
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex h-full space-x-4">
        {/* Conversation List */}
        <Card className="w-1/3 min-w-[300px] max-w-[400px] border-0 shadow-sm">
          <ConversationList
            onConversationSelect={handleConversationSelect}
            selectedConversationId={selectedConversationId || undefined}
          />
        </Card>

        {/* Message Thread */}
        <Card className="flex-1 border-0 shadow-sm">
          {selectedConversationId ? (
            <MessageThread
              conversationId={selectedConversationId}
              onBack={handleBack}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">
                  {t('messages.selectConversation')}
                </h3>
                <p className="text-sm">
                  {t('messages.selectConversationDesc')}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}