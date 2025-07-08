'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  userName: string;
}

interface UserSearchProps {
  onChatCreated: () => void;
}

export default function UserSearch({ onChatCreated }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);

  const searchUsers = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }
    try {
      const response = await api.get(`/api/users/search?query=${searchQuery}`);
      setResults(response.data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      // Visually handle error if necessary, no need to log
    }
  };

  const debouncedSearch = useCallback(searchUsers, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  const handleCreateChat = async (participantId: string) => {
    try {
      await api.post('/api/chats', { participantId });
      setQuery('');
      setResults([]);
      onChatCreated();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      // Visually handle error if necessary, no need to log
    }
  };

  return (
    <div className="relative p-4">
      <input
        type="text"
        placeholder="Search for users..."
        value={query}
        onChange={handleInputChange}
        className="w-full px-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
      />
      {results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700">
          {results.map((user) => (
            <li
              key={user.id}
              onClick={() => handleCreateChat(user.id)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {user.userName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}