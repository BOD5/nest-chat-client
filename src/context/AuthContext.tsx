'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { io, Socket } from 'socket.io-client';

interface DecodedToken {
  sub: string;
  userName: string;
}

interface AuthContextType {
  token: string | null;
  userId: string | null;
  socket: Socket | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();

  const handleSetToken = useCallback((newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('authToken', newToken);
      const decoded: DecodedToken = jwtDecode(newToken);
      setUserId(decoded.sub);

      const newSocket = io(process.env.NEXT_PUBLIC_API_URL!, {
        extraHeaders: {
          Authorization: `Bearer ${newToken}`,
        },
      });
      setSocket(newSocket);
    } else {
      localStorage.removeItem('authToken');
      setUserId(null);
      setSocket((socket) => {
        socket?.disconnect();
        return null;
      });
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      handleSetToken(storedToken);
    }
  }, [handleSetToken]);

  const logout = () => {
    handleSetToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ token, userId, socket, setToken: handleSetToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}