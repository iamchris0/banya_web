import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientInfo } from '../types';
import Card from '../components/common/Card';
import { FaCheck, FaArrowLeft, FaArrowRight, FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaRegEdit, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import SurveyModal from './AddInformationPage';
import { generateWeeklyReport } from '../utils/generateWeeklyReport';

const VerificationPage: React.FC = () => {
  const { token, user } = useAuth();
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date());
  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const [isHeadDataCollapsed, setIsHeadDataCollapsed] = useState(true);
  const [isReceptionDataCollapsed, setIsReceptionDataCollapsed] = useState(true);
  const [isBonusesCollapsed, setIsBonusesCollapsed] = useState(true);
  const [isWeeklySummaryCollapsed, setIsWeeklySummaryCollapsed] = useState(true);
  const [isPrebookedCollapsed, setIsPrebookedCollapsed] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const pollingIntervalRef = useRef<number>();
  const [canNavigateNext, setCanNavigateNext] = useState(false);
  const [canNavigatePrev, setCanNavigatePrev] = useState(true);

  const fetchUnverifiedClients = async () => {
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
      fetchUnverifiedClients();
      
      // Set up polling with a shorter interval
      pollingIntervalRef.current = setInterval(fetchUnverifiedClients, 2000); // Poll every 2 seconds
      
      // Cleanup function
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [token]);

  // Helper functions for date manipulation
  const getWeekStart = (date: Date) => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    return result;
  };

  const getWeekEnd = (date: Date) => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? 0 : 7);
    result.setDate(diff);
    return result;
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatWeekRange = (startDate: Date, endDate: Date) => {
    const startDay = startDate.getDate().toString().padStart(2, '0');
    const startMonth = startDate.toLocaleString('default', { month: 'long' });
    const endDay = endDate.getDate().toString().padStart(2, '0');
    const endMonth = endDate.toLocaleString('default', { month: 'long' });
    const year = startDate.getFullYear();
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  };

  const formatMonth = (date: Date) => {
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const getDayDate = (dayIndex: number, weekStart: Date) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  };

  const checkNavigationAvailability = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (viewType) {
      case 'daily':
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        setCanNavigateNext(nextDay.getTime() <= today.getTime());
        setCanNavigatePrev(true);
        break;
      case 'weekly':
        const nextWeekDate = new Date(selectedWeekDate);
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        nextWeekDate.setHours(0, 0, 0, 0);

        const maxWeekStart = new Date(today);
        maxWeekStart.setDate(maxWeekStart.getDate() + 7);
        maxWeekStart.setHours(0, 0, 0, 0);

        setCanNavigateNext(nextWeekDate.getTime() <= maxWeekStart.getTime());
        setCanNavigatePrev(true); // Always allow going back
        break;
      case 'monthly':
        const nextMonthDate = new Date(selectedMonthDate);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        nextMonthDate.setHours(0, 0, 0, 0);

        const maxMonthStart = new Date(today);
        maxMonthStart.setMonth(maxMonthStart.getMonth() + 1);
        maxMonthStart.setHours(0, 0, 0, 0);

        setCanNavigateNext(nextMonthDate.getTime() < maxMonthStart.getTime());
        setCanNavigatePrev(true); // Always allow going back
        break;
    }
  };

  useEffect(() => {
    checkNavigationAvailability();
  }, [viewType, selectedDate, selectedWeekDate, selectedMonthDate]);

  const handlePrevPeriod = () => {
    if (!canNavigatePrev) return;

    setIsTransitioning(true);
    setDirection('left');
    
    switch (viewType) {
      case 'daily':
        const newDailyDate = new Date(selectedDate);
        newDailyDate.setDate(newDailyDate.getDate() - 1);
        setTimeout(() => {
          setSelectedDate(newDailyDate);
          setIsTransitioning(false);
          setDirection(null);
        }, 200);
        break;
      case 'weekly':
        const newWeekDate = new Date(selectedWeekDate);
        newWeekDate.setDate(newWeekDate.getDate() - 7);
        setTimeout(() => {
          setSelectedWeekDate(newWeekDate);
          setIsTransitioning(false);
          setDirection(null);
        }, 200);
        break;
      case 'monthly':
        const newMonthDate = new Date(selectedMonthDate);
        newMonthDate.setMonth(newMonthDate.getMonth() - 1);
        setTimeout(() => {
          setSelectedMonthDate(newMonthDate);
          setIsTransitioning(false);
          setDirection(null);
        }, 200);
        break;
    }
  };

  const handleNextPeriod = () => {
    if (!canNavigateNext) return;

    setIsTransitioning(true);
    setDirection('right');
    
    switch (viewType) {
      case 'daily':
        const newDailyDate = new Date(selectedDate);
        newDailyDate.setDate(newDailyDate.getDate() + 1);
        setTimeout(() => {
          setSelectedDate(newDailyDate);
          setIsTransitioning(false);
          setDirection(null);
        }, 200);
        break;
      case 'weekly':
        const newWeekDate = new Date(selectedWeekDate);
        newWeekDate.setDate(newWeekDate.getDate() + 7);
        setTimeout(() => {
          setSelectedWeekDate(newWeekDate);
          setIsTransitioning(false);
          setDirection(null);
        }, 200);
        break;
      case 'monthly':
        const newMonthDate = new Date(selectedMonthDate);
        newMonthDate.setMonth(newMonthDate.getMonth() + 1);
        setTimeout(() => {
          setSelectedMonthDate(newMonthDate);
          setIsTransitioning(false);
          setDirection(null);
        }, 200);
        break;
    }
  };

  const filterClientsByDate = (clients: ClientInfo[], date: Date) => {
    return clients.filter((client) => {
      const clientDate = new Date(client.date);
      return clientDate.toDateString() === date.toDateString();
    });
  };

  const handleConfirm = async (clientId: number, verifyType: 'survey' | 'headData') => {
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
        body: JSON.stringify({ isVerified: true, verifyType }),
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

  const handleViewChange = (newViewType: 'daily' | 'weekly' | 'monthly') => {
    if (newViewType === viewType) return;
    setIsViewTransitioning(true);
    setTimeout(() => {
      setViewType(newViewType);
      setIsViewTransitioning(false);
    }, 200);
  };

  type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  type TreatmentKey = keyof NonNullable<typeof latestClient.treatments>;
  type BonusKey = keyof NonNullable<typeof latestClient.bonuses>;

  const handleTreatmentUpdate = async (treatment: TreatmentKey, isDone: boolean) => {
    if (!token || !latestClient?.id || !latestClient.treatments) {
      setError('No authentication token available or no client selected');
      return;
    }

    try {
      const updatedTreatments = {
        ...latestClient.treatments,
        [treatment]: {
          ...latestClient.treatments[treatment],
          done: isDone
        }
      };

      const response = await fetch(`http://localhost:2345/api/clients/${latestClient.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...latestClient,
          treatments: updatedTreatments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update treatment: ${response.status}`);
      }

      fetchUnverifiedClients();
    } catch (err) {
      console.error('Update treatment error:', err);
      setError(err instanceof Error ? err.message : 'Error updating treatment');
    }
  };

  const handleTreatmentAmountUpdate = async (treatment: TreatmentKey, amount: number) => {
    if (!token || !latestClient?.id || !latestClient.treatments) {
      setError('No authentication token available or no client selected');
      return;
    }

    try {
      const updatedTreatments = {
        ...latestClient.treatments,
        [treatment]: {
          ...latestClient.treatments[treatment],
          amount: amount
        }
      };

      const response = await fetch(`http://localhost:2345/api/clients/${latestClient.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...latestClient,
          treatments: updatedTreatments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update treatment amount: ${response.status}`);
      }

      fetchUnverifiedClients();
    } catch (err) {
      console.error('Update treatment amount error:', err);
      setError(err instanceof Error ? err.message : 'Error updating treatment amount');
    }
  };

  const handleFoodAndDrinkUpdate = async (value: number) => {
    if (!token || !latestClient?.id) {
      setError('No authentication token available or no client selected');
      return;
    }

    try {
      const response = await fetch(`http://localhost:2345/api/clients/${latestClient.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...latestClient,
          foodAndDrinkSales: value
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update food and drink sales: ${response.status}`);
      }

      // Refresh the client data
      fetchUnverifiedClients();
    } catch (err) {
      console.error('Update food and drink sales error:', err);
      setError(err instanceof Error ? err.message : 'Error updating food and drink sales');
    }
  };

  const handleClientUpdate = async (updates: Partial<ClientInfo>) => {
    if (!token || !latestClient?.id) {
      setError('No authentication token available or no client selected');
      return;
    }

    try {
      const response = await fetch(`http://localhost:2345/api/clients/${latestClient.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...latestClient,
          ...updates
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update client: ${response.status}`);
      }

      fetchUnverifiedClients();
    } catch (err) {
      console.error('Update client error:', err);
      setError(err instanceof Error ? err.message : 'Error updating client data');
    }
  };

  const filteredClients = filterClientsByDate(clients, selectedDate);
  const latestClient = filteredClients[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'edited':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchWeeklySummary = async (weekStart: Date) => {
    if (!token) {
      setError('No authentication token available');
      return;
    }
    try {
      const response = await fetch(`http://localhost:2345/api/clients/weekly-summary?weekStart=${weekStart.toISOString().split('T')[0]}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch weekly summary: ${response.status}`);
      }
      const data = await response.json();
      setWeeklySummary(data.summary);
    } catch (err) {
      console.error('Fetch weekly summary error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching weekly summary');
    }
  };

  useEffect(() => {
    if (viewType === 'weekly') {
      fetchWeeklySummary(selectedWeekDate);
    }
  }, [viewType, selectedWeekDate, token]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 p-6 overflow-auto">
      <div className="flex-grow w-full max-w-7xl mx-auto pb-20">
        {/* View Type Switcher */}
        <div className="mb-6 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex m-2">
            <button
              onClick={() => handleViewChange('daily')}
              className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                viewType === 'daily'
                  ? 'bg-green-100 text-green-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaCalendarDay />
              <span>Daily</span>
            </button>
            <button
              onClick={() => handleViewChange('weekly')}
              className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                viewType === 'weekly'
                  ? 'bg-green-100 text-green-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaCalendarWeek />
              <span>Weekly</span>
            </button>
            <button
              onClick={() => handleViewChange('monthly')}
              className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                viewType === 'monthly'
                  ? 'bg-green-100 text-green-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaCalendarAlt />
              <span>Monthly</span>
            </button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="mb-6 flex items-center justify-center space-x-4">
          <button 
            onClick={handlePrevPeriod} 
            className={`p-2 transition-colors ${
              canNavigatePrev 
                ? 'text-gray-800 hover:text-green-900' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canNavigatePrev}
          >
            <FaArrowLeft size={20} />
          </button>
          <span className="text-xl font-medium">
            {viewType === 'daily' && formatDate(selectedDate)}
            {viewType === 'weekly' && formatWeekRange(getWeekStart(selectedWeekDate), getWeekEnd(selectedWeekDate))}
            {viewType === 'monthly' && formatMonth(selectedMonthDate)}
          </span>
          <button 
            onClick={handleNextPeriod} 
            className={`p-2 transition-colors ${
              canNavigateNext 
                ? 'text-gray-800 hover:text-green-900' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canNavigateNext}
          >
            <FaArrowRight size={20} />
          </button>
        </div>

        {/* Content with Transitions */}
        <div className="relative">
          <div
            className={`w-full transition-all duration-300 ease-in-out ${
              isViewTransitioning
                ? 'opacity-0 scale-95'
                : 'opacity-100 scale-100'
            }`}
          >
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

              {viewType === 'daily' && (
                <>
                  {latestClient ? (
                    <div className="space-y-6">
                      {/* Head Data Zone */}
                      {(user?.role === 'head' || user?.role === 'boss') && (
                        <Card className="bg-white border border-gray-200 shadow-sm relative">
                          <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => setIsHeadDataCollapsed(!isHeadDataCollapsed)}
                                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  {isHeadDataCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
                                </button>
                                <h2 className="text-xl font-semibold text-gray-900">F&B Sales + Treatments</h2>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span
                                  className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(latestClient.status.headData)}`}
                                >
                                  {latestClient.status.headData.charAt(0).toUpperCase() + latestClient.status.headData.slice(1)}
                                </span>
                                {user?.role === 'head' && (
                                  <button
                                    onClick={() => handleConfirm(latestClient.id!, 'headData')}
                                    className={`p-2 transition-colors ${
                                      latestClient.id && latestClient.status.headData === 'edited'
                                        ? 'text-green-700 hover:text-green-900'
                                        : 'text-gray-400 cursor-not-allowed'
                                    }`}
                                    title="Confirm Head Data"
                                    disabled={!latestClient.id || latestClient.status.headData !== 'edited'}
                                  >
                                    <FaCheck size={20} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {!isHeadDataCollapsed && (
                              <div className="space-y-8">
                                {/* Food and Drink Sales */}
                                <div className="bg-gray-50 p-6 rounded-lg">
                                  <h3 className="text-lg font-medium text-gray-900 mb-4">F & B Sales</h3>
                                  <div className="bg-white p-4 rounded-md shadow-sm">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-2xl font-semibold text-blue-700">£</span>
                                      <input
                                        type="number"
                                        value={latestClient.foodAndDrinkSales || 0}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value) || 0;
                                          handleFoodAndDrinkUpdate(value);
                                        }}
                                        className="text-2xl font-semibold text-blue-700 w-full bg-transparent focus:outline-none px-2 py-1"
                                        min="0"
                                        step="0.01"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Treatments */}
                                <div className="bg-gray-50 p-6 rounded-lg">
                                  <h3 className="text-lg font-medium text-gray-900 mb-4">Treatments</h3>
                                  <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                    <div className="grid grid-cols-2 gap-4">
                                      {Object.entries(latestClient.treatments || {}).map(([treatment, data], index) => (
                                        <div
                                          key={index}
                                          className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-150"
                                          onClick={() => handleTreatmentUpdate(treatment as TreatmentKey, !data.done)}
                                          tabIndex={0}
                                          role="button"
                                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleTreatmentUpdate(treatment as TreatmentKey, !data.done); }}
                                        >
                                          <div
                                            className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all duration-200 ${
                                              data.done ? 'bg-green-500 border-green-600' : 'bg-white border-gray-300'
                                            }`}
                                            onClick={e => e.stopPropagation()}
                                            style={{ transition: 'background-color 0.2s, border-color 0.2s' }}
                                          >
                                            {data.done && (
                                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                              </svg>
                                            )}
                                          </div>
                                          <span
                                            className="text-sm font-medium text-gray-700 truncate max-w-[100px]"
                                            title={treatment.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, "'")}
                                          >
                                            {treatment.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, "'")}
                                          </span>
                                          <input
                                            type="number"
                                            value={data.amount || 0}
                                            onChange={e => {
                                              const value = parseFloat(e.target.value) || 0;
                                              handleTreatmentAmountUpdate(treatment as TreatmentKey, value);
                                            }}
                                            onFocus={e => {
                                              if (e.target.value === '0') {
                                                e.target.value = '';
                                              }
                                            }}
                                            onBlur={e => {
                                              if (e.target.value === '') {
                                                e.target.value = '0';
                                                handleTreatmentAmountUpdate(treatment as TreatmentKey, 0);
                                              }
                                            }}
                                            className="w-16 text-sm font-medium text-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1 text-right ml-auto"
                                            min="0"
                                            step="1"
                                            onClick={e => e.stopPropagation()}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="mt-4 bg-white p-4 rounded-md shadow-sm">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-700">Total Treatments</p>
                                      <p className="text-lg font-semibold text-blue-700">
                                        £{Object.values(latestClient.treatments || {}).reduce((sum, treatment) => sum + (treatment.amount || 0), 0)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      )}
                      
                      {/* Reception Data Zone */}
                      <Card className="bg-white border border-gray-200 shadow-sm relative">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => setIsReceptionDataCollapsed(!isReceptionDataCollapsed)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                {isReceptionDataCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
                              </button>
                              <h2 className="text-xl font-semibold text-gray-900">Reception Data</h2>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span
                                className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(latestClient.status.survey)}`}
                              >
                                {latestClient.status.survey.charAt(0).toUpperCase() + latestClient.status.survey.slice(1)}
                              </span>
                              {(user?.role === 'head' || user?.role === 'boss' || user?.role === 'admin') && (
                                <button
                                  onClick={() => {
                                    setSelectedClient(latestClient);
                                    setIsModalOpen(true);
                                  }}
                                  className="p-2 text-blue-700 hover:text-blue-800 transition-colors"
                                  title="Edit Survey"
                                >
                                  <FaRegEdit size={20} />
                                </button>
                              )}
                              {user?.role === 'head' && (
                                <button
                                  onClick={() => handleConfirm(latestClient.id!, 'survey')}
                                  className={`p-2 transition-colors ${
                                    latestClient.id && latestClient.status.survey === 'edited'
                                      ? 'text-green-700 hover:text-green-900'
                                      : 'text-gray-400 cursor-not-allowed'
                                  }`}
                                  title="Confirm Survey"
                                  disabled={!latestClient.id || latestClient.status.survey !== 'edited'}
                                >
                                  <FaCheck size={20} />
                                </button>
                              )}
                            </div>
                          </div>
                          {!isReceptionDataCollapsed && (
                            <div className="space-y-8">
                              {/* Status Marker and Buttons */}
                              <div className="flex justify-between items-center">
                                <div className="flex-1 flex items-center space-x-3">
                                  <span className="inline-block px-4 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                    Created: {latestClient.createdBy}
                                  </span>
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
                                        <p className="text-2xl font-semibold text-purple-700 text-center">{latestClient.amountOfPeople || 0}</p>
                                      </div>
                                      
                                      <div>
                                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                          <div className="grid grid-cols-2 gap-px bg-gray-200">
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Total</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.amountOfPeople || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">New Clients</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.newClients || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Male</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.male || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Female</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.female || 0}</p>
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
                                        <p className="text-2xl font-semibold text-green-700 text-center">
                                          {latestClient.englishSpeaking + latestClient.russianSpeaking || 0}
                                        </p>
                                      </div>
                                      
                                      <div>
                                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                          <div className="grid grid-cols-2 gap-px bg-gray-200">
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">English Speaking</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.englishSpeaking || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Russian Speaking</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.russianSpeaking || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Off-Peak</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.offPeakClients || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Peak-Time</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.peakTimeClients || 0}</p>
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
                                        <div className="flex justify-between items-center">
                                          <span className="text-2xl font-semibold text-blue-700">Total</span>
                                          <p className="text-2xl font-semibold text-blue-700 text-right">
                                            £{(latestClient.onlineMembershipsTotal || 0) + 
                                              (latestClient.offlineMembershipsTotal || 0) + 
                                              (latestClient.onlineVouchersTotal || 0) + 
                                              (latestClient.paperVouchersTotal || 0)}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="text-md font-medium text-gray-700 mb-3">Sales Breakdown</h4>
                                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                          <div className="grid grid-cols-2 gap-px bg-gray-200">
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Online Memberships</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.onlineMembershipsAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Online Memberships Total</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">£{latestClient.onlineMembershipsTotal || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Offline Memberships</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.offlineMembershipsAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Offline Memberships Total</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">£{latestClient.offlineMembershipsTotal || 0}</p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="bg-white rounded-md shadow-sm overflow-hidden mt-4">
                                          <div className="grid grid-cols-2 gap-px bg-gray-200">
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Online Vouchers</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.onlineVouchersAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Online Vouchers Total</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">£{latestClient.onlineVouchersTotal || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Paper Vouchers</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.paperVouchersAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Paper Vouchers Total</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">£{latestClient.paperVouchersTotal || 0}</p>
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
                                        <div className="flex justify-between items-center">
                                          <span className="text-2xl font-semibold text-green-700">Total</span>
                                          <p className="text-2xl font-semibold text-green-700 text-right">£{(latestClient.yottaLinksTotal || 0)}</p>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="text-md font-medium text-gray-700 mb-3">Transaction Breakdown</h4>
                                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                          <div className="grid grid-cols-2 gap-px bg-gray-200">
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Yotta Link</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.yottaLinksAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Yotta Link Total</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">£{latestClient.yottaLinksTotal || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Yotta Widget</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">{latestClient.yottaWidgetAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Yotta Widget Total</p>
                                              <p className="text-lg font-semibold text-gray-900 text-right">£{latestClient.yottaWidgetTotal || 0}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                      <div className="text-center p-4 text-gray-500">
                        <p>No survey data available for this date.</p>
                        <p className="text-sm mt-1">Add survey data to see details here.</p>
                      </div>
                    </Card>
                  )}
                </>
              )}

              {viewType === 'weekly' && (
                <div className="space-y-6">
                  {/* Weekly Summary Block */}
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setIsWeeklySummaryCollapsed(!isWeeklySummaryCollapsed)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            {isWeeklySummaryCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
                          </button>
                          <h2 className="text-xl font-semibold text-gray-900">Weekly Summary</h2>
                        </div>
                        {weeklySummary && (
                          <button
                            onClick={() => generateWeeklyReport(weeklySummary, selectedWeekDate.toISOString().split('T')[0])}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Export Excel</span>
                          </button>
                        )}
                      </div>
                      {!isWeeklySummaryCollapsed && weeklySummary && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                            {/* First column: Weekly Overview and Language & Timing */}
                            <div className="flex flex-col h-full gap-6">
                              <div className="bg-gray-50 p-4 rounded-lg flex-1 flex flex-col">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Clients</h3>
                                <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                  <div className="grid grid-cols-2 gap-px bg-gray-200">
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Total Visitors</p>
                                      <p className="text-sm font-semibold text-gray-900 m-2 text-right">{weeklySummary.totalVisitors}</p>
                                    </div>
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">New Clients</p>
                                      <p className="text-sm font-semibold text-gray-900 m-2 text-right">{weeklySummary.totalNewClients}</p>
                                    </div>
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Male</p>
                                      <p className="text-sm font-semibold text-gray-900 m-2 text-right">{weeklySummary.totalMale}</p>
                                    </div>
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Female</p>
                                      <p className="text-sm font-semibold text-gray-900 m-2 text-right">{weeklySummary.totalFemale}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg flex-1 flex flex-col">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Language & Timing</h3>
                                <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                  <div className="grid grid-cols-2 gap-px bg-gray-200">
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">English Speaking</p>
                                      <p className="text-sm font-semibold text-gray-900 m-2 text-right">{weeklySummary.totalEnglishSpeaking}</p>
                                    </div>
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Russian Speaking</p>
                                      <p className="text-sm font-semibold text-gray-900 m-2 text-right">{weeklySummary.totalRussianSpeaking}</p>
                                    </div>
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Off-Peak</p>
                                      <p className="text-sm font-semibold text-gray-900 m-2 text-right">{weeklySummary.totalOffPeak}</p>
                                    </div>
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Peak-Time</p>
                                      <p className="text-sm font-semibold text-gray-900 m-2 text-right">{weeklySummary.totalPeakTime}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Second column: Sales Overview and Transactions */}
                            <div className="flex flex-col h-full gap-6">
                              <div className="bg-gray-50 p-4 rounded-lg flex-1 flex flex-col">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Sales</h3>
                                <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                  <div className="grid grid-cols-2 gap-px bg-gray-200">
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Online Memberships</p>
                                      <div className="flex justify-between items-center m-2">
                                        <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalOnlineMemberships.amount}</p>
                                        <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalOnlineMemberships.value}</p>
                                      </div>
                                    </div>
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Offline Memberships</p>
                                      <div className="flex justify-between items-center m-2">
                                        <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalOfflineMemberships.amount}</p>
                                        <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalOfflineMemberships.value}</p>
                                      </div>
                                    </div>
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Online Vouchers</p>
                                      <div className="flex justify-between items-center m-2">
                                        <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalOnlineVouchers.amount}</p>
                                        <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalOnlineVouchers.value}</p>
                                      </div>
                                    </div>
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Paper Vouchers</p>
                                      <div className="flex justify-between items-center m-2">
                                        <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalPaperVouchers.amount}</p>
                                        <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalPaperVouchers.value}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg flex-1 flex flex-col">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Transactions</h3>
                                <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                  <div className="grid grid-cols-2 gap-px bg-gray-200">
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Yotta Links</p>
                                      <div className="flex justify-between items-center m-2">
                                        <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalYottaLinks.amount}</p>
                                        <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalYottaLinks.value}</p>
                                      </div>
                                    </div>
                                    <div className="bg-white p-2">
                                      <p className="text-xs text-gray-500 mb-2 ml-2">Yotta Widget</p>
                                      <div className="flex justify-between items-center m-2">
                                        <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalYottaWidget.amount}</p>
                                        <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalYottaWidget.value}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Third column: Treatments & Sales (spans both rows) */}
                            <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
                              <h3 className="text-lg font-medium text-gray-900 mb-3">Treatments & Kitchen</h3>
                              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                {/* Food and Drink Sales */}
                                <div className="p-3 border-b border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Food and Drink Sales</span>
                                    <span className="text-lg font-semibold text-blue-700">£{weeklySummary.totalFoodAndDrink}</span>
                                  </div>
                                </div>
                                {/* Treatments */}
                                <div className="grid grid-cols-2 gap-px bg-gray-200">
                                  {Object.entries(weeklySummary.treatments).map(([treatment, amount]) => (
                                    <div key={treatment} className="bg-white p-2">
                                      <p className="text-xs text-gray-500">{treatment.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, "'")}</p>
                                      <p className="text-sm font-semibold text-gray-900 text-right">{amount as number}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="bg-gray-50 p-2 flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">Total Treatments</span>
                                  <span className="text-sm font-semibold text-blue-700">
                                    £{Object.values(weeklySummary.treatments).reduce((sum: number, amount: any) => sum + (amount as number), 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Prebooked Data Block */}
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setIsPrebookedCollapsed(!isPrebookedCollapsed)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            {isPrebookedCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
                          </button>
                          <h2 className="text-xl font-semibold text-gray-900">Prebooked Data</h2>
                        </div>
                      </div>
                      {!isPrebookedCollapsed && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value (£)</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, index) => (
                                <tr key={day}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                    {day} ({getDayDate(index, getWeekStart(selectedWeekDate))})
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <input
                                      type="number"
                                      value={latestClient?.dailyPreBooked?.[day as DayOfWeek] || 0}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        const updatedPreBooked = {
                                          ...latestClient?.dailyPreBooked,
                                          [day]: value
                                        } as NonNullable<typeof latestClient.dailyPreBooked>;
                                        handleClientUpdate({ dailyPreBooked: updatedPreBooked });
                                      }}
                                      className="w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                                      min="0"
                                    />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <input
                                      type="number"
                                      value={latestClient?.dailyPreBookedValue?.[day as DayOfWeek] || 0}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        const updatedPreBookedValue = {
                                          ...latestClient?.dailyPreBookedValue,
                                          [day]: value
                                        } as NonNullable<typeof latestClient.dailyPreBookedValue>;
                                        handleClientUpdate({ dailyPreBookedValue: updatedPreBookedValue });
                                      }}
                                      className="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                                      min="0"
                                      step="0.01"
                                    />
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Total</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                  {Object.values(latestClient?.dailyPreBooked || {}).reduce((sum, val) => sum + val, 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                  £{Object.values(latestClient?.dailyPreBookedValue || {}).reduce((sum, val) => sum + val, 0).toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Bonuses Block */}
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setIsBonusesCollapsed(!isBonusesCollapsed)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            {isBonusesCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
                          </button>
                          <h2 className="text-xl font-semibold text-gray-900">Bonuses</h2>
                        </div>
                      </div>
                      {!isBonusesCollapsed && (
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { key: 'kitchenBonus', label: 'Kitchen Bonus F&B' },
                            { key: 'ondeskSalesBonus', label: 'Ondesk Sales Bonus' },
                            { key: 'miscBonus', label: 'Misc Bonus' },
                            { key: 'allPerformanceBonus', label: 'All Performance Bonus' },
                            { key: 'vouchersSalesBonus', label: 'Vouchers Sales Bonus' },
                            { key: 'membershipSalesBonus', label: 'Membership Sales Bonus' },
                            { key: 'privateBookingsBonus', label: 'Private Bookings Bonus' }
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">{label}</span>
                              <input
                                type="number"
                                value={latestClient?.bonuses?.[key as BonusKey] || 0}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  const updatedBonuses = {
                                    ...latestClient?.bonuses,
                                    [key]: value
                                  } as NonNullable<typeof latestClient.bonuses>;
                                  handleClientUpdate({ bonuses: updatedBonuses });
                                }}
                                className="w-32 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          ))}
                          <div className="col-span-2 mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Total Bonuses</span>
                              <span className="text-lg font-semibold text-gray-900">
                                £{Object.values(latestClient?.bonuses || {}).reduce((sum, bonus) => sum + bonus, 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {viewType === 'monthly' && (
                <div className="text-center p-4 text-gray-500">
                  <p>Monthly view content will be displayed here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating "+" Button - Only for admin */}
      {user?.role === 'admin' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 bg-green-900 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl hover:bg-green-800 transition-colors shadow-lg z-50"
        >
          +
        </button>
      )}

      {selectedClient && (
        <SurveyModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedClient(null);
          }}
          onSubmitSuccess={handleSubmitSuccess}
          initialData={selectedClient}
          selectedDate={selectedDate.toISOString().split('T')[0]}
        />
      )}
    </div>
  );
};

export default VerificationPage;