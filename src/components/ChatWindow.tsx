'use client';

import { useEffect, useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

// Interfaces remain the same

export default function ChatWindow({ chat }: ChatWindowProps) {
  const { userId, socket } = useAuth();
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const otherParticipant = chat.participants.find(p => p.user.id !== userId)?.user;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setEvents([]); // Clear previous chat messages
    const fetchEvents = async () => {
      try {
        const response = await api.get(`/api/chats/${chat.id}/events`);
        setEvents(response.data);
      } catch (error) {
        console.error('Failed to fetch chat events:', error);
      }
    };
    fetchEvents();
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  useEffect(() => {
    if (!socket) return;

    const handleNewEvent = (event: ChatEvent) => {
      if (event.chatId === chat.id) {
        setEvents((prevEvents) => [...prevEvents, event]);
      }
    };

    socket.on('server:newEvent', handleNewEvent);

    return () => {
      socket.off('server:newEvent', handleNewEvent);
    };
  }, [socket, chat.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('client:sendMessage', {
        chatId: chat.id,
        content: newMessage,
      });
      setNewMessage('');
    }
  };

  // The JSX part of the component remains the same
  return (
    <div className="flex flex-col flex-auto h-full">
      {/* Chat Header */}
      <div className="flex items-center h-16 border-b dark:border-gray-700 px-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 text-white font-bold flex-shrink-0">
          {otherParticipant?.userName.charAt(0).toUpperCase()}
        </div>
        <div className="ml-3">
          <div className="font-semibold">{otherParticipant?.userName}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
        </div>
      </div>

      {/* Message History */}
      <div className="flex flex-col h-full overflow-x-auto p-6">
        <div className="grid grid-cols-12 gap-y-2">
          {events.map((event) => (
            event.sender.id === userId ? (
              // My Message
              <div key={event.id} className="col-start-6 col-end-13 p-3 rounded-lg">
                <div className="flex items-center justify-start flex-row-reverse">
                  <div className="relative max-w-xl px-4 py-2 text-white bg-indigo-500 rounded-xl shadow">
                    <span className="block">{event.payload.content}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-right mt-1">
                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, now })}
                </div>
              </div>
            ) : (
              // Other's Message
              <div key={event.id} className="col-start-1 col-end-8 p-3 rounded-lg">
                <div className="flex flex-row items-center">
                  <div className="relative max-w-xl px-4 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-xl shadow">
                    <span className="block">{event.payload.content}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-left mt-1">
                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, now })}
                </div>
              </div>
            )
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message Input */}
      <div className="p-6 border-t dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="w-full h-full flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-12 dark:bg-gray-700 dark:border-gray-600"
            />
            <button type="submit" className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white w-12 h-12 flex-shrink-0 ml-4">
              <svg className="w-6 h-6 transform rotate-45 -mr-px" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
        </form>
      </div>
    </div>
  );
}