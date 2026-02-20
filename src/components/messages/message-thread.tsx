"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  Send, 
  Paperclip, 
  Phone, 
  MoreVertical,
  ArrowLeft,
  AlertTriangle,
  Shield,
  Flag,
  X,
  Download,
  Eye,
  Package,
  CreditCard,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: string;
  attachments?: any[];
  metadata?: any;
  createdAt: string;
  readByCustomer: boolean;
  readBySeller: boolean;
  filtered?: boolean;
  warnings?: string[];
}

interface Conversation {
  id: number;
  customerId: number;
  sellerId: number;
  subject: string;
  status: string;
  productId?: number;
  orderId?: number;
  productName?: string;
  orderStatus?: string;
  storeName?: string;
}

interface MessageThreadProps {
  conversationId?: number;
  onBack?: () => void;
}

export function MessageThread({ conversationId: propConversationId, onBack }: MessageThreadProps) {
  const t = useTranslations("messages");
  const params = useParams();
  const router = useRouter();
  const conversationId = propConversationId || parseInt(params?.conversationId as string);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // File upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Report state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<Message | null>(null);
  
  // Block state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setConversation(data.conversation);
        // Get current user ID from session or context
        // This is a simplified approach - you'd get this from auth context
        setCurrentUserId(data.conversation.customerId); // or sellerId based on user role
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage("");
        
        if (sentMessage.filtered || sentMessage.warnings?.length > 0) {
          toast.warning("Message sent with content filtering applied");
        }
        
        scrollToBottom();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/messages/${conversationId}/files`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("File uploaded successfully");
        setUploadDialogOpen(false);
        
        // Send a message with the file attachment
        const messageResponse = await fetch(`/api/messages/${conversationId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `Shared a file: ${file.name}`,
            messageType: "file",
            attachments: [result.file],
          }),
        });

        if (messageResponse.ok) {
          const sentMessage = await messageResponse.json();
          setMessages(prev => [...prev, sentMessage]);
          scrollToBottom();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason) return;
    
    setReporting(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: reportingMessage?.id,
          reason: reportReason,
          description: reportDescription,
        }),
      });

      if (response.ok) {
        toast.success("Report submitted successfully");
        setReportDialogOpen(false);
        setReportingMessage(null);
        setReportReason("");
        setReportDescription("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to submit report");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report");
    } finally {
      setReporting(false);
    }
  };

  const handleBlock = async () => {
    if (!conversation) return;
    
    const otherUserId = conversation.customerId === currentUserId ? 
      conversation.sellerId : conversation.customerId;
    
    setBlocking(true);
    try {
      const response = await fetch("/api/messages/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockedUserId: otherUserId,
          reason: blockReason,
          blockType: "messages",
        }),
      });

      if (response.ok) {
        toast.success("User blocked successfully");
        setBlockDialogOpen(false);
        setBlockReason("");
        if (onBack) {
          onBack();
        } else {
          router.push("/messages");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to block user");
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
    } finally {
      setBlocking(false);
    }
  };

  const openReportDialog = (message?: Message) => {
    setReportingMessage(message || null);
    setReportDialogOpen(true);
  };

  const renderOrderCard = () => {
    if (!conversation?.orderId) return null;
    
    return (
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Order #{conversation.orderId}</span>
            <Badge variant={conversation.orderStatus === "completed" ? "default" : "secondary"}>
              {conversation.orderStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-blue-700 mb-2">This conversation is about your order.</p>
          <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
            <Eye className="w-4 h-4 mr-2" />
            View Order Details
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderProductCard = () => {
    if (!conversation?.productId || !conversation?.productName) return null;
    
    return (
      <Card className="mb-4 border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">{conversation.productName}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-green-700 mb-2">This conversation is about this product.</p>
          <Button variant="outline" size="sm" className="text-green-600 border-green-300">
            <Eye className="w-4 h-4 mr-2" />
            View Product
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.senderId === currentUserId;
    
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
      >
        <div className="max-w-xs lg:max-w-md">
          <div className={`flex space-x-2 ${
            isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
          }`}>
            {!isOwnMessage && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
            )}
            
            <div className="flex-1">
              <div
                className={`px-4 py-2 rounded-lg ${
                  isOwnMessage
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {!isOwnMessage && (
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium">{message.senderName}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openReportDialog(message)}>
                          <Flag className="w-4 h-4 mr-2" />
                          Report Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* File attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-white/20 rounded">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-xs truncate">{file.name}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Content filtering warnings */}
                {message.warnings && message.warnings.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-800">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-xs">Content filtered</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`flex items-center mt-1 text-xs text-gray-500 ${
                isOwnMessage ? 'justify-end' : 'justify-start'
              }`}>
                <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
                {isOwnMessage && (message.readByCustomer || message.readBySeller) && (
                  <span className="ml-1">✓</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/messages");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackClick}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="font-semibold">{conversation?.subject || "Conversation"}</h2>
            <p className="text-sm text-gray-500">
              {conversation?.storeName} • {conversation?.status === "active" ? "Active" : "Archived"}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openReportDialog()}>
              <Flag className="w-4 h-4 mr-2" />
              Report Conversation
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => setBlockDialogOpen(true)}
            >
              <Shield className="w-4 h-4 mr-2" />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderOrderCard()}
        {renderProductCard()}
        
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* File Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
            />
            <p className="text-sm text-gray-500">
              Supported formats: Images, PDF, Text, Word documents. Max size: 10MB
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Report {reportingMessage ? "Message" : "Conversation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Reason</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="fraud">Fraud/Scam</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Description</label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide additional details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
              disabled={reporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason || reporting}
            >
              {reporting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will prevent this user from sending you messages and hide all conversations with them.
            </p>
            <div>
              <label className="text-sm font-medium block mb-2">Reason (optional)</label>
              <Select value={blockReason} onValueChange={setBlockReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam messages</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate behavior</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlockDialogOpen(false)}
              disabled={blocking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={blocking}
            >
              {blocking ? "Blocking..." : "Block User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}