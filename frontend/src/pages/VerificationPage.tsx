import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientInfo, DailyPreBooked, Treatments, Bonuses, HeadData, PreBookedData, StatusType, WeeklySummary } from '../types';
import Card from '../components/common/Card';
import { FaCheck, FaArrowLeft, FaArrowRight, FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaRegEdit, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import SurveyModal from './AddInformationPage';
import { generateWeeklyReport } from '../utils/generateWeeklyReport';

const VerificationPage: React.FC = () => {
  const { token, user } = useAuth();
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [headData, setHeadData] = useState<HeadData[]>([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null);
  const [selectedHeadData, setSelectedHeadData] = useState<HeadData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
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
  const [isOtherCostsCollapsed, setIsOtherCostsCollapsed] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
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

  // Add new useEffect for fetching head data
  useEffect(() => {
    const fetchHeadData = async () => {
      if (!token) {
        setError('No authentication token available');
        return;
      }
      try {
        const response = await fetch(`http://localhost:2345/api/head-data?date=${selectedDate.toISOString().split('T')[0]}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch head data: ${response.status}`);
        }
        const data = await response.json();
        setSelectedHeadData(data.headData);
      } catch (err) {
        console.error('Fetch head data error:', err);
        setError(err instanceof Error ? err.message : 'Error fetching head data');
      }
    };

    fetchHeadData();
  }, [token, selectedDate]);

  // Date formatting utilities
  const dateUtils = {
    // Format to YYYY-MM-DD for API calls
    toYYYYMMDD: (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // Format to "DD Month YYYY" for display
    toDisplay: (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },

    // Format to "DD.MM" for day display
    toDayMonth: (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}.${month}`;
    },

    // Get week start (Monday) for a given date
    getWeekStart: (date: Date) => {
      const result = new Date(date);
      const day = result.getDay();
      const daysToSubtract = day === 1 ? 0 : day === 0 ? 6 : day - 1;
      result.setDate(result.getDate() - daysToSubtract);
      result.setHours(0, 0, 0, 0);
      return result;
    },

    // Get week end (Sunday) for a given date
    getWeekEnd: (date: Date) => {
      const result = new Date(date);
      const day = result.getDay();
      const daysToAdd = day === 0 ? 0 : 7 - day;
      result.setDate(result.getDate() + daysToAdd);
      result.setHours(23, 59, 59, 999);
      return result;
    },

    // Format week range for display
    formatWeekRange: (startDate: Date, endDate: Date) => {
      return `${dateUtils.toDisplay(startDate)} - ${dateUtils.toDisplay(endDate)}`;
    }
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
        const nextWeekDate = new Date(selectedDate);
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        nextWeekDate.setHours(0, 0, 0, 0);

        const maxWeekStart = new Date(today);
        maxWeekStart.setDate(maxWeekStart.getDate() + 7);
        maxWeekStart.setHours(0, 0, 0, 0);

        setCanNavigateNext(nextWeekDate.getTime() <= maxWeekStart.getTime());
        setCanNavigatePrev(true);
        break;
      case 'monthly':
        const nextMonthDate = new Date(selectedDate);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        nextMonthDate.setHours(0, 0, 0, 0);

        const maxMonthStart = new Date(today);
        maxMonthStart.setMonth(maxMonthStart.getMonth() + 1);
        maxMonthStart.setHours(0, 0, 0, 0);

        setCanNavigateNext(nextMonthDate.getTime() < maxMonthStart.getTime());
        setCanNavigatePrev(true);
        break;
    }
  };

  useEffect(() => {
    checkNavigationAvailability();
  }, [viewType, selectedDate, selectedMonthDate]);

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
        const newWeekDate = new Date(selectedDate);
        newWeekDate.setDate(newWeekDate.getDate() - 7);
        setTimeout(() => {
          setSelectedDate(newWeekDate);
          setIsTransitioning(false);
          setDirection(null);
        }, 200);
        break;
      case 'monthly':
        const newMonthDate = new Date(selectedDate);
        newMonthDate.setMonth(newMonthDate.getMonth() - 1);
        setTimeout(() => {
          setSelectedDate(newMonthDate);
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
        const newWeekDate = new Date(selectedDate);
        newWeekDate.setDate(newWeekDate.getDate() + 7);
        setTimeout(() => {
          setSelectedDate(newWeekDate);
          setIsTransitioning(false);
          setDirection(null);
        }, 200);
        break;
      case 'monthly':
        const newMonthDate = new Date(selectedDate);
        newMonthDate.setMonth(newMonthDate.getMonth() + 1);
        setTimeout(() => {
          setSelectedDate(newMonthDate);
          setIsTransitioning(false);
          setDirection(null);
        }, 200);
        break;
    }
  };

  const filterDataByDate = (clients: ClientInfo[], date: Date, headData: HeadData[]) => {
    const clientsByDate = clients.filter((client) => {
      const clientDate = new Date(client.date);
      return clientDate.toDateString() === date.toDateString();
    });
    const headDataByDate = headData.filter((head) => {
      const headDate = new Date(head.date);
      return headDate.toDateString() === date.toDateString();
    });
    return { clients: clientsByDate, headData: headDataByDate };
  };

  const handleSubmitSuccess = () => {
    fetchUnverifiedClients();
    setIsModalOpen(false);
    setSelectedClient(null);
    setSelectedHeadData(null);
  };

  const handleViewChange = (newViewType: 'daily' | 'weekly' | 'monthly') => {
    if (newViewType === viewType) return;
    setIsViewTransitioning(true);
    setTimeout(() => {
      setViewType(newViewType);
      setIsViewTransitioning(false);
    }, 200);
  };

  type DayOfWeek = keyof DailyPreBooked;
  type TreatmentKey = keyof Treatments;
  type BonusKey = keyof Bonuses;

  const handleClientUpdate = async (updates: Partial<ClientInfo>) => {
    if (!token || !selectedClient?.id) {
      setError('No authentication token available or no client selected');
      return;
    }

    try {
      const response = await fetch(`http://localhost:2345/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedClient,
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

  const handleHeadDataUpdate = async (field: string, value: any) => {
    if (!token) {
      setError('No authentication token available');
      return;
    }

    try {
      const response = await fetch('http://localhost:2345/api/head-data', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: viewType === 'weekly' ? selectedDate.toISOString().split('T')[0] : selectedDate.toISOString().split('T')[0],
          [field]: value,
          isWeekly: viewType === 'weekly'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update head data:', errorData);
        throw new Error(errorData.message || `Failed to update head data: ${response.status}`);
      }

      const responseData = await response.json();

      // Update both selectedHeadData and headData state
      setSelectedHeadData(responseData.headData);
      setHeadData(prevData => {
        const existingIndex = prevData.findIndex(data => data.date === responseData.headData.date);
        if (existingIndex !== -1) {
          // Update existing data
          const newData = [...prevData];
          newData[existingIndex] = responseData.headData;
          return newData;
        } else {
          // Add new data
          return [...prevData, responseData.headData];
        }
      });
    } catch (err) {
      console.error('Update head data error:', err);
      setError(err instanceof Error ? err.message : 'Error updating head data');
    }
  };

  const handleVerifyClientData = async (clientId: number) => {
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
        body: JSON.stringify({ isVerified: true })
      });

      if (!response.ok) {
        throw new Error('Failed to verify client data');
      }

      const data = await response.json();
      
      // Update the client in the state
      setClients(prevClients => {
        const existingIndex = prevClients.findIndex(client => client.id === data.client.id);
        if (existingIndex !== -1) {
          const newClients = [...prevClients];
          newClients[existingIndex] = data.client;
          return newClients;
        }
        return prevClients;
      });
    } catch (error) {
      console.error('Error verifying client data:', error);
      setError(error instanceof Error ? error.message : 'Error verifying client data');
    }
  };

  const handleVerifyHeadData = async (field: string) => {
    if (!selectedHeadData || !token) return;

    try {
      const response = await fetch(`http://localhost:2345/api/head-data/${selectedHeadData.id}/verify`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field })
      });

      if (!response.ok) {
        throw new Error('Failed to verify head data');
      }

      const data = await response.json();
      
      // Update both selectedHeadData and headData state
      setSelectedHeadData(data.headData);
      setHeadData(prevData => {
        const existingIndex = prevData.findIndex(item => item.id === data.headData.id);
        if (existingIndex !== -1) {
          const newData = [...prevData];
          newData[existingIndex] = data.headData;
          return newData;
        }
        return [...prevData, data.headData];
      });
    } catch (error) {
      console.error('Error verifying head data:', error);
      setError(error instanceof Error ? error.message : 'Error verifying head data');
    }
  };

  const handleFoodAndDrinkUpdate = async (value: number) => {
    if (!token) {
      setError('No authentication token available or no head data selected');
      return;
    }

    try {
      await handleHeadDataUpdate('foodAndDrinkSales', value);
    } catch (err) {
      console.error('Update food and drink sales error:', err);
      setError(err instanceof Error ? err.message : 'Error updating food and drink sales');
    }
  };

  const handleTreatmentUpdate = async (treatment: TreatmentKey, isDone: boolean) => {
    if (!token || !selectedHeadData?.treatments) {
      setError('No authentication token available or no head data selected');
      return;
    }
    
    try {
      const updatedTreatments: Treatments = {
        ...selectedHeadData.treatments,
        [treatment]: {
          ...selectedHeadData.treatments[treatment],
          done: isDone
        }
      };

      await handleHeadDataUpdate('treatments', updatedTreatments);
    } catch (err) {
      console.error('Update treatment error:', err);
      setError(err instanceof Error ? err.message : 'Error updating treatment');
    }
  };

  const handleTreatmentAmountUpdate = async (treatment: TreatmentKey, amount: number) => {
    if (!token || !selectedHeadData?.treatments) {
      setError('No authentication token available or no head data selected');
      return;
    }

    try {
      const updatedTreatments = {
        ...selectedHeadData.treatments,
        [treatment]: {
          ...selectedHeadData.treatments[treatment],
          amount: amount
        }
      };

      await handleHeadDataUpdate('treatments', updatedTreatments);
    } catch (err) {
      console.error('Update treatment amount error:', err);
      setError(err instanceof Error ? err.message : 'Error updating treatment amount');
    }
  };

  const handleDailyPreBookedUpdate = async (day: DayOfWeek, value: number) => {
    if (!token) {
      setError('No authentication token available or no head data selected');
      return;
    }
    
    try {
      const currentPreBookedData = selectedHeadData?.preBookedData || {
        preBookedValueNextWeek: 0,
        preBookedPeopleNextWeek: 0
      };

      const defaultDays = {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      };

      const updatedPreBookedData: PreBookedData = {
        ...currentPreBookedData,
        dailyPreBookedPeople: {
          ...defaultDays,
          ...(currentPreBookedData?.dailyPreBookedPeople || {}),
          [day]: value
        }
      };

      await handleHeadDataUpdate('preBookedData', updatedPreBookedData);
    } catch (err) {
      console.error('Update prebooked error:', err);
      setError(err instanceof Error ? err.message : 'Error updating prebooked data');
    }
  };

  const handleDailyPreBookedValueUpdate = async (day: DayOfWeek, value: number) => {
    if (!token) {
      setError('No authentication token available or no head data selected');
      return;
    }
    
    try {
      const currentPreBookedData = selectedHeadData?.preBookedData || {
        preBookedValueNextWeek: 0,
        preBookedPeopleNextWeek: 0
      };

      const defaultDays = {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      };

      const updatedPreBookedData: PreBookedData = {
        ...currentPreBookedData,
        dailyPreBookedValue: {
          ...defaultDays,
          ...(currentPreBookedData?.dailyPreBookedValue || {}),
          [day]: value
        }
      };

      await handleHeadDataUpdate('preBookedData', updatedPreBookedData);
    } catch (err) {
      console.error('Update prebooked value error:', err);
      setError(err instanceof Error ? err.message : 'Error updating prebooked value');
    }
  };

  const filteredData = filterDataByDate(clients, selectedDate, headData);
  const latestClient = filteredData.clients[0];
  const latestHeadData = filteredData.headData[0];

  // Update the useEffect to handle the case when there's no head data
  useEffect(() => {
    if (latestHeadData) {
      setSelectedHeadData(latestHeadData);
    } else {
      // Reset selectedHeadData when there's no data for the selected date
      setSelectedHeadData(null);
    }
  }, [latestHeadData]);

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'edited':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchWeeklySummary = async () => {
    if (!token) {
      setError('No authentication token available');
      return;
    }
    try {
      // Get the weekly head data
      const headDataResponse = await fetch(`http://localhost:2345/api/head-data?date=${dateUtils.toYYYYMMDD(selectedDate)}&isWeekly=true`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!headDataResponse.ok) {
        const errorData = await headDataResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch weekly data: ${headDataResponse.status}`);
      }
      const headData = await headDataResponse.json();
      setSelectedHeadData(headData.headData);

      // Get the weekly summary using the correct week start date
      const weekStartDate = dateUtils.getWeekStart(selectedDate);
      const summaryResponse = await fetch(`http://localhost:2345/api/clients/weekly-summary?weekStart=${dateUtils.toYYYYMMDD(weekStartDate)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch weekly summary: ${summaryResponse.status}`);
      }
      const summaryData = await summaryResponse.json();
      setWeeklySummary(summaryData.summary);
    } catch (err) {
      console.error('Fetch weekly data error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching weekly data');
    }
  };

  useEffect(() => {
    if (viewType === 'weekly') {
      fetchWeeklySummary();
    }
  }, [viewType, selectedDate, token]);

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
            {viewType === 'daily' && dateUtils.toDisplay(selectedDate)}
            {viewType === 'weekly' && dateUtils.formatWeekRange(dateUtils.getWeekStart(selectedDate), dateUtils.getWeekEnd(selectedDate))}
            {viewType === 'monthly' && dateUtils.toDisplay(selectedDate)}
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
                <div className="space-y-6">
                  <div className="space-y-6">
                    {/* Head Data Zone */}
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
                              className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(latestHeadData?.status?.foodAndDrinkSales || 'pending')}`}
                            >
                              {(latestHeadData?.status?.foodAndDrinkSales || 'pending').charAt(0).toUpperCase() + (latestHeadData?.status?.foodAndDrinkSales || 'pending').slice(1)}
                            </span>
                            {user?.role === 'head' && (
                              <button
                                onClick={() => handleVerifyHeadData('foodAndDrinkSales')}
                                className={`p-2 transition-colors ${
                                  latestHeadData?.id && (latestHeadData?.status?.foodAndDrinkSales === 'edited' || latestHeadData?.status?.treatments === 'edited')
                                    ? 'text-green-700 hover:text-green-900'
                                    : 'text-gray-400 cursor-not-allowed'
                                }`}
                                title="Confirm Head Data"
                                disabled={!latestHeadData?.id || (latestHeadData?.status?.foodAndDrinkSales !== 'edited' && latestHeadData?.status?.treatments !== 'edited')}
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
                                    value={latestHeadData?.foodAndDrinkSales || 0}
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
                                <div className="grid grid-cols-2 gap-4 p-4">
                                  {Object.entries(latestHeadData?.treatments || {
                                    entryOnly: { done: false, amount: 0 },
                                    parenie: { done: false, amount: 0 },
                                    aromaPark: { done: false, amount: 0 },
                                    iceWrap: { done: false, amount: 0 },
                                    scrub: { done: false, amount: 0 },
                                    mudMask: { done: false, amount: 0 },
                                    mudWrap: { done: false, amount: 0 },
                                    aloeVera: { done: false, amount: 0 },
                                    massage_25: { done: false, amount: 0 },
                                    massage_50: { done: false, amount: 0 }
                                  }).map(([treatment, data], index) => (
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
                                    £{Object.values(latestHeadData?.treatments || {}).reduce((sum, treatment) => sum + (treatment.amount || 0), 0)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                  <div className="space-y-6">
                    {latestClient ? (
                    <div className="space-y-6">                      
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
                                className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(latestClient?.status || 'pending')}`}
                              >
                                {(latestClient?.status || 'pending').charAt(0).toUpperCase() + (latestClient?.status || 'pending').slice(1)}
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
                                  onClick={() => latestClient?.id && handleVerifyClientData(latestClient.id)}
                                  className={`p-2 transition-colors ${
                                    latestClient?.id && latestClient?.status === 'edited'
                                      ? 'text-green-700 hover:text-green-900'
                                      : 'text-gray-400 cursor-not-allowed'
                                  }`}
                                  title="Confirm Survey"
                                  disabled={!latestClient?.id || latestClient?.status !== 'edited'}
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
                                              <p className="text-lg font-semibold text-gray-900">{latestClient.yottaLinksAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Yotta Link Total</p>
                                              <p className="text-lg font-semibold text-gray-900">{latestClient.yottaLinksTotal || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Yotta Widget</p>
                                              <p className="text-lg font-semibold text-gray-900">{latestClient.yottaWidgetAmount || 0}</p>
                                            </div>
                                            <div className="bg-white p-3">
                                              <p className="text-xs text-gray-500 mb-1">Yotta Widget Total</p>
                                              <p className="text-lg font-semibold text-gray-900">{latestClient.yottaWidgetTotal || 0}</p>
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
                  </div>
                </div>
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
                      </div>
                      {!isWeeklySummaryCollapsed && weeklySummary && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Client Information */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Client Information</h3>
                            <div className="space-y-4">
                              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                <div className="grid grid-cols-2 gap-px bg-gray-200">
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Total Visitors</p>
                                    <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalVisitors}</p>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">New Clients</p>
                                    <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalNewClients}</p>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Male</p>
                                    <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalMale}</p>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Female</p>
                                    <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalFemale}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                <div className="grid grid-cols-2 gap-px bg-gray-200">
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">English Speaking</p>
                                    <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalEnglishSpeaking}</p>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Russian Speaking</p>
                                    <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalRussianSpeaking}</p>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Off-Peak</p>
                                    <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalOffPeak}</p>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Peak-Time</p>
                                    <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalPeakTime}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sales & Transactions */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Sales & Transactions</h3>
                            <div className="space-y-4">
                              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                <div className="grid grid-cols-2 gap-px bg-gray-200">
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Online Memberships</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalOnlineMemberships.amount}</p>
                                      <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalOnlineMemberships.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Offline Memberships</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalOfflineMemberships.amount}</p>
                                      <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalOfflineMemberships.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Online Vouchers</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalOnlineVouchers.amount}</p>
                                      <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalOnlineVouchers.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Paper Vouchers</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalPaperVouchers.amount}</p>
                                      <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalPaperVouchers.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Yotta Links</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalYottaLinks.amount}</p>
                                      <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalYottaLinks.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Yotta Widget</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-gray-900">{weeklySummary.totalYottaWidget.amount}</p>
                                      <p className="text-sm font-semibold text-green-700">£{weeklySummary.totalYottaWidget.value}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* F&B + Treatments */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">F&B + Treatments</h3>
                            <div className="space-y-4">
                              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                                <div className="p-2 border-b border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1">Food & Drink Sales</p>
                                  <p className="text-sm font-semibold text-blue-700 text-right">£{weeklySummary.totalFoodAndDrink}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-px bg-gray-200">
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Entry Only</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-blue-700 text-right">£{weeklySummary.treatments.entryOnly.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Parenie</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-blue-700  text-right">£{weeklySummary.treatments.parenie.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Aroma Park</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-blue-700 text-right">£{weeklySummary.treatments.aromaPark.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Ice Wrap</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-blue-700 text-right">£{weeklySummary.treatments.iceWrap.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Scrub</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-blue-700 text-right">£{weeklySummary.treatments.scrub.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Mud Mask</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-blue-700 text-right">£{weeklySummary.treatments.mudMask.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Mud Wrap</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-blue-700 text-right">£{weeklySummary.treatments.mudWrap.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Aloe Vera</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-blue-700 text-right">£{weeklySummary.treatments.aloeVera.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Massage 25</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-blue-700 text-right">£{weeklySummary.treatments.massage_25.value}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2">
                                    <p className="text-xs text-gray-500 mb-1">Massage 50</p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-semibold text-blue-700 text-right">£{weeklySummary.treatments.massage_50.value}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-2 border-t border-gray-200 bg-gray-50">
                                  <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium text-gray-700">Total Treatments</p>
                                    <div className="flex justify-between items-center space-x-4">
                                      <p className="text-sm font-semibold text-blue-700">
                                        £{Object.values(weeklySummary.treatments).reduce((sum, treatment: { amount: number; value: number }) => sum + treatment.value, 0)}
                                      </p>
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
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(latestHeadData?.status?.preBookedData || 'pending')}`}
                          >
                            {(latestHeadData?.status?.preBookedData || 'pending').charAt(0).toUpperCase() + (latestHeadData?.status?.preBookedData || 'pending').slice(1)}
                          </span>
                          {user?.role === 'head' && (
                            <button
                              onClick={() => handleVerifyHeadData('preBookedData')}
                              className={`p-2 transition-colors ${
                                latestHeadData?.id && latestHeadData?.status?.preBookedData === 'edited'
                                  ? 'text-green-700 hover:text-green-900'
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title="Confirm Prebooked Data"
                              disabled={!latestHeadData?.id || latestHeadData?.status?.preBookedData !== 'edited'}
                            >
                              <FaCheck size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                      {!isPrebookedCollapsed && (
                        <div className="space-y-4">
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
                                      {day} ({dateUtils.toDayMonth(new Date(dateUtils.getWeekStart(selectedDate).setDate(dateUtils.getWeekStart(selectedDate).getDate() + index)))})
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                      <input
                                        type="number"
                                        value={latestHeadData?.preBookedData?.dailyPreBookedPeople?.[day as DayOfWeek] || 0}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value) || 0;
                                          handleDailyPreBookedUpdate(day as DayOfWeek, value);
                                        }}
                                        className="w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                                        min="0"
                                      />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                      <input
                                        type="number"
                                        value={latestHeadData?.preBookedData?.dailyPreBookedValue?.[day as DayOfWeek] || 0}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value) || 0;
                                          handleDailyPreBookedValueUpdate(day as DayOfWeek, value);
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
                                    {Object.values(latestHeadData?.preBookedData?.dailyPreBookedPeople || {}).reduce((sum, val) => sum + val, 0)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                    £{Object.values(latestHeadData?.preBookedData?.dailyPreBookedValue || {}).reduce((sum, val) => sum + val, 0).toFixed(2)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
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
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(latestHeadData?.status?.bonuses || 'pending')}`}
                          >
                            {(latestHeadData?.status?.bonuses || 'pending').charAt(0).toUpperCase() + (latestHeadData?.status?.bonuses || 'pending').slice(1)}
                          </span>
                          {user?.role === 'head' && (
                            <button
                              onClick={() => handleVerifyHeadData('bonuses')}
                              className={`p-2 transition-colors ${
                                latestHeadData?.id && latestHeadData?.status?.bonuses === 'edited'
                                  ? 'text-green-700 hover:text-green-900'
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title="Confirm Bonuses"
                              disabled={!latestHeadData?.id || latestHeadData?.status?.bonuses !== 'edited'}
                            >
                              <FaCheck size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                      {!isBonusesCollapsed && (
                        <div className="space-y-4">
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
                                  value={latestHeadData?.bonuses?.[key as BonusKey] || 0}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    const updatedBonuses = {
                                      ...latestHeadData?.bonuses,
                                      [key]: value
                                    } as NonNullable<typeof latestHeadData.bonuses>;
                                    handleHeadDataUpdate('bonuses', updatedBonuses);
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
                                  £{Object.values(latestHeadData?.bonuses || {}).reduce((sum, bonus) => sum + bonus, 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Other Costs Block */}
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setIsOtherCostsCollapsed(!isOtherCostsCollapsed)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            {isOtherCostsCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
                          </button>
                          <h2 className="text-xl font-semibold text-gray-900">Other Costs</h2>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(latestHeadData?.status?.otherCosts || 'pending')}`}
                          >
                            {(latestHeadData?.status?.otherCosts || 'pending').charAt(0).toUpperCase() + (latestHeadData?.status?.otherCosts || 'pending').slice(1)}
                          </span>
                          {user?.role === 'head' && (
                            <button
                              onClick={() => handleVerifyHeadData('otherCosts')}
                              className={`p-2 transition-colors ${
                                latestHeadData?.id && latestHeadData?.status?.otherCosts === 'edited'
                                  ? 'text-green-700 hover:text-green-900'
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title="Confirm Other Costs"
                              disabled={!latestHeadData?.id || latestHeadData?.status?.otherCosts !== 'edited'}
                            >
                              <FaCheck size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                      {!isOtherCostsCollapsed && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { key: 'kitchenSalaryPaid', label: 'Kitchen Salary Paid' },
                              { key: 'foodAndBeverageStock', label: 'F&B Stock' },
                              { key: 'kitchenPL', label: 'Kitchen PL' }
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">{label}</span>
                                <input
                                  type="number"
                                  value={latestHeadData?.otherCosts?.[key as keyof NonNullable<typeof latestHeadData.otherCosts>] || 0}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    const updatedOtherCosts = {
                                      ...latestHeadData?.otherCosts,
                                      [key]: value
                                    } as NonNullable<typeof latestHeadData.otherCosts>;
                                    handleHeadDataUpdate('otherCosts', updatedOtherCosts);
                                  }}
                                  className="w-32 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            ))}
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
          onUpdate={handleClientUpdate}
        />
      )}
    </div>
  );
};

export default VerificationPage;