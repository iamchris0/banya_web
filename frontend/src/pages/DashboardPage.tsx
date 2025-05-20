import React from 'react';
import Card from '../components/common/Card';

const DashboardPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800 p-6">
      <div className="flex-grow w-full max-w-7xl mx-auto">
        <Card title="Dashboard" className="bg-white border border-gray-200 shadow-sm">
          <div className="p-6 text-center">
            <p className="text-gray-600">Dashboard content will be updated soon.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;