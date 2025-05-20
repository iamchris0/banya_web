import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      <Header />
      <main className="flex-grow p-6 overflow-hidden">
        <div className="container mx-auto max-w-12xl h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;