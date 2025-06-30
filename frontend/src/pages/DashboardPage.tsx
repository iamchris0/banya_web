import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { WeeklyDashboardData, DailyData } from '../types';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, subDays, addDays } from 'date-fns';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DailyDashboard from '../components/dashboard/DailyDashboard';
import WeeklyDashboard from '../components/dashboard/WeeklyDashboard';
import PeriodDashboard from '../components/dashboard/PeriodDashboard';

type TimeFilter = 'day' | 'week' | 'period';

const DashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState<Date>(subWeeks(new Date(), 4));
  const [periodEnd, setPeriodEnd] = useState<Date>(new Date());
  const [noData, setNoData] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      setNoData(false);
      if (!user) {
        setError('No authentication token available');
        setLoading(false);
        return;
      }

      try {
        const baseUrl = 'http://localhost:2345/api';
        let url = '';
        let params = {};

        switch (timeFilter) {
          case 'day':
            url = `${baseUrl}/dashboard-data`;
            params = { timeFilter: 'day', selectedDate: format(selectedDate, 'yyyy-MM-dd') };
            
            const dayResponse = await fetch(`${url}?${new URLSearchParams(params).toString()}`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (!dayResponse.ok) {
              setNoData(true);
              setDailyData(null);
              setWeeklyData(null);
              setLoading(false);
              return;
            }
            const dayData = await dayResponse.json();
            // console.log(dayData);
            if (!dayData || !dayData.dailyData) {
              setNoData(true);
              setDailyData(null);
              setWeeklyData(null);
              setLoading(false);
              return;
            }
            setDailyData(dayData.dailyData);
            setWeeklyData(null);
            break;  
          case 'week':
            url = `${baseUrl}/dashboard-data`;
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
            params = { timeFilter: 'week', selectedDate: format(weekStart, 'yyyy-MM-dd') };

            const weekResponse = await fetch(`${url}?${new URLSearchParams(params).toString()}`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (!weekResponse.ok) {
              setNoData(true);
              setDailyData(null);
              setWeeklyData(null);
              setLoading(false);
              return;
            }
            const weekData = await weekResponse.json();
            if (!weekData || !weekData.weeklyDashboardData) {
              setNoData(true);
              setDailyData(null);
              setWeeklyData(null);
              setLoading(false);
              return;
            }
            setWeeklyData(weekData.weeklyDashboardData);
            setDailyData(null);
            break;
          case 'period':
            url = `${baseUrl}/dashboard-data`;
            params = {
              timeFilter: 'period',
              periodStart: format(periodStart, 'yyyy-MM-dd'),
              periodEnd: format(periodEnd, 'yyyy-MM-dd')
            };

            const periodResponse = await fetch(`${url}?${new URLSearchParams(params).toString()}`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (!periodResponse.ok) {
              setNoData(true);
              setDailyData(null);
              setWeeklyData(null);
              setLoading(false);
              return;
            }
            const periodData = await periodResponse.json();
            if (!periodData || !periodData.weeklyDashboardData) {
              setNoData(true);
              setDailyData(null);
              setWeeklyData(null);
              setLoading(false);
              return;
            }
            setWeeklyData(periodData.weeklyDashboardData);
            setDailyData(null);
            break;
          default:
            throw new Error('Invalid time filter');
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data: ' + err);
        setLoading(false);
        toast.error('Failed to fetch dashboard data');
      }
    };

    fetchData();
  }, [user, timeFilter, selectedDate, periodStart, periodEnd]);

  const handlePreviousPeriod = () => {
    switch (timeFilter) {
      case 'day':
        setSelectedDate(prev => subDays(prev, 1));  
        break;
      case 'week':
        setSelectedDate(prev => subWeeks(prev, 1));
        break;
      case 'period':
        const periodLength = periodEnd.getTime() - periodStart.getTime();
        setPeriodStart(prev => new Date(prev.getTime() - periodLength));
        setPeriodEnd(prev => new Date(prev.getTime() - periodLength));
        break;
    }
  };

  const handleNextPeriod = () => {
    switch (timeFilter) {
      case 'day':
        setSelectedDate(prev => addDays(prev, 1));
        break;
      case 'week':
        setSelectedDate(prev => addWeeks(prev, 1));
        break;
      case 'period':
        const periodLength = periodEnd.getTime() - periodStart.getTime();
        setPeriodStart(prev => new Date(prev.getTime() + periodLength));
        setPeriodEnd(prev => new Date(prev.getTime() + periodLength));
        break;
    }
  };

  const getDateDisplay = () => {
    switch (timeFilter) {
      case 'day':
        return format(selectedDate, 'MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'period':
        return `${format(periodStart, 'MMM d')} - ${format(periodEnd, 'MMM d, yyyy')}`;
    }
  };

  // Date selection controls
  const DateSelector = () => (
    <div className="mb-6 p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <button
            onClick={() => setTimeFilter('day')}
            className={`px-4 py-2 rounded-full ${
              timeFilter === 'day' ? 'bg-green-900 text-white' : 'bg-gray-100'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeFilter('week')}
            className={`px-4 py-2 rounded-full ${
              timeFilter === 'week' ? 'bg-green-900 text-white' : 'bg-gray-100'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeFilter('period')}
            className={`px-4 py-2 rounded-full ${
              timeFilter === 'period' ? 'bg-green-900 text-white' : 'bg-gray-100'
            }`}
          >
            Period
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousPeriod}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <IoIosArrowBack />
          </button>
          <span className="text-gray-700 font-medium">{getDateDisplay()}</span>
          <button
            onClick={handleNextPeriod}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <IoIosArrowForward />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800 p-4">
      <ToastContainer position="top-right" autoClose={5000} />
      <DateSelector />
      <div className="flex-grow w-full max-w-8xl mx-auto space-y-8">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-red-500 text-xl font-semibold mb-2">{error}</div>
            <div className="text-gray-500 mb-4 text-center">An error occurred while fetching dashboard data.<br/>Try choosing a different date or period.</div>
          </div>
        ) : noData ? (
          <div className="flex flex-col items-center justify-center h-full">
            <img src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png" alt="No data" className="w-32 h-32 mb-4 opacity-70" />
            <div className="text-xl font-semibold text-gray-700 mb-2">No data available</div>
            <div className="text-gray-500 mb-4 text-center">There is no dashboard data for the selected {timeFilter}.<br/>Try choosing a different date or period.</div>
          </div>
        ) : (
          <>
            {timeFilter === 'day' && dailyData && (
              <DailyDashboard 
                data={dailyData} 
              />
            )}
            {timeFilter === 'week' && weeklyData && (
              <WeeklyDashboard 
                data={weeklyData} 
              />
            )}
            {timeFilter === 'period' && weeklyData && (
              <PeriodDashboard 
                data={weeklyData} 
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;