'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// Interfaces remain the same

export default function ChatList({ onSelectChat, refreshKey, selectedChatId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState('');
  const { userId, socket } = useAuth();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await api.get('/api/chats');
        setChats(response.data);
      } catch (err) {
        setError('Failed to fetch chats');
      }
    };
    if (userId) {
      fetchChats();
    }
  }, [refreshKey, userId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewEvent = (event: any) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === event.chatId ? { ...chat, events: [event] } : chat
        )
      );
    };

    socket.on('server:newEvent', handleNewEvent);

    return () => {
      socket.off('server:newEvent', handleNewEvent);
    };
  }, [socket]);

  // The rest of the component remains the same
  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((p) => p.user.id !== userId)?.user;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {chats.map((chat) => {
        const otherUser = getOtherParticipant(chat);
        if (!otherUser) return null;

        const lastEvent = chat.events[0];
        const isActive = chat.id === selectedChatId;
        
        return (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`flex flex-row items-center p-4 cursor-pointer ${
              isActive ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 text-white font-bold flex-shrink-0">
              {otherUser.userName.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <div className="font-semibold">{otherUser.userName}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {lastEvent ? lastEvent.payload.content : 'No messages yet.'}
              </p>
            </div>
          </div>
        );
      })}
      {chats.length === 0 && (
        <p className="p-4 text-sm text-gray-500">No chats yet. Use search to start one.</p>
      )}
       {error && <p className="p-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}