import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { FaUsers } from 'react-icons/fa';

const BASE = import.meta.env.VITE_BASE;

const ActiveUsers: React.FC = () => {
  const { user, isAuthenticated, token } = useAuth();
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const pollingIntervalRef = useRef<number>();

  // Get current page from pathname
  const getCurrentPage = () => {
    const path = location.pathname.split('/').pop() || 'dashboard';
    return path === '' ? 'dashboard' : path;
  };

  const fetchUsers = async () => {
    if (!user?.username || !isAuthenticated || !token) {
      return;
    }

    try {
      const currentPage = getCurrentPage();
      const response = await fetch(
        `${BASE}/api/active-users?page=${encodeURIComponent(currentPage)}&username=${encodeURIComponent(user.username)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.activeUsers) {
          // Sort users to keep current user at the top
          const sortedUsers = data.activeUsers.sort((a: string, b: string) => {
            if (a === user.username) return -1;
            if (b === user.username) return 1;
            return a.localeCompare(b);
          });
          setActiveUsers(sortedUsers);
          setUserCount(data.count || sortedUsers.length);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch users when location changes
  useEffect(() => {
    if (isAuthenticated && user?.username && token) {
      fetchUsers();
    }
  }, [location.pathname]);

  // Set up polling to update when other users join/leave
  useEffect(() => {
    if (isAuthenticated && user?.username && token) {
      // Initial fetch
      fetchUsers();
      
      // Set up polling every 2 seconds
      pollingIntervalRef.current = window.setInterval(fetchUsers, 1000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isAuthenticated, user?.username, token, location.pathname]);

  return (
    <div className="relative ml-4">
      <div 
        className="flex items-center space-x-2 text-green-200 hover:text-white transition-colors cursor-default"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <FaUsers size={18} />
        <span className="text-sm font-medium">{userCount}</span>
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
              <span className="text-sm font-medium text-gray-900">
                Active users
              </span>
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {activeUsers.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm italic">
                No users on this page
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