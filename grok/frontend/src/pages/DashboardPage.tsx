import React from 'react';
import Card from '../components/common/Card';

const DashboardPage: React.FC = () => {


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center p-6">
      <div className="w-full max-w-4xl">
        
        <Card className="bg-white border border-gray-200 mb-6 shadow-sm">
          <p className="text-gray-600 p-4">
            Welcome to the Banya N°1 Administration System. Check your dashboard overview below.
          </p>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center p-4">
              <h3 className="text-lg font-medium text-green-700 mb-2">Clients</h3>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500 mt-1">Total clients</p>
            </div>
          </Card>
          
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center p-4">
              <h3 className="text-lg font-medium text-green-700 mb-2">Verified</h3>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500 mt-1">Verified entries</p>
            </div>
          </Card>
          
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center p-4">
              <h3 className="text-lg font-medium text-green-700 mb-2">Pending</h3>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500 mt-1">Pending verification</p>
            </div>
          </Card>
        </div>
        
        <Card className="bg-white border border-gray-200 shadow-sm">
          <div className="text-center p-4 text-gray-500">
            <p>No recent activity to display.</p>
            <p className="text-sm mt-1">Add information to see updates here.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;