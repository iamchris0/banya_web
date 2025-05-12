import React from 'react';
import Card from '../components/common/Card';

const WeeklyDataPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800 p-6">
      <div className="flex-grow w-full max-w-7xl mx-auto">
        <Card title="Weekly Data" className="bg-white border border-gray-200 shadow-sm">
          <div className="p-6 text-center">
            <p className="text-gray-600">Weekly data summary will be displayed here.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WeeklyDataPage;