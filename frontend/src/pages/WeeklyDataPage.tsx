import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientInfo, Status } from '../types';
import Card from '../components/common/Card';
import { FaRegEdit, FaCheck, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import WeeklyDataSurveyModal from './WeeklyDataSurveyModal';
import { Navigate } from 'react-router-dom';

const WeeklyDataPage: React.FC = () => {
  const { token, user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<ClientInfo | null>(null);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);


  // Restrict access to "boss" role
  if (user?.role !== 'boss') {
    return <Navigate to="/dashboard" replace />;
  }

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
    setIsTransitioning(true);
    setDirection('right');
    const newWeekStart = new Date(selectedWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setTimeout(() => {
      setSelectedWeekStart(newWeekStart);
      setIsTransitioning(false);
      setDirection(null);
    }, 200);
  };

  const isCurrentWeek = (weekStart: Date) => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    return weekStart.toDateString() === currentWeekStart.toDateString();
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
        body: JSON.stringify({ isVerified: true, status: 'confirmed' as Status }),
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
      case 'confirmed':
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
          {!isCurrentWeek(selectedWeekStart) && (
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

                {/* Bonuses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Bonuses</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm text-gray-600"><strong>Staff Bonus (£):</strong> {weeklyData.staffBonus || 0}</p>
                      <p className="text-sm text-gray-600"><strong>On Desk Bonus (£):</strong> {weeklyData.onDeskBonus || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Voucher Sales Bonus (£):</strong> {weeklyData.voucherSalesBonus || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Private Booking Bonus (£):</strong> {weeklyData.privateBookingBonus || 0}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Pre-Booked for Next Week</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm text-gray-600"><strong>Pre-Booked Value (£):</strong> {weeklyData.preBookedValueNextWeek || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Pre-Booked People:</strong> {weeklyData.preBookedPeopleNextWeek || 0}</p>
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