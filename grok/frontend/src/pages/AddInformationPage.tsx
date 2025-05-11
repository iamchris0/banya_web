import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const AddInformationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    serviceType: '',
    duration: '',
    notes: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      console.log('Submitted data:', {
        ...formData,
        createdBy: user?.username,
        isVerified: false,
      });
      
      setIsSubmitting(false);
      setShowSuccess(true);
      
      setFormData({
        name: '',
        date: new Date().toISOString().split('T')[0],
        serviceType: '',
        duration: '',
        notes: '',
      });
      
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/');
      }, 2000);
    }, 1000);
  };
  
  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col items-center p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-semibold text-green-600 mb-8">Add Client Information</h1>
        
        {showSuccess && (
          <div className="mb-6 p-3 bg-green-50 text-green-600 rounded-md text-sm border border-green-200">
            Information submitted successfully!
          </div>
        )}
        
        <Card className="bg-gray-50 border border-green-200 shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Client Name"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter client's full name"
                className="bg-white border-green-200"
                required
              />
              
              <Input
                label="Date of Visit"
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className="bg-white border-green-200"
                required
              />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-green-200 rounded-md focus:ring-green-500 focus:border-green-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-green-200 rounded-md focus:ring-green-500 focus:border-green-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 bg-white border border-green-200 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Add any notes about the client or service"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/')}
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Submit Information
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AddInformationPage;