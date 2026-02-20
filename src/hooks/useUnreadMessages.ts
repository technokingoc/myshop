import { useState, useEffect } from 'react';

export function useUnreadMessages(refreshInterval = 30000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/messages/conversations?unreadOnly=true');
        if (response.ok) {
          const data = await response.json();
          const totalUnread = data.conversations.reduce(
            (sum: number, conv: any) => sum + conv.unreadCount,
            0
          );
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Error fetching unread message count:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Set up polling
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchUnreadCount, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshInterval]);

  const refetch = async () => {
    setLoading(true);
    const response = await fetch('/api/messages/conversations?unreadOnly=true');
    if (response.ok) {
      const data = await response.json();
      const totalUnread = data.conversations.reduce(
        (sum: number, conv: any) => sum + conv.unreadCount,
        0
      );
      setUnreadCount(totalUnread);
    }
    setLoading(false);
  };

  return {
    unreadCount,
    loading,
    refetch,
  };
}