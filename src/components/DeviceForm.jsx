import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

const DeviceForm = ({ device, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: device?.name || '',
    type: device?.type || 'other',
    powerRating: device?.powerRating || '',
    room: device?.room || 'Living Room',
    isSmart: device?.isSmart || false
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (device) {
        await api.put(`/api/devices/${device._id}`, formData);
        toast.success('Device updated');
      } else {
        await api.post('/api/devices', formData);
        toast.success('Device added');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">{device ? 'Edit Device' : 'Add New Device'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Device Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input"
              placeholder="e.g., Living Room AC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Device Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input"
            >
              <option value="ac">Air Conditioner</option>
              <option value="fan">Fan</option>
              <option value="refrigerator">Refrigerator</option>
              <option value="tv">TV</option>
              <option value="light">Light</option>
              <option value="washer">Washing Machine</option>
              <option value="oven">Oven</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Power Rating (Watts)</label>
            <input
              type="number"
              name="powerRating"
              value={formData.powerRating}
              onChange={handleChange}
              required
              min="1"
              className="input"
              placeholder="e.g., 1500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Room</label>
            <input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Living Room"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isSmart"
              checked={formData.isSmart}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 rounded"
            />
            <label className="ml-2 text-sm">This is a smart device</label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : device ? 'Update Device' : 'Add Device'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DeviceForm;