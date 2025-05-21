import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { ClientInfo } from '../types';

interface WeeklyDataSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  initialData?: ClientInfo;
}

const WeeklyDataSurveyModal: React.FC<WeeklyDataSurveyModalProps> = ({ isOpen, onClose, onSubmitSuccess, initialData }) => {
  const { user, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const initialFormData: Partial<ClientInfo> = {
    staffBonus: 0,
    onDeskBonus: 0,
    voucherSalesBonus: 0,
    privateBookingBonus: 0,
    preBookedValueNextWeek: 0,
    preBookedPeopleNextWeek: 0,
    date: new Date().toISOString().split('T')[0],
    createdBy: user?.username || '',
  };

  const [formData, setFormData] = useState(initialFormData);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'date') {
      setFormData((prev) => ({
        ...prev,
        date: value,
      }));
    } else if (value === '' || /^[0-9]*$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? '' : parseInt(value, 10),
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
    setIsSubmitting(true);
    setError('');

    try {
      const url = initialData?.id
        ? `http://localhost:2345/api/weekly-data/${initialData.id}`
        : 'http://localhost:2345/api/weekly-data';
      const method = initialData?.id ? 'PUT' : 'POST';
      const payload = {
        staffBonus: parseInt(String(formData.staffBonus) || '0'),
        onDeskBonus: parseInt(String(formData.onDeskBonus) || '0'),
        voucherSalesBonus: parseInt(String(formData.voucherSalesBonus) || '0'),
        privateBookingBonus: parseInt(String(formData.privateBookingBonus) || '0'),
        preBookedValueNextWeek: parseInt(String(formData.preBookedValueNextWeek) || '0'),
        preBookedPeopleNextWeek: parseInt(String(formData.preBookedPeopleNextWeek) || '0'),
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
            className="relative w-full max-w-5xl"
          >
            <Card className="relative max-h-[100vh] overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>

              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  {initialData?.id ? 'Edit Weekly Data' : 'Weekly Data Entry'}
                </h2>

                {showSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800">Weekly data successfully {initialData?.id ? 'updated' : 'submitted'}!</p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* General Information */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">General Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1">
                        <Input
                          label="Date"
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bonuses */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Bonuses</h3>
                    <div className="grid grid-cols-2 gap-4">
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

                  {/* Pre-Booked for Next Week */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Pre-Booked for Next Week</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Pre-Booked Value (£)"
                        type="number"
                        name="preBookedValueNextWeek"
                        value={formData.preBookedValueNextWeek}
                        onChange={handleChange}
                        min="0"
                      />
                      <Input
                        label="Pre-Booked People"
                        type="number"
                        name="preBookedPeopleNextWeek"
                        value={formData.preBookedPeopleNextWeek}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      className="bg-green-700 text-white hover:bg-green-900 transition-colors px-4 py-2"
                    >
                      {initialData?.id ? 'Update Weekly Data' : 'Submit Weekly Data'}
                    </Button>
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