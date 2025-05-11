import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <header className="bg-green-900 text-white shadow-md">
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-semibold">BANYA N°1</span>
          </div>

          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md transition-colors ${
                location.pathname === '/' ? 'bg-green-800 text-white' : 'text-white hover:bg-green-800'
              }`}
            >
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="block text-green-200">Logged in as</span>
              <span className="font-medium">{user?.username} ({user?.role})</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-green-200 hover:text-white py-1 px-2 rounded-md hover:bg-green-800 transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;