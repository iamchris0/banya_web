import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { FaUsers } from 'react-icons/fa';

const ActiveUsers: React.FC = () => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [isHovered, setIsHovered] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const location = useLocation();

  // Get current page from pathname
  const getCurrentPage = () => {
    const path = location.pathname.split('/').pop() || 'dashboard';
    return path === '' ? 'dashboard' : path;
  };

  useEffect(() => {
    if (!user?.username) {
      return;
    }

    const currentPage = getCurrentPage();

    // Close existing connection if it exists
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Create new connection for current page
    const ws = new WebSocket(
      `ws://localhost:2345?username=${encodeURIComponent(user.username)}&page=${encodeURIComponent(currentPage)}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.activeUsers && data.page === currentPage) {
          setActiveUsers(data.activeUsers);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      if (wsRef.current === ws) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?.username, location.pathname]);

  return (
    <div className="relative ml-4">
      <div 
        className="flex items-center space-x-2 text-green-200 hover:text-white transition-colors cursor-default"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <FaUsers size={18} />
        <span className="text-sm font-medium">{activeUsers.length}</span>
      </div>

      {isHovered && (
        <div 
          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <FaUsers className="text-gray-600" size={14} />
              <span className="text-sm font-medium text-gray-900">Active Users</span>
            </div>
          </div>
          
          {connectionStatus === 'error' && (
            <div className="px-3 py-1.5 text-red-500 text-xs bg-red-50">
              Reconnecting...
            </div>
          )}
          {connectionStatus === 'connecting' && (
            <div className="px-3 py-1.5 text-gray-500 text-xs bg-gray-50">
              Connecting...
            </div>
          )}
          
          <div className="max-h-48 overflow-y-auto">
            {activeUsers.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm italic">
                No active users
              </div>
            ) : (
              activeUsers.map((username) => (
                <div
                  key={username}
                  className={`px-3 py-1.5 text-sm ${
                    username === user?.username 
                      ? 'bg-green-50 text-green-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {username}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers; 