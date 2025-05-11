import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    setTimeout(() => {
      const success = login(username, password);
      
      if (success) {
        navigate('/');
      } else {
        setError('Invalid username or password');
      }
      setIsLoading(false);
    }, 800);
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white border border-gray-200 shadow-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-green-900">BANYA N°1 ADMIN</h1>
          <p className="text-gray-500 mt-1">Please sign in to manage your account</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="username"
            type="text"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="bg-white border-gray-200"
            required
          />
          
          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="bg-white border-gray-200"
            required
          />
          
          <div className="mt-6">
            <Button
              type="submit"
              className="w-full bg-green-700 text-white hover:bg-green-800 transition-colors"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-center text-gray-500">
            <p>For testing: Use admin / 123</p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;