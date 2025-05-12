import React from 'react';

interface CardProps {
  title?: React.ReactNode; // Changed from string to React.ReactNode
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, className, children }) => {
  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;