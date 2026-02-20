"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { MessageCircle, Search, Plus, Archive, Clock, User, Store, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthGate } from "@/components/auth-gate";

interface Conversation {
  id: number;
  subject: string;
  status: string;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  store: {
    id: number;
    name: string;
    slug: string;
  };
  otherParticipant: {
    id: number;
    name: string;
    email: string;
  };
  product: {
    id: number;
    name: string;
    imageUrl: string;
  } | null;
  orderId: number | null;
  userRole: "customer" | "seller";
}

export default function MessagesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"active" | "archived" | "closed">("active");

  useEffect(() => {
    fetchConversations();
  }, [filter]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages?status=${filter}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        console.error("Failed to fetch conversations");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.otherParticipant.name.toLowerCase().includes(searchLower) ||
      conv.store.name.toLowerCase().includes(searchLower) ||
      conv.subject.toLowerCase().includes(searchLower) ||
      conv.lastMessagePreview.toLowerCase().includes(searchLower)
    );
  });

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              {t("title")}
            </h1>
            
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t("searchConversations")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("active")}
                >
                  Active
                </Button>
                <Button
                  variant={filter === "archived" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("archived")}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Archived
                </Button>
                <Button
                  variant={filter === "closed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("closed")}
                >
                  Closed
                </Button>
              </div>
            </div>
          </div>

          {/* Conversations list */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">{t("loadingConversations")}</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? "No conversations found" : t("noConversations")}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm 
                      ? "Try adjusting your search terms"
                      : t("startNewConversation")
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredConversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    conversation.unreadCount > 0 ? "bg-blue-50 border-blue-200" : ""
                  }`}
                  onClick={() => router.push(`/messages/${conversation.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {conversation.userRole === "customer" ? (
                          <Store className="w-6 h-6 text-gray-600" />
                        ) : (
                          <User className="w-6 h-6 text-gray-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {conversation.otherParticipant.name}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="default" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            {formatTimeAgo(conversation.lastMessageAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                          <Store className="w-4 h-4" />
                          <span className="truncate">{conversation.store.name}</span>
                          {conversation.product && (
                            <>
                              <span>•</span>
                              <Package className="w-4 h-4" />
                              <span className="truncate">{conversation.product.name}</span>
                            </>
                          )}
                        </div>

                        {conversation.subject && (
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {conversation.subject}
                          </div>
                        )}

                        <p className="text-sm text-gray-600 line-clamp-2">
                          {conversation.lastMessagePreview || t("noMessages")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}