import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { ClientInfo } from '../types';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose, onSubmitSuccess }) => {
  const { user, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<ClientInfo>>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    serviceType: '',
    duration: '',
    notes: '',
  });

  // Reset formData when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        date: new Date().toISOString().split('T')[0],
        serviceType: '',
        duration: '',
        notes: '',
      });
      setError('');
      setShowSuccess(false);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      const response = await fetch('http://localhost:2345/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          date: formData.date,
          serviceType: formData.serviceType,
          duration: formData.duration,
          notes: formData.notes || '',
          createdBy: user.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to submit client: ${response.status}`);
      }

      setIsSubmitting(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        onSubmitSuccess();
      }, 2000);
    } catch (err) {
      console.error('Submit client error:', err);
      setError(err instanceof Error ? err.message : 'Error submitting information. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 w-full max-w-lg"
          >
            <Card className="relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>

              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add Client Information</h2>

                {showSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">Information has been successfully submitted!</span>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Client Name"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter client's full name"
                      required
                    />
                    <Input
                      label="Date of Visit"
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                      <select
                        id="serviceType"
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select a service</option>
                        <option value="sauna">Sauna</option>
                        <option value="steam">Steam Bath</option>
                        <option value="jacuzzi">Jacuzzi</option>
                        <option value="massage">Massage</option>
                        <option value="package">Package Deal</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <select
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select duration</option>
                        <option value="30min">30 minutes</option>
                        <option value="1hr">1 hour</option>
                        <option value="2hr">2 hours</option>
                        <option value="3hr">3 hours</option>
                        <option value="4hr">4 hours</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter any additional information about the client or service"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      className="bg-green-900 text-white hover:bg-green-800 transition-colors"
                    >
                      Submit Information
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

export default SurveyModal;