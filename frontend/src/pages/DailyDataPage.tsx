import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import SurveyModal from './AddInformationPage';
import { ClientInfo } from '../types';
import { FaArrowLeft, FaArrowRight, FaRegEdit } from 'react-icons/fa';

const DailyDataPage: React.FC = () => {
  const { token, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState<ClientInfo | undefined>(undefined);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

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
    if (token) {
      fetchClients();
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

  const handleSubmitSuccess = () => {
    fetchClients();
    setIsModalOpen(false);
    setSelectedClient(undefined);
  };

  const filteredClients = filterClientsByDate(clients, selectedDate);
  const totalClients = filteredClients.reduce((sum, client) => sum + (client.amountOfPeople || 0), 0);
  const pendingClients = filteredClients.filter((client) => !client.isVerified).length;
  const verifiedClients = filteredClients.filter((client) => client.isVerified).length;
  const latestClient = filteredClients[0];

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800 p-6 relative">
      <div className="flex-grow w-full max-w-7xl mx-auto flex flex-col">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

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

        {/* Statistics Cards and Survey Card with Transition */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isTransitioning
              ? direction === 'left'
                ? 'opacity-0 translate-x-5'
                : 'opacity-0 -translate-x-5'
              : 'opacity-100 translate-x-0'
          }`}
        >
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
            <Card
              className="bg-white border border-gray-200 shadow-sm flex-grow overflow-auto relative"
            >
              <div className="p-6 space-y-8">
                {/* Status Oval and Edit Button */}
                <div className="flex justify-between items-center">
                  <span
                    className={`inline-block px-4 py-1 rounded-full text-sm font-medium pl-4 ${
                      latestClient.isVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Status: {latestClient.isVerified ? 'Verified' : 'Pending'}
                  </span>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleEdit(latestClient)}
                      className="p-2 text-blue-700 hover:text-blue-800 transition-colors"
                      title="Edit Survey"
                    >
                      <FaRegEdit size={20} />
                    </button>
                  )}
                </div>
                {/* First Horizontal Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Information */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">General Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm text-gray-600"><strong>Total Visitors:</strong> {latestClient.amountOfPeople || 0}</p>
                        <p className="text-sm text-gray-600"><strong>New Clients:</strong> {latestClient.newClients || 0}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm text-gray-600"><strong>Male:</strong> {latestClient.male || 0}</p>
                        <p className="text-sm text-gray-600"><strong>Female:</strong> {latestClient.female || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Demographics & Timing */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Demographics & Timing</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm text-gray-600"><strong>English Speaking:</strong> {latestClient.englishSpeaking || 0}</p>
                        <p className="text-sm text-gray-600"><strong>Russian Speaking:</strong> {latestClient.russianSpeaking || 0}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm text-gray-600"><strong>Off-Peak:</strong> {latestClient.offPeakClients || 0}</p>
                        <p className="text-sm text-gray-600"><strong>Peak-Time:</strong> {latestClient.peakTimeClients || 0}</p>
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
                      <p className="text-sm text-gray-600"><strong>Vouchers Sold:</strong> {latestClient.soldVouchersAmount || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Vouchers Total (£):</strong> {latestClient.soldVouchersTotal || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Memberships Sold:</strong> {latestClient.soldMembershipsAmount || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Memberships Total (£):</strong> {latestClient.soldMembershipsTotal || 0}</p>
                    </div>
                  </div>

                  {/* Yotta Transactions */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Yotta Transactions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm text-gray-600"><strong>Deposits:</strong> {latestClient.yottaDepositsAmount || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Deposits Total (£):</strong> {latestClient.yottaDepositsTotal || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Links:</strong> {latestClient.yottaLinksAmount || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Links Total (£):</strong> {latestClient.yottaLinksTotal || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
          {!latestClient && (
            <Card className="bg-white border border-gray-200 shadow-sm flex-grow">
              <div className="text-center p-4 text-gray-500">
                <p>No recent survey data to display.</p>
                <p className="text-sm mt-1">Add survey data to see details here.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Floating "+" Button - Only for admin */}
      {user?.role === 'admin' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 bg-green-900 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl hover:bg-green-800 transition-colors shadow-lg"
        >
          +
        </button>
      )}

      <SurveyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClient(undefined);
        }}
        onSubmitSuccess={handleSubmitSuccess}
        initialData={selectedClient}
      />
    </div>
  );
};

export default DailyDataPage;