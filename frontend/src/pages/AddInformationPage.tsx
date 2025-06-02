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
  initialData?: ClientInfo;
  selectedDate: string;
}

const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose, onSubmitSuccess, initialData, selectedDate }) => {
  const { user, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const initialFormData: Partial<ClientInfo> = {
    amountOfPeople: 0,
    male: 0,
    female: 0,
    englishSpeaking: 0,
    russianSpeaking: 0,
    offPeakClients: 0,
    peakTimeClients: 0,
    newClients: 0,
    onlineMembershipsAmount: 0,
    onlineMembershipsTotal: 0,
    offlineMembershipsAmount: 0,
    offlineMembershipsTotal: 0,
    onlineVouchersAmount: 0,
    onlineVouchersTotal: 0,
    paperVouchersAmount: 0,
    paperVouchersTotal: 0,
    yottaLinksAmount: 0,
    yottaLinksTotal: 0,
    yottaWidgetAmount: 0,
    yottaWidgetTotal: 0,
    createdBy: user?.username || '',
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData ? {
        ...initialFormData,
        ...initialData,
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

    // Add validation for total people vs sum of men and women
    const totalPeople = parseInt(String(formData.amountOfPeople) || '0');
    const sumOfGenders = parseInt(String(formData.male) || '0') + parseInt(String(formData.female) || '0');
    
    if (totalPeople !== sumOfGenders) {
      setError(`Total number of people (${totalPeople}) must equal the sum of male (${formData.male}) and female (${formData.female})`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const url = initialData?.id
        ? `http://localhost:2345/api/clients/${initialData.id}`
        : 'http://localhost:2345/api/clients';
      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountOfPeople: parseInt(String(formData.amountOfPeople) || '0'),
          male: parseInt(String(formData.male) || '0'),
          female: parseInt(String(formData.female) || '0'),
          englishSpeaking: parseInt(String(formData.englishSpeaking) || '0'),
          russianSpeaking: parseInt(String(formData.russianSpeaking) || '0'),
          offPeakClients: parseInt(String(formData.offPeakClients) || '0'),
          peakTimeClients: parseInt(String(formData.peakTimeClients) || '0'),
          newClients: parseInt(String(formData.newClients) || '0'),
          onlineMembershipsAmount: parseInt(String(formData.onlineMembershipsAmount) || '0'),
          onlineMembershipsTotal: parseInt(String(formData.onlineMembershipsTotal) || '0'),
          offlineMembershipsAmount: parseInt(String(formData.offlineMembershipsAmount) || '0'),
          offlineMembershipsTotal: parseInt(String(formData.offlineMembershipsTotal) || '0'),
          onlineVouchersAmount: parseInt(String(formData.onlineVouchersAmount) || '0'),
          onlineVouchersTotal: parseInt(String(formData.onlineVouchersTotal) || '0'),
          paperVouchersAmount: parseInt(String(formData.paperVouchersAmount) || '0'),
          paperVouchersTotal: parseInt(String(formData.paperVouchersTotal) || '0'),
          yottaLinksAmount: parseInt(String(formData.yottaLinksAmount) || '0'),
          yottaLinksTotal: parseInt(String(formData.yottaLinksTotal) || '0'),
          date: selectedDate,
          createdBy: user.username,
          status: initialData?.id 
            ? (user.role === 'head' ? 'edited' : 'pending')
            : 'pending',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${initialData?.id ? 'update' : 'submit'} client: ${response.status}`);
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
                  {initialData?.id ? 'Edit Client Survey' : 'Daily Client Survey'}
                </h2>

                {showSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800">Survey successfully {initialData?.id ? 'updated' : 'submitted'}!</p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* First Horizontal Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* General Information */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">General Information</h3>
                      <div className="space-y-4">
                        {/* Row 1: Total Visitors */}
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Total Visitors"
                            type="number"
                            name="amountOfPeople"
                            value={formData.amountOfPeople}
                            onChange={handleChange}
                            min="0"
                            required
                          />
                          <Input
                            label="New Clients"
                            type="number"
                            name="newClients"
                            value={formData.newClients}
                            onChange={handleChange}
                            min="0"
                          />
                        </div>
                        {/* Row 3: Male and Female */}
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Male"
                            type="number"
                            name="male"
                            value={formData.male}
                            onChange={handleChange}
                            min="0"
                          />
                          <Input
                            label="Female"
                            type="number"
                            name="female"
                            value={formData.female}
                            onChange={handleChange}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Demographics & Timing */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Demographics & Timing</h3>
                      <div className="space-y-4">
                        {/* Row 1: English and Russian Speaking */}
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="English Speaking"
                            type="number"
                            name="englishSpeaking"
                            value={formData.englishSpeaking}
                            onChange={handleChange}
                            min="0"
                          />
                          <Input
                            label="Russian Speaking"
                            type="number"
                            name="russianSpeaking"
                            value={formData.russianSpeaking}
                            onChange={handleChange}
                            min="0"
                          />
                        </div>
                        {/* Row 2: Off-Peak and Peak-Time */}
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Off-Peak"
                            type="number"
                            name="offPeakClients"
                            value={formData.offPeakClients}
                            onChange={handleChange}
                            min="0"
                          />
                          <Input
                            label="Peak-Time"
                            type="number"
                            name="peakTimeClients"
                            value={formData.peakTimeClients}
                            onChange={handleChange}
                            min="0"
                          />
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
                        <Input
                          label="Online Memberships"
                          type="number"
                          name="onlineMembershipsAmount"
                          value={formData.onlineMembershipsAmount}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Online Memberships (£)"
                          type="number"
                          name="onlineMembershipsTotal"
                          value={formData.onlineMembershipsTotal}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Offline Memberships"
                          type="number"
                          name="offlineMembershipsAmount"
                          value={formData.offlineMembershipsAmount}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Offline Memberships (£)"
                          type="number"
                          name="offlineMembershipsTotal"
                          value={formData.offlineMembershipsTotal}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Online Vouchers"
                          type="number"
                          name="onlineVouchersAmount"
                          value={formData.onlineVouchersAmount}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Online Vouchers (£)"
                          type="number"
                          name="onlineVouchersTotal"
                          value={formData.onlineVouchersTotal}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Paper Vouchers"
                          type="number"
                          name="paperVouchersAmount"
                          value={formData.paperVouchersAmount}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Paper Vouchers Total (£)"
                          type="number"
                          name="paperVouchersTotal"
                          value={formData.paperVouchersTotal}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Transactions */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Transactions</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Yotta Link"
                          type="number"
                          name="yottaLinksAmount"
                          value={formData.yottaLinksAmount}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Yotta Link (£)"
                          type="number"
                          name="yottaLinksTotal"
                          value={formData.yottaLinksTotal}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Yotta Widget"
                          type="number"
                          name="yottaWidgetAmount"
                          value={formData.yottaWidgetAmount}
                          onChange={handleChange}
                          min="0"
                        />
                        <Input
                          label="Yotta Widget (£)"
                          type="number"
                          name="yottaWidgetTotal"
                          value={formData.yottaWidgetTotal}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      className="bg-green-700 text-white hover:bg-green-900 transition-colors px-4 py-2"
                    >
                      {initialData?.id ? 'Update Survey' : 'Submit Survey'}
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