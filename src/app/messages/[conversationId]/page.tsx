"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Archive, 
  Ban, 
  RotateCcw,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  User,
  Store,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthGate } from "@/components/auth-gate";
// Dropdown menu functionality can be added later when dropdown components are available

interface Message {
  id: number;
  content: string;
  messageType: string;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  metadata: Record<string, any>;
  readByCustomer: boolean;
  readBySeller: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    name: string;
    email: string;
  };
  isOwn: boolean;
}

interface ConversationInfo {
  id: number;
  status: string;
  subject: string;
}

export default function ConversationPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const conversationId = parseInt(params.conversationId as string);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      setupRealtimeConnection();
    }
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setConversation(data.conversation);
      } else if (response.status === 404) {
        router.push("/messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeConnection = () => {
    const eventSource = new EventSource("/api/messages/stream");
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.conversationId === conversationId) {
        if (data.type === "new_message") {
          setMessages(prev => [...prev, data.message]);
        } else if (data.type === "message_updated") {
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId ? { ...msg, ...data.updates } : msg
          ));
        } else if (data.type === "typing") {
          setIsTyping(data.isTyping);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Function to update conversation status (future functionality)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.readByCustomer && message.readBySeller) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    }
    if (message.readByCustomer || message.readBySeller) {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    }
    return <Check className="w-4 h-4 text-gray-400" />;
  };

  const canSendMessages = conversation?.status === "active";

  if (loading) {
    return (
      <AuthGate>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/messages")}
              className="lg:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            
            <div>
              <h1 className="font-medium">
                {conversation?.subject || t("conversationWith", { name: "User" })}
              </h1>
              <p className="text-sm text-gray-500">
                {isTyping ? t("typing") : t("offline")}
              </p>
            </div>
          </div>

          {conversation && (
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Conversation status banner */}
        {conversation?.status !== "active" && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
            <span className="text-sm text-yellow-800">
              {conversation?.status === "closed" 
                ? t("conversationClosed")
                : t("conversationArchived")
              }
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {t("noMessages")}
            </div>
          ) : (
            messages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      {formatDate(message.createdAt)}
                    </div>
                  )}
                  
                  <div className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                      message.isOwn ? "order-2" : "order-1"
                    }`}>
                      <div className={`rounded-lg px-3 py-2 ${
                        message.isOwn 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-100 text-gray-900"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2 text-xs">
                                <Paperclip className="w-3 h-3" />
                                <span className="truncate">{attachment.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                        message.isOwn ? "justify-end" : "justify-start"
                      }`}>
                        <span>{formatTime(message.createdAt)}</span>
                        {message.isOwn && getMessageStatusIcon(message)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="border-t bg-white px-4 py-3">
          {canSendMessages ? (
            <form onSubmit={sendMessage} className="flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t("typeMessage")}
                  className="resize-none min-h-[40px] max-h-32"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 p-0"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                  className="w-10 h-10 p-0"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center text-gray-500 py-2">
              <p>{t("conversationClosed")}</p>
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}