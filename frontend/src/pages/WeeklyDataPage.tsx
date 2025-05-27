import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientInfo, Status } from '../types';
import Card from '../components/common/Card';
import { FaRegEdit, FaCheck, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import WeeklyDataSurveyModal from './WeeklyDataSurveyModal';
import { Navigate } from 'react-router-dom';

const WeeklyDataPage: React.FC = () => {
  const { token, user } = useAuth();
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  const [weeklyData, setWeeklyData] = useState<ClientInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  // Set selectedWeekStart to the start of the current week (Monday)
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    setSelectedWeekStart(new Date(today.setDate(diff)));
  }, []);

  const fetchWeeklyData = async () => {
    if (!token) {
      setError('No authentication token available');
      return;
    }
    setError('');
    try {
      const weekStart = selectedWeekStart.toISOString().split('T')[0];
      const response = await fetch(`http://localhost:2345/api/weekly-data?weekStart=${weekStart}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch weekly data: ${response.status}`);
      }
      const data = await response.json();
      setWeeklyData(
        data.weeklyData || {
          id: null,
          staffBonus: 0,
          onDeskBonus: 0,
          voucherSalesBonus: 0,
          privateBookingBonus: 0,
          preBookedValueNextWeek: 0,
          preBookedPeopleNextWeek: 0,
          date: weekStart,
          createdBy: user?.username || '',
          isVerified: false,
          status: 'edited' as Status,
        }
      );
    } catch (err) {
      console.error('Fetch weekly data error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching weekly data');
    }
  };

  useEffect(() => {
    if (token) {
      fetchWeeklyData();
    }
  }, [token, selectedWeekStart]);

  if (user?.role !== 'boss') {
    return <Navigate to="/dashboard" replace />;
  }

  const formatWeek = (date: Date) => {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(start.getDate() + 6);
    const startStr = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const endStr = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const handlePrevWeek = () => {
    setIsTransitioning(true);
    setDirection('left');
    const newWeekStart = new Date(selectedWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setTimeout(() => {
      setSelectedWeekStart(newWeekStart);
      setIsTransitioning(false);
      setDirection(null);
    }, 200);
  };

  const handleNextWeek = () => {
    const nextWeekStart = new Date(selectedWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    
    // Check if the next week is more than 1 week ahead of current week
    const today = new Date();
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    
    const maxAllowedWeek = new Date(currentWeekStart);
    maxAllowedWeek.setDate(maxAllowedWeek.getDate() + 7);
    
    if (nextWeekStart > maxAllowedWeek) {
      return; // Don't allow navigation beyond 1 week ahead
    }
    
    setIsTransitioning(true);
    setDirection('right');
    setTimeout(() => {
      setSelectedWeekStart(nextWeekStart);
      setIsTransitioning(false);
      setDirection(null);
    }, 200);
  };

  const canNavigateToNextWeek = (weekStart: Date) => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    
    // Calculate the maximum allowed week (1 week ahead of current week)
    const maxAllowedWeek = new Date(currentWeekStart);
    maxAllowedWeek.setDate(maxAllowedWeek.getDate() + 7);
    
    // Allow navigation if the next week would be within the allowed range
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return nextWeek <= maxAllowedWeek;
  };

  const handleEdit = () => {
    if (weeklyData) {
      setIsModalOpen(true);
    }
  };

  const handleConfirm = async () => {
    if (!token) {
      setError('No authentication token available');
      return;
    }
    if (!weeklyData?.id) {
      setError('No data ID available. Please submit data first.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:2345/api/weekly-data/${weeklyData.id}/verify`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVerified: true, status: 'Confirmed' as Status }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to verify weekly data: ${response.status}`);
      }
      fetchWeeklyData();
    } catch (err) {
      console.error('Verify weekly data error:', err);
      setError(err instanceof Error ? err.message : 'Error verifying weekly data');
    }
  };

  const handleSubmitSuccess = () => {
    fetchWeeklyData();
    setIsModalOpen(false);
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'edited':
        return 'bg-amber-100 text-amber-800';
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800 p-6">
      <div className="flex-grow w-full max-w-7xl mx-auto">
        {/* Week Navigation */}
        <div className="mb-6 flex items-center justify-center space-x-4">
          <button onClick={handlePrevWeek} className="p-2 text-gray-800 hover:text-green-900">
            <FaArrowLeft size={20} />
          </button>
          <span className="text-xl font-medium">{formatWeek(selectedWeekStart)}</span>
          {canNavigateToNextWeek(selectedWeekStart) && (
            <button onClick={handleNextWeek} className="p-2 text-gray-800 hover:text-green-900">
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

          {!weeklyData && !error && (
            <div className="text-center p-4 text-gray-500">
              <p>Loading weekly data...</p>
            </div>
          )}

          {weeklyData && (
            <Card className="bg-white border border-gray-200 shadow-sm relative">
              <div className="p-6 space-y-8">
                {/* Status Marker and Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-sm font-medium pl-4 ${getStatusColor(weeklyData.status)}`}
                    >
                      Status: {weeklyData.status.charAt(0).toUpperCase() + weeklyData.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {weeklyData && (
                      <>
                        <button
                          onClick={handleEdit}
                          className="p-2 text-blue-700 hover:text-blue-800 transition-colors"
                          title="Edit Weekly Data"
                        >
                          <FaRegEdit size={20} />
                        </button>
                        <button
                          onClick={handleConfirm}
                          className={`p-2 transition-colors ${
                            weeklyData.id && weeklyData.status === 'edited'
                              ? 'text-green-700 hover:text-green-900'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title="Confirm Weekly Data"
                          disabled={!weeklyData.id || weeklyData.status !== 'edited'}
                        >
                          <FaCheck size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Bonuses Section */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Bonuses</h3>
                    <div className="space-y-6">
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <p className="text-sm font-medium text-gray-700 mb-2">Total Bonuses</p>
                        <p className="text-2xl font-semibold text-purple-700">
                          {weeklyData.staffBonus + weeklyData.onDeskBonus + weeklyData.voucherSalesBonus + weeklyData.privateBookingBonus} (£{(weeklyData.staffBonus || 0) + (weeklyData.onDeskBonus || 0) + (weeklyData.voucherSalesBonus || 0) + (weeklyData.privateBookingBonus || 0)})
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-3">Bonus Distribution</h4>
                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                          <div className="grid grid-cols-2 gap-px bg-gray-200">
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Staff Bonus</p>
                              <p className="text-lg font-semibold text-gray-900">£{weeklyData.staffBonus || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">On Desk Bonus</p>
                              <p className="text-lg font-semibold text-gray-900">£{weeklyData.onDeskBonus || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Voucher Sales Bonus</p>
                              <p className="text-lg font-semibold text-gray-900">£{weeklyData.voucherSalesBonus || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Private Booking Bonus</p>
                              <p className="text-lg font-semibold text-gray-900">£{weeklyData.privateBookingBonus || 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pre-booked Value Section */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Pre-booked Value</h3>
                    <div className="space-y-6">
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <p className="text-sm font-medium text-gray-700 mb-2">Total Pre-booked Value</p>
                        <p className="text-2xl font-semibold text-green-700">£{weeklyData.preBookedValueNextWeek || 0}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-3">Daily Value Distribution</h4>
                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                          {/* Weekdays */}
                          <div className="grid grid-cols-4 gap-px bg-gray-200">
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Mon</p>
                              <p className="text-lg font-semibold text-gray-900">£{weeklyData.dailyPreBooked?.monday || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Tue</p>
                              <p className="text-lg font-semibold text-gray-900">£{weeklyData.dailyPreBooked?.tuesday || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Wed</p>
                              <p className="text-lg font-semibold text-gray-900">£{weeklyData.dailyPreBooked?.wednesday || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Thu</p>
                              <p className="text-lg font-semibold text-gray-900">£{weeklyData.dailyPreBooked?.thursday || 0}</p>
                            </div>
                          </div>
                          {/* Weekend */}
                          <div className="grid grid-cols-3 gap-px bg-gray-200 mt-px">
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Fri</p>
                              <p className="text-lg font-semibold text-gray-900">£{weeklyData.dailyPreBooked?.friday || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Sat</p>
                              <p className="text-lg font-semibold text-gray-900">£{weeklyData.dailyPreBooked?.saturday || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Sun</p>
                              <p className="text-lg font-semibold text-gray-900">£{weeklyData.dailyPreBooked?.sunday || 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pre-booked People Section */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Pre-booked People</h3>
                    <div className="space-y-6">
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <p className="text-sm font-medium text-gray-700 mb-2">Total Pre-booked People</p>
                        <p className="text-2xl font-semibold text-blue-700">{weeklyData.preBookedPeopleNextWeek || 0}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-3">Daily People Distribution</h4>
                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                          {/* Weekdays */}
                          <div className="grid grid-cols-4 gap-px bg-gray-200">
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Mon</p>
                              <p className="text-lg font-semibold text-gray-900">{weeklyData.dailyPreBookedPeople?.monday || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Tue</p>
                              <p className="text-lg font-semibold text-gray-900">{weeklyData.dailyPreBookedPeople?.tuesday || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Wed</p>
                              <p className="text-lg font-semibold text-gray-900">{weeklyData.dailyPreBookedPeople?.wednesday || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Thu</p>
                              <p className="text-lg font-semibold text-gray-900">{weeklyData.dailyPreBookedPeople?.thursday || 0}</p>
                            </div>
                          </div>
                          {/* Weekend */}
                          <div className="grid grid-cols-3 gap-px bg-gray-200 mt-px">
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Fri</p>
                              <p className="text-lg font-semibold text-gray-900">{weeklyData.dailyPreBookedPeople?.friday || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Sat</p>
                              <p className="text-lg font-semibold text-gray-900">{weeklyData.dailyPreBookedPeople?.saturday || 0}</p>
                            </div>
                            <div className="bg-white p-3">
                              <p className="text-xs text-gray-500 mb-1">Sun</p>
                              <p className="text-lg font-semibold text-gray-900">{weeklyData.dailyPreBookedPeople?.sunday || 0}</p>
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
        </div>
      </div>

      {weeklyData && (
        <WeeklyDataSurveyModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
          onSubmitSuccess={handleSubmitSuccess}
          initialData={weeklyData}
        />
      )}
    </div>
  );
};

export default WeeklyDataPage;