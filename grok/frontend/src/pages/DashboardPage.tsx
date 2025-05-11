import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Card from '../components/common/Card';
import SurveyModal from './AddInformationPage';
import { useAuth } from '../context/AuthContext';
import { ClientInfo } from '../types';

const DashboardPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [error, setError] = useState('');
  const { token, isAuthenticated } = useAuth();
  const [dateRange, setDateRange] = useState('today');

  const fetchClients = async () => {
    if (!token) {
      setError('No authentication token available');
      return;
    }
    setError('');
    try {
      const response = await fetch('http://localhost:2345/api/clients', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch clients: ${response.status}`);
      }
      const data = await response.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error('Fetch clients error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching client data');
    }
  };

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchClients();
    }
  }, [token, isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const filterClientsByDate = (clients: ClientInfo[], range: string) => {
    const now = new Date();
    return clients.filter((client) => {
      const clientDate = new Date(client.date);
      switch (range) {
        case 'today':
          return clientDate.toDateString() === now.toDateString();
        case 'last7':
          return clientDate >= new Date(now.setDate(now.getDate() - 7));
        case 'last30':
          return clientDate >= new Date(now.setDate(now.getDate() - 30));
        case 'all':
          return true;
        default:
          return false;
      }
    });
  };

  const filteredClients = filterClientsByDate(clients, dateRange);
  const totalClients = filteredClients.reduce((sum, client) => sum + (client.amountOfPeople || 0), 0);
  const pendingClients = filteredClients.filter((client) => !client.isVerified).length;
  const verifiedClients = filteredClients.filter((client) => client.isVerified).length;
  const latestClient = filteredClients[0];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col pt-6 relative">
      <div className="w-full max-w-7xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Date Range Selector */}
        <div className="mb-6">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full md:w-auto p-2 border border-gray-300 rounded-lg bg-white text-gray-800"
          >
            <option value="today">Today</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="text-center">
              <h3 className="text-xl font-medium text-blue-800 mb-2">Total People</h3>
              <p className="text-3xl font-bold text-blue-900">{totalClients}</p>
              <p className="text-sm text-blue-700 mt-1">Total visitors</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
            <div className="text-center">
              <h3 className="text-xl font-medium text-amber-800 mb-2">Pending</h3>
              <p className="text-3xl font-bold text-amber-900">{pendingClients}</p>
              <p className="text-sm text-amber-700 mt-1">Pending verification</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="text-center">
              <h3 className="text-xl font-medium text-green-800 mb-2">Verified</h3>
              <p className="text-3xl font-bold text-green-900">{verifiedClients}</p>
              <p className="text-sm text-green-700 mt-1">Verified entries</p>
            </div>
          </Card>
        </div>

        {/* Detailed Recent Survey Card */}
        {latestClient && (
          <Card title="Latest Survey" className="bg-white border border-gray-200 shadow-sm">
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(latestClient.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600"><strong>Total Visitors:</strong> {latestClient.amountOfPeople || 0}</p>
                <p className="text-sm text-gray-600"><strong>Male:</strong> {latestClient.male || 0}</p>
                <p className="text-sm text-gray-600"><strong>Female:</strong> {latestClient.female || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600"><strong>New Clients:</strong> {latestClient.newClients || 0}</p>
                <p className="text-sm text-gray-600"><strong>English Speaking:</strong> {latestClient.englishSpeaking || 0}</p>
                <p className="text-sm text-gray-600"><strong>Russian Speaking:</strong> {latestClient.russianSpeaking || 0}</p>
                <p className="text-sm text-gray-600"><strong>Created By:</strong> {latestClient.createdBy}</p>
                <p className="text-sm text-gray-600"><strong>Status:</strong> {latestClient.isVerified ? 'Verified' : 'Pending'}</p>
              </div>
            </div>
          </Card>
        )}
        {!latestClient && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="text-center p-4 text-gray-500">
              <p>No recent survey data to display.</p>
              <p className="text-sm mt-1">Add survey data to see details here.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Floating "+" Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-green-900 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl hover:bg-green-800 transition-colors shadow-lg"
      >
        +
      </button>

      {/* Survey Modal */}
      <SurveyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={fetchClients}
      />
    </div>
  );
};

export default DashboardPage;