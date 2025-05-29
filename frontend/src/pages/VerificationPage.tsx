import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientInfo } from '../types';
import Card from '../components/common/Card';
import { FaCheck, FaArrowLeft, FaArrowRight, FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaRegEdit, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import SurveyModal from './AddInformationPage';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const VerificationPage: React.FC = () => {
  const { token, user } = useAuth();
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null);
  const [selectedDailyDate, setSelectedDailyDate] = useState(new Date());
  const [selectedWeeklyDate, setSelectedWeeklyDate] = useState(new Date());
  const [selectedMonthlyDate, setSelectedMonthlyDate] = useState(new Date());
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const [isHeadDataCollapsed, setIsHeadDataCollapsed] = useState(true);
  const [isReceptionDataCollapsed, setIsReceptionDataCollapsed] = useState(true);
  const [isPrebookedDataCollapsed, setIsPrebookedDataCollapsed] = useState(false);
  const [isSalesSummaryCollapsed, setIsSalesSummaryCollapsed] = useState(true);
  const [isKitchenOperationsCollapsed, setIsKitchenOperationsCollapsed] = useState(true);
  const pollingIntervalRef = useRef<number>();

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

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Function to get week start (Monday) and end (Sunday) dates
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return { start, end };
  };

  // Function to get current selected date based on view type
  const getCurrentSelectedDate = () => {
    switch (viewType) {
      case 'daily':
        return selectedDailyDate;
      case 'weekly':
        return selectedWeeklyDate;
      case 'monthly':
        return selectedMonthlyDate;
      default:
        return selectedDailyDate;
    }
  };

  // Function to set current selected date based on view type
  const setCurrentSelectedDate = (date: Date) => {
    switch (viewType) {
      case 'daily':
        setSelectedDailyDate(date);
        break;
      case 'weekly':
        setSelectedWeeklyDate(date);
        break;
      case 'monthly':
        setSelectedMonthlyDate(date);
        break;
    }
  };

  // Function to handle navigation based on view type
  const handlePrev = () => {
    setIsTransitioning(true);
    setDirection('left');
    const currentDate = getCurrentSelectedDate();
    const newDate = new Date(currentDate);
    
    switch (viewType) {
      case 'daily':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }

    setTimeout(() => {
      setCurrentSelectedDate(newDate);
      setIsTransitioning(false);
      setDirection(null);
    }, 200);
  };

  const handleNext = () => {
    setIsTransitioning(true);
    setDirection('right');
    const currentDate = getCurrentSelectedDate();
    const newDate = new Date(currentDate);
    
    switch (viewType) {
      case 'daily':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }

    setTimeout(() => {
      setCurrentSelectedDate(newDate);
      setIsTransitioning(false);
      setDirection(null);
    }, 200);
  };

  // Function to filter clients based on view type
  const filterClientsByViewType = (clients: ClientInfo[], date: Date) => {
    switch (viewType) {
      case 'daily':
        return clients.filter((client) => {
          const clientDate = new Date(client.date);
          return clientDate.toDateString() === date.toDateString();
        });
      case 'weekly': {
        const { start, end } = getWeekDates(date);
        return clients.filter((client) => {
          const clientDate = new Date(client.date);
          return clientDate >= start && clientDate <= end;
        });
      }
      case 'monthly': {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return clients.filter((client) => {
          const clientDate = new Date(client.date);
          return clientDate >= monthStart && clientDate <= monthEnd;
        });
      }
      default:
        return clients;
    }
  };

  // Function to aggregate data for weekly and monthly views
  const aggregateClientData = (clients: ClientInfo[]) => {
    if (clients.length === 0) return null;

    const aggregatedData = clients.reduce((acc, client) => {
      return {
        id: client.id,
        amountOfPeople: (acc.amountOfPeople || 0) + (client.amountOfPeople || 0),
        male: (acc.male || 0) + (client.male || 0),
        female: (acc.female || 0) + (client.female || 0),
        englishSpeaking: (acc.englishSpeaking || 0) + (client.englishSpeaking || 0),
        russianSpeaking: (acc.russianSpeaking || 0) + (client.russianSpeaking || 0),
        offPeakClients: (acc.offPeakClients || 0) + (client.offPeakClients || 0),
        peakTimeClients: (acc.peakTimeClients || 0) + (client.peakTimeClients || 0),
        newClients: (acc.newClients || 0) + (client.newClients || 0),
        onlineMembershipsAmount: (acc.onlineMembershipsAmount || 0) + (client.onlineMembershipsAmount || 0),
        onlineMembershipsTotal: (acc.onlineMembershipsTotal || 0) + (client.onlineMembershipsTotal || 0),
        offlineMembershipsAmount: (acc.offlineMembershipsAmount || 0) + (client.offlineMembershipsAmount || 0),
        offlineMembershipsTotal: (acc.offlineMembershipsTotal || 0) + (client.offlineMembershipsTotal || 0),
        onlineVouchersAmount: (acc.onlineVouchersAmount || 0) + (client.onlineVouchersAmount || 0),
        onlineVouchersTotal: (acc.onlineVouchersTotal || 0) + (client.onlineVouchersTotal || 0),
        paperVouchersAmount: (acc.paperVouchersAmount || 0) + (client.paperVouchersAmount || 0),
        paperVouchersTotal: (acc.paperVouchersTotal || 0) + (client.paperVouchersTotal || 0),
        yottaLinksAmount: (acc.yottaLinksAmount || 0) + (client.yottaLinksAmount || 0),
        yottaLinksTotal: (acc.yottaLinksTotal || 0) + (client.yottaLinksTotal || 0),
        yottaWidgetAmount: (acc.yottaWidgetAmount || 0) + (client.yottaWidgetAmount || 0),
        yottaWidgetTotal: (acc.yottaWidgetTotal || 0) + (client.yottaWidgetTotal || 0),
        foodAndDrinkSales: (acc.foodAndDrinkSales || 0) + (client.foodAndDrinkSales || 0),
        staffBonus: client.staffBonus,
        onDeskBonus: client.onDeskBonus,
        voucherSalesBonus: client.voucherSalesBonus,
        privateBookingBonus: client.privateBookingBonus,
        preBookedValueNextWeek: client.preBookedValueNextWeek,
        preBookedPeopleNextWeek: client.preBookedPeopleNextWeek,
        dailyPreBooked: client.dailyPreBooked,
        dailyPreBookedPeople: client.dailyPreBookedPeople,
        date: client.date,
        createdBy: client.createdBy,
        isVerified: client.isVerified,
        status: client.status,
        weeklyData: client.weeklyData,
        treatments: client.treatments
      };
    }, {} as ClientInfo);

    return aggregatedData;
  };

  // Function to format date based on view type
  const formatDateByViewType = (date: Date) => {
    switch (viewType) {
      case 'daily':
        return formatDate(date);
      case 'weekly':
        return formatWeekRange(date);
      case 'monthly':
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        return `${month} ${year}`;
      default:
        return formatDate(date);
    }
  };

  // Function to check if current period is in the future
  const isFuturePeriod = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the date one week from today
    const oneWeekFromToday = new Date(today);
    oneWeekFromToday.setDate(today.getDate() + 7);

    switch (viewType) {
      case 'daily':
        return date > today;
      case 'weekly': {
        const weekStart = getWeekDates(date).start;
        const oneWeekAheadStart = getWeekDates(oneWeekFromToday).start;
        return weekStart > oneWeekAheadStart;
      }
      case 'monthly': {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return monthStart > currentMonthStart;
      }
      default:
        return date > today;
    }
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

  const filteredClients = filterClientsByViewType(clients, getCurrentSelectedDate());
  const displayData = viewType === 'daily' ? filteredClients[0] : aggregateClientData(filteredClients);

  type TreatmentKey = keyof NonNullable<NonNullable<typeof displayData>['treatments']>;

  const handleTreatmentUpdate = async (treatment: TreatmentKey, isDone: boolean) => {
    if (!token || !displayData?.id || !displayData.treatments) {
      setError('No authentication token available or no client selected');
      return;
    }

    try {
      const updatedTreatments = {
        ...displayData.treatments,
        [treatment]: {
          ...displayData.treatments[treatment],
          done: isDone
        }
      };

      const response = await fetch(`http://localhost:2345/api/clients/${displayData.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...displayData,
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
    if (!token || !displayData?.id || !displayData.treatments) {
      setError('No authentication token available or no client selected');
      return;
    }

    try {
      const updatedTreatments = {
        ...displayData.treatments,
        [treatment]: {
          ...displayData.treatments[treatment],
          amount: amount
        }
      };

      const response = await fetch(`http://localhost:2345/api/clients/${displayData.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...displayData,
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

  const handleDailyPreBookedUpdate = async (day: DayOfWeek, amount: number, type: 'quantity' | 'amount') => {
    if (!token || !displayData?.id) {
      setError('No authentication token available or no client selected');
      return;
    }

    try {
      const response = await fetch(`http://localhost:2345/api/clients/${displayData.id}/daily-prebooked`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day,
          value: amount,
          type
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update daily prebooked ${type}: ${response.status}`);
      }

      fetchUnverifiedClients();
    } catch (err) {
      console.error(`Update daily prebooked ${type} error:`, err);
      setError(err instanceof Error ? err.message : `Error updating daily prebooked ${type}`);
    }
  };

  const handleFoodAndDrinkUpdate = async (value: number) => {
    if (!token || !displayData?.id) {
      setError('No authentication token available or no client selected');
      return;
    }

    try {
      const response = await fetch(`http://localhost:2345/api/clients/${displayData.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...displayData,
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

  // Function to format week range
  const formatWeekRange = (date: Date) => {
    const { start, end } = getWeekDates(date);
    const formatDate = (d: Date) => {
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleString('default', { month: 'long' });
      return `${day} ${month}`;
    };
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Function to handle individual day target update

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
          <button onClick={handlePrev} className="p-2 text-gray-800 hover:text-green-900">
            <FaArrowLeft size={20} />
          </button>
          <span className="text-xl font-medium">{formatDateByViewType(getCurrentSelectedDate())}</span>
          {!isFuturePeriod(getCurrentSelectedDate()) && (
            <button onClick={handleNext} className="p-2 text-gray-800 hover:text-green-900">
              <FaArrowRight size={20} />
            </button>
          )}
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
                  {displayData ? (
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
                                <h2 className="text-xl font-semibold text-gray-900">Head Data</h2>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span
                                  className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(displayData.status.headData)}`}
                                >
                                  {displayData.status.headData.charAt(0).toUpperCase() + displayData.status.headData.slice(1)}
                                </span>
                                {user?.role === 'head' && (
                                  <button
                                    onClick={() => handleConfirm(displayData.id!, 'headData')}
                                    className={`p-2 transition-colors ${
                                      displayData.id && displayData.status.headData === 'edited'
                                        ? 'text-green-700 hover:text-green-900'
                                        : 'text-gray-400 cursor-not-allowed'
                                    }`}
                                    title="Confirm Head Data"
                                    disabled={!displayData.id || displayData.status.headData !== 'edited'}
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
                                  <h3 className="text-lg font-medium text-gray-900 mb-4">Food and Drink Sales</h3>
                                  <div className="bg-white p-4 rounded-md shadow-sm">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-2xl font-semibold text-blue-700">£</span>
                                      <input
                                        type="number"
                                        value={displayData.foodAndDrinkSales || 0}
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
                                      {Object.entries(displayData.treatments || {}).map(([treatment, data], index) => (
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
                                        £{Object.values(displayData.treatments || {}).reduce((sum, treatment) => sum + (treatment.amount || 0), 0)}
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
                                className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(displayData.status.survey)}`}
                              >
                                {displayData.status.survey.charAt(0).toUpperCase() + displayData.status.survey.slice(1)}
                              </span>
                              {(user?.role === 'head' || user?.role === 'boss' || user?.role === 'admin') && (
                                <button
                                  onClick={() => {
                                    setSelectedClient(displayData);
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
                                  onClick={() => handleConfirm(displayData.id!, 'survey')}
                                  className={`p-2 transition-colors ${
                                    displayData.id && displayData.status.survey === 'edited'
                                      ? 'text-green-700 hover:text-green-900'
                                      : 'text-gray-400 cursor-not-allowed'
                                  }`}
                                  title="Confirm Survey"
                                  disabled={!displayData.id || displayData.status.survey !== 'edited'}
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
                                    Created: {displayData.createdBy}
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
                                        <p className="text-2xl font-semibold text-purple-700">{displayData.amountOfPeople || 0}</p>
                                      </div>
                                      
                                      <div>
                                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                          <div className="grid grid-cols-2 gap-px bg-gray-200">
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Total</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.amountOfPeople || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">New Clients</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.newClients || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Male</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.male || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Female</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.female || 0}</p>
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
                                          {displayData.englishSpeaking + displayData.russianSpeaking || 0}
                                        </p>
                                      </div>
                                      
                                      <div>
                                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                          <div className="grid grid-cols-2 gap-px bg-gray-200">
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">English Speaking</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.englishSpeaking || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Russian Speaking</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.russianSpeaking || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Off-Peak</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.offPeakClients || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Peak-Time</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.peakTimeClients || 0}</p>
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
                                        <p className="text-2xl font-semibold text-blue-700">
                                          £{(displayData.onlineMembershipsTotal || 0) + 
                                             (displayData.offlineMembershipsTotal || 0) + 
                                             (displayData.onlineVouchersTotal || 0) + 
                                             (displayData.paperVouchersTotal || 0)} Total
                                        </p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="text-md font-medium text-gray-700 mb-3">Sales Breakdown</h4>
                                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                          <div className="grid grid-cols-2 gap-px bg-gray-200">
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Online Memberships</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.onlineMembershipsAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Online Memberships Total</p>
                                              <p className="text-lg font-semibold text-gray-900">£{displayData.onlineMembershipsTotal || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Offline Memberships</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.offlineMembershipsAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Offline Memberships Total</p>
                                              <p className="text-lg font-semibold text-gray-900">£{displayData.offlineMembershipsTotal || 0}</p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="bg-white rounded-md shadow-sm overflow-hidden mt-4">
                                          <div className="grid grid-cols-2 gap-px bg-gray-200">
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Online Vouchers</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.onlineVouchersAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Online Vouchers Total</p>
                                              <p className="text-lg font-semibold text-gray-900">£{displayData.onlineVouchersTotal || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Paper Vouchers</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.paperVouchersAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Paper Vouchers Total</p>
                                              <p className="text-lg font-semibold text-gray-900">£{displayData.paperVouchersTotal || 0}</p>
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
                                        <p className="text-2xl font-semibold text-green-700">£{(displayData.yottaLinksTotal || 0)} Total</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="text-md font-medium text-gray-700 mb-3">Transaction Breakdown</h4>
                                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                          <div className="grid grid-cols-2 gap-px bg-gray-200">
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Yotta Link</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.yottaLinksAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Yotta Link Total</p>
                                              <p className="text-lg font-semibold text-gray-900">£{displayData.yottaLinksTotal || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Yotta Widget</p>
                                              <p className="text-lg font-semibold text-gray-900">{displayData.yottaWidgetAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Yotta Widget Total</p>
                                              <p className="text-lg font-semibold text-gray-900">£{displayData.yottaWidgetTotal || 0}</p>
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
                  {displayData ? (
                    <>
                      {/* Prebooked Data Section */}
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => setIsPrebookedDataCollapsed(!isPrebookedDataCollapsed)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                {isPrebookedDataCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
                              </button>
                              <h2 className="text-xl font-semibold text-gray-900">Prebooked Data</h2>
                            </div>
                          </div>
                          {!isPrebookedDataCollapsed && (
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Value (in £)</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                                    <tr key={day}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                        {day}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex justify-end">
                                          <input
                                            type="number"
                                            value={displayData.dailyPreBooked?.[day]?.quantity || 0}
                                            onChange={(e) => {
                                              const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                              if (!isNaN(value)) {
                                                handleDailyPreBookedUpdate(day, value, 'quantity');
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                              }
                                            }}
                                            className="w-24 text-sm text-gray-900 bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1 text-right"
                                            min="0"
                                          />
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex justify-end">
                                          <input
                                            type="number"
                                            value={displayData.dailyPreBooked?.[day]?.amount || 0}
                                            onChange={(e) => {
                                              const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                              if (!isNaN(value)) {
                                                handleDailyPreBookedUpdate(day, value, 'amount');
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                              }
                                            }}
                                            className="w-24 text-sm text-gray-900 bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1 text-right"
                                            min="0"
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Sales Summary Section */}
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => setIsSalesSummaryCollapsed(!isSalesSummaryCollapsed)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                {isSalesSummaryCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
                              </button>
                              <h2 className="text-xl font-semibold text-gray-900">Sales Summary</h2>
                            </div>
                          </div>
                          {!isSalesSummaryCollapsed && (
                            <>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h3 className="text-md font-medium text-gray-700 mb-3">Online Vouchers</h3>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-500">Amount</span>
                                      <span className="text-lg font-semibold text-gray-900">{displayData.weeklyData?.voucherSummary?.onlineVouchersAmount || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-500">Total Value</span>
                                      <span className="text-lg font-semibold text-blue-700">£{displayData.weeklyData?.voucherSummary?.onlineVouchersTotal || 0}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h3 className="text-md font-medium text-gray-700 mb-3">Paper Vouchers</h3>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-500">Amount</span>
                                      <span className="text-lg font-semibold text-gray-900">{displayData.weeklyData?.voucherSummary?.paperVouchersAmount || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-500">Total Value</span>
                                      <span className="text-lg font-semibold text-blue-700">£{displayData.weeklyData?.voucherSummary?.paperVouchersTotal || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* New Membership Values Block */}
                              <div className="mt-6">
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Online Memberships</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Amount</span>
                                        <span className="text-lg font-semibold text-gray-900">{displayData.onlineMembershipsAmount || 0}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Total Value</span>
                                        <span className="text-lg font-semibold text-blue-700">£{displayData.onlineMembershipsTotal || 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Offline Memberships</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Amount</span>
                                        <span className="text-lg font-semibold text-gray-900">{displayData.offlineMembershipsAmount || 0}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Total Value</span>
                                        <span className="text-lg font-semibold text-blue-700">£{displayData.offlineMembershipsTotal || 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </Card>

                      {/* Kitchen Section */}
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => setIsKitchenOperationsCollapsed(!isKitchenOperationsCollapsed)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                {isKitchenOperationsCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
                              </button>
                              <h2 className="text-xl font-semibold text-gray-900">Kitchen Operations</h2>
                            </div>
                          </div>
                          {!isKitchenOperationsCollapsed && (
                            <>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h3 className="text-md font-medium text-gray-700 mb-2">Chiswick Vouchers Redeemed</h3>
                                  <p className="text-lg font-semibold text-blue-700">£{displayData.weeklyData?.chiswickVouchersRedeemed || 0}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h3 className="text-md font-medium text-gray-700 mb-2">Kitchen Salary</h3>
                                  <p className="text-lg font-semibold text-blue-700">£{displayData.weeklyData?.kitchenSalary || 0}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h3 className="text-md font-medium text-gray-700 mb-2">F&B Stock</h3>
                                  <p className="text-lg font-semibold text-blue-700">£{displayData.weeklyData?.fAndBStock || 0}</p>
                                </div>
                              </div>
                              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-md font-medium text-gray-700 mb-2">Kitchen Profits & Losses</h3>
                                <p className={`text-lg font-semibold ${(displayData.weeklyData?.kitchenPnL || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                  £{displayData.weeklyData?.kitchenPnL || 0}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </Card>
                    </>
                  ) : (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                      <div className="text-center p-4 text-gray-500">
                        <p>No weekly data available for this period.</p>
                        <p className="text-sm mt-1">Add weekly data to see details here.</p>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {viewType === 'monthly' && (
                <div className="space-y-6">
                  {
                    <Card className="bg-white border border-gray-200 shadow-sm">
                      <div className="text-center p-4 text-gray-500">
                        <p>No monthly data available for this period.</p>
                        <p className="text-sm mt-1">Add monthly data to see details here.</p>
                      </div>
                    </Card>
                  }
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
        />
      )}
    </div>
  );
};

export default VerificationPage;