'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatList from '@/components/ChatList';
import UserSearch from '@/components/UserSearch';
import ChatWindow from '@/components/ChatWindow';

// Define Chat type here to be used in state
interface Chat {
  id: string;
  participants: { user: { id: string; userName: string } }[];
}

export default function HomePage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [refreshChatsKey, setRefreshChatsKey] = useState(0);

  useEffect(() => {
    if (token === null) {
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        router.push('/login');
      }
    }
  }, [token, router]);

  const handleChatCreated = () => {
    setRefreshChatsKey((prevKey) => prevKey + 1);
  };
  
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen antialiased text-gray-800 dark:text-gray-200">
      <div className="flex flex-row h-full w-full overflow-x-hidden">
        {/* Left Panel */}
        <div className="flex flex-col w-80 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between h-16 border-b dark:border-gray-700 px-4">
            <h1 className="text-xl font-bold">Chats</h1>
            <button onClick={logout} className="text-sm text-red-500 hover:underline">
              Logout
            </button>
          </div>
          <UserSearch onChatCreated={handleChatCreated} />
          <ChatList
            onSelectChat={setSelectedChat}
            refreshKey={refreshChatsKey}
            selectedChatId={selectedChat?.id || null}
          />
        </div>

        {/* Right Panel */}
        <div className="flex flex-col flex-auto h-full bg-gray-50 dark:bg-gray-900">
          {selectedChat ? (
            <ChatWindow chat={selectedChat} />
          ) : (
            <div className="flex h-full p-4 items-center justify-center">
              <p className="text-gray-500">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}