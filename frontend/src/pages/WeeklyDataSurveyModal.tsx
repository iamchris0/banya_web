import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { ClientInfo } from '../types';

interface DailyPreBooked {
  monday: number | undefined;
  tuesday: number | undefined;
  wednesday: number | undefined;
  thursday: number | undefined;
  friday: number | undefined;
  saturday: number | undefined;
  sunday: number | undefined;
}

interface WeeklyDataSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  initialData?: ClientInfo;
}

interface FormData {
  staffBonus?: number;
  onDeskBonus?: number;
  voucherSalesBonus?: number;
  privateBookingBonus?: number;
  preBookedValueNextWeek?: number;
  preBookedPeopleNextWeek?: number;
  date: string;
  createdBy: string;
}

const WeeklyDataSurveyModal: React.FC<WeeklyDataSurveyModalProps> = ({ isOpen, onClose, onSubmitSuccess, initialData }) => {
  const { user, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const initialFormData: FormData = {
    staffBonus: undefined,
    onDeskBonus: undefined,
    voucherSalesBonus: undefined,
    privateBookingBonus: undefined,
    preBookedValueNextWeek: undefined,
    preBookedPeopleNextWeek: undefined,
    date: new Date().toISOString().split('T')[0],
    createdBy: user?.username || '',
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [dailyPreBooked, setDailyPreBooked] = useState<DailyPreBooked>({
    monday: undefined,
    tuesday: undefined,
    wednesday: undefined,
    thursday: undefined,
    friday: undefined,
    saturday: undefined,
    sunday: undefined,
  });
  const [dailyPreBookedPeople, setDailyPreBookedPeople] = useState<DailyPreBooked>({
    monday: undefined,
    tuesday: undefined,
    wednesday: undefined,
    thursday: undefined,
    friday: undefined,
    saturday: undefined,
    sunday: undefined,
  });

  // Calculate max allowed date (1 week from current week start)
  const getMaxAllowedDate = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    
    const maxAllowedWeek = new Date(currentWeekStart);
    maxAllowedWeek.setDate(maxAllowedWeek.getDate() + 7);
    return maxAllowedWeek.toISOString().split('T')[0];
  };

  // Calculate min allowed date (current week start)
  const getMinAllowedDate = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    return currentWeekStart.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData ? {
        ...initialFormData,
        ...initialData,
        date: initialData.date || initialFormData.date,
        createdBy: initialData.createdBy || user?.username || '',
      } : initialFormData);
      setError('');
      setShowSuccess(false);
    }
  }, [isOpen, initialData, user]);

  const calculateDailyDistribution = (totalValue: number, isPeople: boolean = false) => {
    const weekdays = 4; // Monday to Thursday
    const weekendDays = 3; // Friday to Sunday
    const weekdayMultiplier = 0.7;
    const weekendMultiplier = 1.4;

    const baseValue = totalValue / (weekdays * weekdayMultiplier + weekendDays * weekendMultiplier);
    
    const distribution = {
      monday: Math.round(baseValue * weekdayMultiplier),
      tuesday: Math.round(baseValue * weekdayMultiplier),
      wednesday: Math.round(baseValue * weekdayMultiplier),
      thursday: Math.round(baseValue * weekdayMultiplier),
      friday: Math.round(baseValue * weekendMultiplier),
      saturday: Math.round(baseValue * weekendMultiplier),
      sunday: Math.round(baseValue * weekendMultiplier),
    };

    if (isPeople) {
      setDailyPreBookedPeople(distribution);
    } else {
      setDailyPreBooked(distribution);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'date') {
      const selectedDate = new Date(value);
      const maxAllowedDate = new Date(getMaxAllowedDate());
      const minAllowedDate = new Date(getMinAllowedDate());
      
      if (selectedDate > maxAllowedDate) {
        setError('Cannot select a date more than 1 week in advance');
        return;
      }
      
      if (selectedDate < minAllowedDate) {
        setError('Cannot select a date before the current week');
        return;
      }
      
      setFormData((prev) => ({
        ...prev,
        date: value,
      }));
    } else if (name === 'preBookedValueNextWeek') {
      const numericValue = value === '' ? undefined : parseInt(value, 10);
      setFormData((prev) => ({
        ...prev,
        preBookedValueNextWeek: numericValue,
      }));
      if (numericValue !== undefined) {
        calculateDailyDistribution(numericValue, false);
      }
    } else if (name === 'preBookedPeopleNextWeek') {
      const numericValue = value === '' ? undefined : parseInt(value, 10);
      setFormData((prev) => ({
        ...prev,
        preBookedPeopleNextWeek: numericValue,
      }));
    } else if (name.startsWith('dailyPreBooked_')) {
      const day = name.split('_')[1] as keyof DailyPreBooked;
      const numericValue = value === '' ? undefined : parseInt(value, 10);
      setDailyPreBooked((prev) => ({
        ...prev,
        [day]: numericValue,
      }));
    } else if (name.startsWith('dailyPreBookedPeople_')) {
      const day = name.split('_')[1] as keyof DailyPreBooked;
      const numericValue = value === '' ? undefined : parseInt(value, 10);
      setDailyPreBookedPeople((prev) => ({
        ...prev,
        [day]: numericValue,
      }));
    } else if (value === '' || /^[0-9]*$/.test(value)) {
      const numericValue = value === '' ? undefined : parseInt(value, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('No authentication token available');
      return;
    }
    if (!user?.username) {
      setError('User information missing');
      return;
    }

    // Validate that all daily people fields are filled
    const allPeopleFieldsFilled = Object.values(dailyPreBookedPeople).every(value => value !== undefined && value !== null && value >= 0);
    if (!allPeopleFieldsFilled) {
      setError('Please fill in all daily people distribution fields');
      return;
    }

    // Calculate sum of daily people values
    const totalDailyPeople = Object.values(dailyPreBookedPeople).reduce((sum, value) => sum + (value || 0), 0);
    const totalPreBookedPeople = formData.preBookedPeopleNextWeek || 0;

    // Validate that total matches sum of daily values for people
    if (totalDailyPeople !== totalPreBookedPeople) {
      setError(`Total pre-booked people (${totalPreBookedPeople}) must match the sum of daily people (${totalDailyPeople})`);
      return;
    }

    // Validate that all daily value fields are filled
    const allValueFieldsFilled = Object.values(dailyPreBooked).every(value => value !== undefined && value !== null && value >= 0);
    if (!allValueFieldsFilled) {
      setError('Please fill in all daily value distribution fields');
      return;
    }

    // Calculate sum of daily value values
    const totalDailyValue = Object.values(dailyPreBooked).reduce((sum, value) => sum + (value || 0), 0);
    const totalPreBookedValue = formData.preBookedValueNextWeek || 0;

    // Validate that total matches sum of daily values for value
    if (totalDailyValue !== totalPreBookedValue) {
      setError(`Total pre-booked value (${totalPreBookedValue}) must match the sum of daily values (${totalDailyValue})`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const url = initialData?.id
        ? `http://localhost:2345/api/weekly-data/${initialData.id}`
        : 'http://localhost:2345/api/weekly-data';
      const method = initialData?.id ? 'PUT' : 'POST';
      const payload = {
        staffBonus: formData.staffBonus || 0,
        onDeskBonus: formData.onDeskBonus || 0,
        voucherSalesBonus: formData.voucherSalesBonus || 0,
        privateBookingBonus: formData.privateBookingBonus || 0,
        preBookedValueNextWeek: formData.preBookedValueNextWeek || 0,
        preBookedPeopleNextWeek: totalPreBookedPeople,
        dailyPreBooked: Object.fromEntries(
          Object.entries(dailyPreBooked).map(([key, value]) => [key, value || 0])
        ),
        dailyPreBookedPeople: Object.fromEntries(
          Object.entries(dailyPreBookedPeople).map(([key, value]) => [key, value || 0])
        ),
        date: formData.date,
        createdBy: user.username,
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${initialData?.id ? 'update' : 'submit'} weekly data: ${response.status}`);
      }

      setIsSubmitting(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        onSubmitSuccess();
      }, 2000);
    } catch (err) {
      console.error('Submit weekly data error:', err);
      setError(err instanceof Error ? err.message : 'Error submitting weekly data. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-7xl"
          >
            <Card className="relative max-h-[100vh] overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>

              <div className="p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-8">
                  {initialData?.id ? 'Edit Weekly Data' : 'Weekly Data Entry'}
                </h2>

                {showSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800">Weekly data successfully {initialData?.id ? 'updated' : 'submitted'}!</p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Bonuses Section */}
                    <div className="bg-gray-50 p-8 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-6">Bonuses</h3>
                      <div className="space-y-6">
                        <Input
                          label="Staff Bonus (£)"
                          type="number"
                          name="staffBonus"
                          value={formData.staffBonus}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="On Desk Bonus (£)"
                          type="number"
                          name="onDeskBonus"
                          value={formData.onDeskBonus}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Voucher Sales Bonus (£)"
                          type="number"
                          name="voucherSalesBonus"
                          value={formData.voucherSalesBonus}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Private Booking Bonus (£)"
                          type="number"
                          name="privateBookingBonus"
                          value={formData.privateBookingBonus}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Pre-booked Value Section */}
                    <div className="bg-gray-50 p-8 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-6">Pre-booked Value</h3>
                      <div className="space-y-8">
                        <Input
                          label="Total Pre-booked Value (£)"
                          type="number"
                          name="preBookedValueNextWeek"
                          value={formData.preBookedValueNextWeek}
                          onChange={handleChange}
                          min="0"
                        />
                        
                        <div>
                          <h4 className="text-md font-medium text-gray-700 mb-4">Daily Value Distribution</h4>
                          <div className="space-y-6">
                            {/* First row: Monday to Thursday */}
                            <div className="grid grid-cols-2 gap-6">
                              <Input
                                label="Monday"
                                type="number"
                                name="dailyPreBooked_monday"
                                value={dailyPreBooked.monday}
                                onChange={handleChange}
                                min="0"
                              />
                              <Input
                                label="Tuesday"
                                type="number"
                                name="dailyPreBooked_tuesday"
                                value={dailyPreBooked.tuesday}
                                onChange={handleChange}
                                min="0"
                              />
                              <Input
                                label="Wednesday"
                                type="number"
                                name="dailyPreBooked_wednesday"
                                value={dailyPreBooked.wednesday}
                                onChange={handleChange}
                                min="0"
                              />
                              <Input
                                label="Thursday"
                                type="number"
                                name="dailyPreBooked_thursday"
                                value={dailyPreBooked.thursday}
                                onChange={handleChange}
                                min="0"
                              />
                            </div>
                            {/* Second row: Friday to Sunday */}
                            <div className="grid grid-cols-3 gap-6">
                              <Input
                                label="Friday"
                                type="number"
                                name="dailyPreBooked_friday"
                                value={dailyPreBooked.friday}
                                onChange={handleChange}
                                min="0"
                              />
                              <Input
                                label="Saturday"
                                type="number"
                                name="dailyPreBooked_saturday"
                                value={dailyPreBooked.saturday}
                                onChange={handleChange}
                                min="0"
                              />
                              <Input
                                label="Sunday"
                                type="number"
                                name="dailyPreBooked_sunday"
                                value={dailyPreBooked.sunday}
                                onChange={handleChange}
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pre-booked People Section */}
                    <div className="bg-gray-50 p-8 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-6">Pre-booked People</h3>
                      <div className="space-y-8">
                        <Input
                          label="Total Pre-booked People"
                          type="number"
                          name="preBookedPeopleNextWeek"
                          value={formData.preBookedPeopleNextWeek}
                          onChange={handleChange}
                        />
                        
                        <div>
                          <h4 className="text-md font-medium text-gray-700 mb-4">Daily People Distribution</h4>
                          <div className="space-y-6">
                            {/* First row: Monday to Thursday */}
                            <div className="grid grid-cols-2 gap-6">
                              <Input
                                label="Monday"
                                type="number"
                                name="dailyPreBookedPeople_monday"
                                value={dailyPreBookedPeople.monday}
                                onChange={handleChange}
                                min="0"
                                required
                              />
                              <Input
                                label="Tuesday"
                                type="number"
                                name="dailyPreBookedPeople_tuesday"
                                value={dailyPreBookedPeople.tuesday}
                                onChange={handleChange}
                                min="0"
                                required
                              />
                              <Input
                                label="Wednesday"
                                type="number"
                                name="dailyPreBookedPeople_wednesday"
                                value={dailyPreBookedPeople.wednesday}
                                onChange={handleChange}
                                min="0"
                                required
                              />
                              <Input
                                label="Thursday"
                                type="number"
                                name="dailyPreBookedPeople_thursday"
                                value={dailyPreBookedPeople.thursday}
                                onChange={handleChange}
                                min="0"
                                required
                              />
                            </div>
                            {/* Second row: Friday to Sunday */}
                            <div className="grid grid-cols-3 gap-6">
                              <Input
                                label="Friday"
                                type="number"
                                name="dailyPreBookedPeople_friday"
                                value={dailyPreBookedPeople.friday}
                                onChange={handleChange}
                                min="0"
                                required
                              />
                              <Input
                                label="Saturday"
                                type="number"
                                name="dailyPreBookedPeople_saturday"
                                value={dailyPreBookedPeople.saturday}
                                onChange={handleChange}
                                min="0"
                                required
                              />
                              <Input
                                label="Sunday"
                                type="number"
                                name="dailyPreBookedPeople_sunday"
                                value={dailyPreBookedPeople.sunday}
                                onChange={handleChange}
                                min="0"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date and Submit Button */}
                  <div className="bg-gray-50 p-8 rounded-lg">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          max={getMaxAllowedDate()}
                          min={getMinAllowedDate()}
                          required
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 h-10 px-3 py-2"
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="h-6"></div>
                        <Button
                          type="submit"
                          isLoading={isSubmitting}
                          className="w-full bg-green-700 text-white hover:bg-green-900 transition-colors h-10"
                        >
                          {initialData?.id ? 'Update Weekly Data' : 'Submit Weekly Data'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WeeklyDataSurveyModal;