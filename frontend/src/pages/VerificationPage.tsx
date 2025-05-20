import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientInfo } from '../types';
import Card from '../components/common/Card';
import { FaRegEdit, FaCheck, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import SurveyModal from './AddInformationPage';

const VerificationPage: React.FC = () => {
  const { token } = useAuth();
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const fetchUnverifiedClients = async () => {
    if (!token) {
      setError('No authentication token available');
      return;
    }
    setError('');
    try {
      const response = await fetch('http://localhost:2345/api/clients?verified=false', {
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
    if (token) {
      fetchUnverifiedClients();
    }
  }, [token]);

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const filterClientsByDate = (clients: ClientInfo[], date: Date) => {
    return clients.filter((client) => {
      const clientDate = new Date(client.date);
      return clientDate.toDateString() === date.toDateString();
    });
  };

  const handlePrevDay = () => {
    setIsTransitioning(true);
    setDirection('left');
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setTimeout(() => {
      setSelectedDate(newDate);
      setIsTransitioning(false);
      setDirection(null);
    }, 200); // Match transition duration
  };

  const handleNextDay = () => {
    setIsTransitioning(true);
    setDirection('right');
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setTimeout(() => {
      setSelectedDate(newDate);
      setIsTransitioning(false);
      setDirection(null);
    }, 200); // Match transition duration
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleEdit = (client: ClientInfo) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleConfirm = async (clientId: number) => {
    if (!token) {
      setError('No authentication token available');
      return;
    }
    try {
      const response = await fetch(`http://localhost:2345/api/clients/${clientId}/verify`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVerified: true }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to verify client: ${response.status}`);
      }
      fetchUnverifiedClients(); // Refresh the list
    } catch (err) {
      console.error('Verify client error:', err);
      setError(err instanceof Error ? err.message : 'Error verifying client data');
    }
  };

  const handleSubmitSuccess = () => {
    fetchUnverifiedClients();
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const filteredClients = filterClientsByDate(clients, selectedDate);

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800 p-6">
      <div className="flex-grow w-full max-w-7xl mx-auto">
        {/* Date Navigation */}
        <div className="mb-6 flex items-center justify-center space-x-4">
          <button onClick={handlePrevDay} className="p-2 text-gray-800 hover:text-green-900">
            <FaArrowLeft size={20} />
          </button>
          <span className="text-xl font-medium">{formatDate(selectedDate)}</span>
          {!isToday(selectedDate) && (
            <button onClick={handleNextDay} className="p-2 text-gray-800 hover:text-green-900">
              <FaArrowRight size={20} />
            </button>
          )}
        </div>

        {/* Content with Transition */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isTransitioning
              ? direction === 'left'
                ? 'opacity-0 translate-x-5'
                : 'opacity-0 -translate-x-5'
              : 'opacity-150 translate-x-0'
          }`}
        >
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {filteredClients.length === 0 && !error && (
            <div className="text-center p-4 text-gray-500">
              <p>No unverified survey data for this date.</p>
            </div>
          )}

          {filteredClients.length > 0 && (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="bg-white border border-gray-200 shadow-sm relative"
                >
                  <div className="p-6 space-y-8">
                    {/* Title and Buttons */}
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">
                        Created by: {client.createdBy}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-2 text-blue-700 hover:text-blue-800 transition-colors"
                          title="Edit Survey"
                        >
                          <FaRegEdit size={20} />
                        </button>
                        <button
                          onClick={() => handleConfirm(client.id!)}
                          className="p-2 text-green-700 hover:text-green-900 transition-colors"
                          title="Confirm Survey"
                        >
                          <FaCheck size={20} />
                        </button>
                      </div>
                    </div>
                    {/* First Horizontal Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* General Information */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">General Information</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <p className="text-sm text-gray-600"><strong>Total Visitors:</strong> {client.amountOfPeople || 0}</p>
                            <p className="text-sm text-gray-600"><strong>New Clients:</strong> {client.newClients || 0}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <p className="text-sm text-gray-600"><strong>Male:</strong> {client.male || 0}</p>
                            <p className="text-sm text-gray-600"><strong>Female:</strong> {client.female || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Demographics & Timing */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Demographics & Timing</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <p className="text-sm text-gray-600"><strong>English Speaking:</strong> {client.englishSpeaking || 0}</p>
                            <p className="text-sm text-gray-600"><strong>Russian Speaking:</strong> {client.russianSpeaking || 0}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <p className="text-sm text-gray-600"><strong>Off-Peak:</strong> {client.offPeakClients || 0}</p>
                            <p className="text-sm text-gray-600"><strong>Peak-Time:</strong> {client.peakTimeClients || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Second Horizontal Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Sales Information */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <p className="text-sm text-gray-600"><strong>Vouchers Sold:</strong> {client.soldVouchersAmount || 0}</p>
                          <p className="text-sm text-gray-600"><strong>Vouchers Total (£):</strong> {client.soldVouchersTotal || 0}</p>
                          <p className="text-sm text-gray-600"><strong>Memberships Sold:</strong> {client.soldMembershipsAmount || 0}</p>
                          <p className="text-sm text-gray-600"><strong>Memberships Total (£):</strong> {client.soldMembershipsTotal || 0}</p>
                        </div>
                      </div>

                      {/* Yotta Transactions */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Yotta Transactions</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <p className="text-sm text-gray-600"><strong>Deposits:</strong> {client.yottaDepositsAmount || 0}</p>
                          <p className="text-sm text-gray-600"><strong>Deposits Total (£):</strong> {client.yottaDepositsTotal || 0}</p>
                          <p className="text-sm text-gray-600"><strong>Links:</strong> {client.yottaLinksAmount || 0}</p>
                          <p className="text-sm text-gray-600"><strong>Links Total (£):</strong> {client.yottaLinksTotal || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedClient && (
        <SurveyModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedClient(null);
          }}
          onSubmitSuccess={handleSubmitSuccess}
          initialData={selectedClient}
        />
      )}
    </div>
  );
};

export default VerificationPage;