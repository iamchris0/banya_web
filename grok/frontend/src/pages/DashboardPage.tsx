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

  const totalClients = clients.reduce((sum, client) => sum + (client.amountOfPeople || 0), 0);
  const pendingClients = clients.filter((client) => !client.isVerified).length;
  const verifiedClients = clients.filter((client) => client.isVerified).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col pt-6 relative">
      <div className="w-full max-w-7xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
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
        <Card className="bg-white border border-gray-200 shadow-sm">
          {clients.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              <p>No recent activity to display.</p>
              <p className="text-sm mt-1">Add survey data to see updates here.</p>
            </div>
          ) : (
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Surveys</h3>
              <ul className="space-y-4">
                {clients.slice(0, 5).map((client) => (
                  <li key={client.id} className="border-b border-gray-200 pb-2">
                    <p className="text-sm text-gray-600">
                      Survey on {new Date(client.date).toLocaleDateString()}: {client.amountOfPeople || 0} people,{' '}
                      {client.newClients || 0} new clients
                    </p>
                    <p className="text-xs text-gray-500">
                      Added by {client.createdBy} • {client.isVerified ? 'Verified' : 'Pending'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
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