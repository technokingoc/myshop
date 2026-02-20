import { useState, useEffect, useRef } from 'react';

interface Message {
  id: number;
  senderId: number;
  content: string;
  messageType: string;
  attachments: any[];
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    isCurrentUser: boolean;
  };
}

export function useRealTimeMessages(conversationId: number) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const lastMessageIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    let pollInterval: NodeJS.Timeout;
    let typingInterval: NodeJS.Timeout;

    const pollMessages = async () => {
      try {
        const response = await fetch(`/api/messages/conversations/${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          const newMessages = data.messages as Message[];
          
          // Check if there are new messages
          if (newMessages.length > 0) {
            const latestMessageId = newMessages[newMessages.length - 1].id;
            
            if (lastMessageIdRef.current && latestMessageId > lastMessageIdRef.current) {
              // There are new messages, update the state
              setMessages(newMessages);
            } else if (!lastMessageIdRef.current) {
              // Initial load
              setMessages(newMessages);
            }
            
            lastMessageIdRef.current = latestMessageId;
          }
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    const pollTypingIndicators = async () => {
      try {
        const response = await fetch(`/api/messages/typing?conversationId=${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          setTypingUsers(data.typingUsers.map((user: any) => user.userId));
        }
      } catch (error) {
        console.error('Error polling typing indicators:', error);
      }
    };

    // Initial load
    pollMessages();
    pollTypingIndicators();

    // Set up polling intervals
    pollInterval = setInterval(pollMessages, 2000); // Poll messages every 2 seconds
    typingInterval = setInterval(pollTypingIndicators, 1000); // Poll typing every 1 second

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (typingInterval) clearInterval(typingInterval);
    };
  }, [conversationId]);

  const addMessage = (newMessage: Message) => {
    setMessages(prev => [...prev, newMessage]);
    lastMessageIdRef.current = newMessage.id;
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    try {
      await fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          isTyping,
        }),
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  return {
    messages,
    typingUsers,
    addMessage,
    updateTypingStatus,
  };
}