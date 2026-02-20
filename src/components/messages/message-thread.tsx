"use client";

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/language';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowLeft, Send, User } from 'lucide-react';

interface MessageSender {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  isCurrentUser: boolean;
}

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
  sender: MessageSender;
}

interface ConversationDetails {
  id: number;
  storeId: number;
  customerId: number;
  sellerId: number;
  subject: string;
  status: string;
  productId: number | null;
  orderId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface MessageThreadProps {
  conversationId: number;
  onBack: () => void;
}

export function MessageThread({ conversationId, onBack }: MessageThreadProps) {
  const { t } = useLanguage();
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'HH:mm');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="lg:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex-1">
            <h2 className="font-semibold">
              {conversation.subject || 'Conversation'}
            </h2>
            <p className="text-sm text-gray-500">
              Started {format(new Date(conversation.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender.isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-2 max-w-xs lg:max-w-md ${
              message.sender.isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              {!message.sender.isCurrentUser && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
              )}
              
              <div>
                <div className={`p-3 rounded-lg ${
                  message.sender.isCurrentUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                <div className={`flex items-center mt-1 text-xs text-gray-500 ${
                  message.sender.isCurrentUser ? 'justify-end' : 'justify-start'
                }`}>
                  <span>{formatMessageTime(message.createdAt)}</span>
                  {message.sender.isCurrentUser && message.isRead && (
                    <span className="ml-1">✓</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}