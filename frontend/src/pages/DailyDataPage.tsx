import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import SurveyModal from './AddInformationPage';
import { ClientInfo, Status } from '../types';
import { FaArrowLeft, FaArrowRight, FaRegEdit, FaCheck } from 'react-icons/fa';

const DailyDataPage: React.FC = () => {
  const { token, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState<ClientInfo | undefined>(undefined);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const pollingIntervalRef = useRef<number>();

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
      const newClients = data.clients || [];
      
      // Sort clients by date in descending order (newest first)
      const sortedClients = newClients.sort((a: ClientInfo, b: ClientInfo) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setClients(sortedClients);
    } catch (err) {
      console.error('Fetch clients error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching client data');
    }
  };

  useEffect(() => {
    if (token) {
      // Initial fetch
      fetchClients();
      
      // Set up polling with a shorter interval
      pollingIntervalRef.current = setInterval(fetchClients, 2000); // Poll every 2 seconds
      
      // Cleanup function
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [token]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
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
    }, 200);
  };

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Check if the next date is more than 1 day ahead of current date
    const today = new Date();
    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 1);
    
    if (nextDate > maxAllowedDate) {
      return; // Don't allow navigation beyond tomorrow
    }
    
    setIsTransitioning(true);
    setDirection('right');
    setTimeout(() => {
      setSelectedDate(nextDate);
      setIsTransitioning(false);
      setDirection(null);
    }, 200);
  };

  const canNavigateToNextDay = (date: Date) => {
    const today = new Date();
    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 1);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    return nextDate <= maxAllowedDate;
  };

  const handleEdit = (client: ClientInfo) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleConfirm = async (client: ClientInfo) => {
    if (!token) {
      setError('No authentication token available');
      return;
    }
    if (!client.id) {
      setError('No data ID available. Please submit data first.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:2345/api/clients/${client.id}/verify`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVerified: true, status: 'Confirmed' as Status }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to verify client data: ${response.status}`);
      }
      fetchClients();
    } catch (err) {
      console.error('Verify client data error:', err);
      setError(err instanceof Error ? err.message : 'Error verifying client data');
    }
  };

  const handleSubmitSuccess = () => {
    fetchClients();
    setIsModalOpen(false);
    setSelectedClient(undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'edited':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredClients = filterClientsByDate(clients, selectedDate);
  const latestClient = filteredClients[0];

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800 p-6">
      <div className="flex-grow w-full max-w-7xl mx-auto">
        {/* Date Navigation */}
        <div className="mb-6 flex items-center justify-center space-x-4">
          <button onClick={handlePrevDay} className="p-2 text-gray-800 hover:text-green-900">
            <FaArrowLeft size={20} />
          </button>
          <span className="text-xl font-medium">{formatDate(selectedDate)}</span>
          {canNavigateToNextDay(selectedDate) && (
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
              : 'opacity-100 translate-x-0'
          }`}
        >
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Detailed Survey Card */}
          {latestClient && (
            <Card className="bg-white border border-gray-200 shadow-sm relative">
              <div className="p-6 space-y-8">
                {/* Status Marker and Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-sm font-medium pl-4 ${getStatusColor(latestClient.status)}`}
                    >
                      Status: {latestClient.status.charAt(0).toUpperCase() + latestClient.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {(user?.role === 'head' || user?.role === 'boss' || user?.role === 'admin') && (
                      <>
                        <button
                          onClick={() => handleEdit(latestClient)}
                          className="p-2 text-blue-700 hover:text-blue-800 transition-colors"
                          title="Edit Survey"
                        >
                          <FaRegEdit size={20} />
                        </button>
                        {user?.role === 'head' && (
                          <button
                            onClick={() => handleConfirm(latestClient)}
                            className={`p-2 transition-colors ${
                              latestClient.id && latestClient.status === 'edited'
                                ? 'text-green-700 hover:text-green-900'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title="Confirm Survey"
                            disabled={!latestClient.id || latestClient.status !== 'edited'}
                          >
                            <FaCheck size={20} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-8">
                  {/* First Row: General Information and Demographics & Timing */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* General Information */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">General Information</h3>
                      <div className="space-y-6">
                        <div className="bg-white p-4 rounded-md shadow-sm">
                          <p className="text-sm font-medium text-gray-700 mb-2">Total Visitors</p>
                          <p className="text-2xl font-semibold text-purple-700">{latestClient.amountOfPeople || 0}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-md font-medium text-gray-700 mb-3">Visitor Distribution</h4>
                          <div className="bg-white rounded-md shadow-sm overflow-hidden">
                            <div className="grid grid-cols-2 gap-px bg-gray-200">
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Total</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.amountOfPeople || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">New Clients</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.newClients || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Male</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.male || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Female</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.female || 0}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Demographics & Timing */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Demographics & Timing</h3>
                      <div className="space-y-6">
                        <div className="bg-white p-4 rounded-md shadow-sm">
                          <p className="text-sm font-medium text-gray-700 mb-2">Language Distribution</p>
                          <p className="text-2xl font-semibold text-green-700">
                            {latestClient.englishSpeaking + latestClient.russianSpeaking || 0}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-md font-medium text-gray-700 mb-3">Language Distribution</h4>
                          <div className="bg-white rounded-md shadow-sm overflow-hidden">
                            <div className="grid grid-cols-2 gap-px bg-gray-200">
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">English Speaking</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.englishSpeaking || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Russian Speaking</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.russianSpeaking || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Off-Peak</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.offPeakClients || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Peak-Time</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.peakTimeClients || 0}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Second Row: Sales Information and Transactions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sales Information */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Information</h3>
                      <div className="space-y-6">
                        <div className="bg-white p-4 rounded-md shadow-sm">
                          <p className="text-sm font-medium text-gray-700 mb-2">Total Sales</p>
                          <p className="text-2xl font-semibold text-blue-700">
                            £{(latestClient.onlineMembershipsTotal || 0) + 
                               (latestClient.offlineMembershipsTotal || 0) + 
                               (latestClient.onlineVouchersTotal || 0) + 
                               (latestClient.paperVouchersTotal || 0)}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-md font-medium text-gray-700 mb-3">Sales Breakdown</h4>
                          <div className="bg-white rounded-md shadow-sm overflow-hidden">
                            <div className="grid grid-cols-2 gap-px bg-gray-200">
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Online Memberships</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.onlineMembershipsAmount || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Online Memberships Total</p>
                                <p className="text-lg font-semibold text-gray-900">£{latestClient.onlineMembershipsTotal || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Offline Memberships</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.offlineMembershipsAmount || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Offline Memberships Total</p>
                                <p className="text-lg font-semibold text-gray-900">£{latestClient.offlineMembershipsTotal || 0}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-md shadow-sm overflow-hidden mt-4">
                            <div className="grid grid-cols-2 gap-px bg-gray-200">
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Online Vouchers</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.onlineVouchersAmount || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Online Vouchers Total</p>
                                <p className="text-lg font-semibold text-gray-900">£{latestClient.onlineVouchersTotal || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Paper Vouchers</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.paperVouchersAmount || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Paper Vouchers Total</p>
                                <p className="text-lg font-semibold text-gray-900">£{latestClient.paperVouchersTotal || 0}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transactions */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Transactions</h3>
                      <div className="space-y-6">
                        <div className="bg-white p-4 rounded-md shadow-sm">
                          <p className="text-sm font-medium text-gray-700 mb-2">Total Transactions</p>
                          <p className="text-2xl font-semibold text-green-700">
                            £{(latestClient.yottaLinksTotal || 0) + (latestClient.digitalBillTotal || 0)}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-md font-medium text-gray-700 mb-3">Transaction Breakdown</h4>
                          <div className="bg-white rounded-md shadow-sm overflow-hidden">
                            <div className="grid grid-cols-2 gap-px bg-gray-200">
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Yotta Link</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.yottaLinksAmount || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Yotta Link Total</p>
                                <p className="text-lg font-semibold text-gray-900">£{latestClient.yottaLinksTotal || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Yotta Widget</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.yottaWidgetAmount || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Yotta Widget Total</p>
                                <p className="text-lg font-semibold text-gray-900">£{latestClient.yottaWidgetTotal || 0}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-md shadow-sm overflow-hidden mt-4">
                            <div className="grid grid-cols-2 gap-px bg-gray-200">
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Digital Bill</p>
                                <p className="text-lg font-semibold text-gray-900">{latestClient.digitalBillAmount || 0}</p>
                              </div>
                              <div className="bg-white p-3">
                                <p className="text-xs text-gray-500 mb-1">Digital Bill Total</p>
                                <p className="text-lg font-semibold text-gray-900">£{latestClient.digitalBillTotal || 0}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!latestClient && (
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="text-center p-4 text-gray-500">
                <p>No survey data available for this date.</p>
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