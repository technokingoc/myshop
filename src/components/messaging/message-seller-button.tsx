"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

interface MessageSellerButtonProps {
  storeId: number;
  sellerId: number;
  storeName: string;
  productId?: number;
  productName?: string;
  orderId?: number;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  fullWidth?: boolean;
}

const MESSAGE_TOPICS = [
  { value: "product", labelKey: "productQuestion" },
  { value: "order", labelKey: "orderInquiry" },
  { value: "general", labelKey: "generalInquiry" },
];

export function MessageSellerButton({
  storeId,
  sellerId,
  storeName,
  productId,
  productName,
  orderId,
  className = "",
  variant = "default",
  size = "default",
  fullWidth = false,
}: MessageSellerButtonProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  // Pre-fill subject and message based on context
  const getDefaultSubject = () => {
    if (productName) {
      return t("about", { product: productName });
    }
    if (orderId) {
      return `${t("orderInquiry")} #${orderId}`;
    }
    return "";
  };

  const getDefaultMessage = () => {
    if (productName) {
      return t("messagePlaceholder");
    }
    return "";
  };

  const handleOpen = () => {
    setSubject(getDefaultSubject());
    setMessage(getDefaultMessage());
    setSelectedTopic(productId ? "product" : orderId ? "order" : "general");
    setIsOpen(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeId,
          sellerId,
          customerId: null, // Will be set from auth on server
          subject: subject.trim(),
          initialMessage: message.trim(),
          productId: productId || null,
          orderId: orderId || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsOpen(false);
        router.push(`/messages/${data.conversationId}`);
      } else {
        const errorData = await response.json();
        console.error("Failed to send message:", errorData.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  const buttonClasses = `${fullWidth ? "w-full" : ""} ${className}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={buttonClasses}
          onClick={handleOpen}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {t("messageSeller")}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {t("messageSubject")} {storeName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Topic selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              {t("selectTopic")}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {MESSAGE_TOPICS.map((topic) => (
                <button
                  key={topic.value}
                  type="button"
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    selectedTopic === topic.value
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedTopic(topic.value)}
                >
                  {t(topic.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="text-sm font-medium text-gray-700 block mb-1">
              {t("messageSubject")}
            </label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("messageSubjectPlaceholder")}
              maxLength={256}
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="text-sm font-medium text-gray-700 block mb-1">
              {t("newMessage")} <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
              rows={4}
              maxLength={2000}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length}/2000
            </div>
          </div>

          {/* Context info */}
          {(productName || orderId) && (
            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <div className="font-medium text-gray-700 mb-1">Context:</div>
              {productName && (
                <div className="text-gray-600 flex items-center gap-2">
                  <span>Product:</span>
                  <span className="font-medium">{productName}</span>
                </div>
              )}
              {orderId && (
                <div className="text-gray-600 flex items-center gap-2">
                  <span>Order:</span>
                  <span className="font-medium">#{orderId}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <CardFooter className="flex gap-2 px-0 pt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
            className="flex-1"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || loading}
            className="flex-1"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {t("sendMessage")}
          </Button>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MessageSellerButton;