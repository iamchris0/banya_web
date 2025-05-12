import React, { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      <Header />
      <main className="flex-grow p-6 overflow-hidden">
        <div className="container mx-auto max-w-12xl h-full">{children}</div>
      </main>
    </div>
  );
};

export default Layout;