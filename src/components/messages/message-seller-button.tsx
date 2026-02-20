"use client";

import { useState } from 'react';
import { useLanguage } from '@/lib/language';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MessageSellerButtonProps {
  storeId: number;
  storeName: string;
  productId?: number;
  productName?: string;
  orderId?: number;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function MessageSellerButton({
  storeId,
  storeName,
  productId,
  productName,
  orderId,
  variant = 'default',
  size = 'default',
  className,
}: MessageSellerButtonProps) {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  // Set default subject based on context
  const getDefaultSubject = () => {
    if (productName) {
      return t('messages.messageAboutProduct') + ': ' + productName;
    }
    if (orderId) {
      return t('messages.messageAboutOrder') + ' #' + orderId;
    }
    return '';
  };

  // Set default message based on context
  const getDefaultMessage = () => {
    if (productName) {
      return t('messages.productInquiryTemplate', { productName });
    }
    if (orderId) {
      return t('messages.orderInquiryTemplate', { orderNumber: String(orderId) });
    }
    return '';
  };

  const handleOpenDialog = () => {
    if (!subject) {
      setSubject(getDefaultSubject());
    }
    if (!message) {
      setMessage(getDefaultMessage());
    }
    setIsOpen(true);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          message: message.trim(),
          subject: subject.trim(),
          productId,
          orderId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsOpen(false);
        setMessage('');
        setSubject('');
        
        // Navigate to messages page with the new conversation
        router.push(`/messages?conversation=${data.conversationId}`);
      } else {
        const error = await response.json();
        console.error('Failed to send message:', error);
        // TODO: Show toast notification
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Show toast notification
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      sendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={handleOpenDialog}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {t('messages.messageSeller')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('messages.messageSeller')} - {storeName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Context Info */}
          {(productName || orderId) && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {productName && (
                <div className="text-sm">
                  <span className="font-medium">{t('messages.thread.productInfo')}: </span>
                  <span className="text-gray-600 dark:text-gray-300">{productName}</span>
                </div>
              )}
              {orderId && (
                <div className="text-sm">
                  <span className="font-medium">{t('messages.thread.orderInfo')}: </span>
                  <span className="text-gray-600 dark:text-gray-300">#{orderId}</span>
                </div>
              )}
            </div>
          )}

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1">
              {t('messages.subject')} {t('common.optional')}
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('messages.subjectPlaceholder')}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              {t('messages.message')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('messages.composer.placeholder')}
              className="w-full p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('messages.sendShortcut')} (Cmd/Ctrl + Enter)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={sendMessage}
              disabled={!message.trim() || loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('messages.sending')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('messages.sendMessage')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}