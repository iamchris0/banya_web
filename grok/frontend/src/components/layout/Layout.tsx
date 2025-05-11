import React, { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      <Header />
      <main className="flex-grow p-6">
        <div className="container mx-auto">{children}</div>
      </main>
      <footer className="bg-green-100 text-green-600 py-4">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Banya N°1 Admin. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;