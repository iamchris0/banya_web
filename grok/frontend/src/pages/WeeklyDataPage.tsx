import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientInfo } from '../types';
import Card from '../components/common/Card';
import { FaRegEdit, FaCheck, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import SurveyModal from './AddInformationPage';
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
      // If no data exists for the week, initialize with defaults
      setWeeklyData(
        data.weeklyData || {
          id: null,
          amountOfPeople: 0,
          male: 0,
          female: 0,
          otherGender: 0,
          englishSpeaking: 0,
          russianSpeaking: 0,
          offPeakClients: 0,
          peakTimeClients: 0,
          newClients: 0,
          soldVouchersAmount: 0,
          soldVouchersTotal: 0,
          soldMembershipsAmount: 0,
          soldMembershipsTotal: 0,
          yottaDepositsAmount: 0,
          yottaDepositsTotal: 0,
          yottaLinksAmount: 0,
          yottaLinksTotal: 0,
          date: weekStart,
          createdBy: user.username,
          isVerified: false,
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
    if (!token || !weeklyData?.id) {
      setError('No authentication token or data ID available');
      return;
    }
    try {
      const response = await fetch(`http://localhost:2345/api/weekly-data/${weeklyData.id}/verify`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVerified: true }),
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
                {/* Title and Buttons */}
                <div className="flex justify-between items-center">
                  {!weeklyData.isVerified && (
                    <div className="flex space-x-2 ml-auto">
                      <button
                        onClick={handleEdit}
                        className="p-2 text-blue-700 hover:text-blue-800 transition-colors"
                        title="Edit Weekly Data"
                      >
                        <FaRegEdit size={20} />
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="p-2 text-green-700 hover:text-green-900 transition-colors"
                        title="Confirm Weekly Data"
                      >
                        <FaCheck size={20} />
                      </button>
                    </div>
                  )}
                </div>
                {/* First Horizontal Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Information */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">General Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm text-gray-600"><strong>Total Visitors:</strong> {weeklyData.amountOfPeople || 0}</p>
                        <p className="text-sm text-gray-600"><strong>New Clients:</strong> {weeklyData.newClients || 0}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm text-gray-600"><strong>Male:</strong> {weeklyData.male || 0}</p>
                        <p className="text-sm text-gray-600"><strong>Female:</strong> {weeklyData.female || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Demographics & Timing */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Demographics & Timing</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm text-gray-600"><strong>English Speaking:</strong> {weeklyData.englishSpeaking || 0}</p>
                        <p className="text-sm text-gray-600"><strong>Russian Speaking:</strong> {weeklyData.russianSpeaking || 0}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm text-gray-600"><strong>Off-Peak:</strong> {weeklyData.offPeakClients || 0}</p>
                        <p className="text-sm text-gray-600"><strong>Peak-Time:</strong> {weeklyData.peakTimeClients || 0}</p>
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
                      <p className="text-sm text-gray-600"><strong>Vouchers Sold:</strong> {weeklyData.soldVouchersAmount || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Vouchers Total (£):</strong> {weeklyData.soldVouchersTotal || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Memberships Sold:</strong> {weeklyData.soldMembershipsAmount || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Memberships Total (£):</strong> {weeklyData.soldMembershipsTotal || 0}</p>
                    </div>
                  </div>

                  {/* Yotta Transactions */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Yotta Transactions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm text-gray-600"><strong>Deposits:</strong> {weeklyData.yottaDepositsAmount || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Deposits Total (£):</strong> {weeklyData.yottaDepositsTotal || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Links:</strong> {weeklyData.yottaLinksAmount || 0}</p>
                      <p className="text-sm text-gray-600"><strong>Links Total (£):</strong> {weeklyData.yottaLinksTotal || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {weeklyData && (
        <SurveyModal
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