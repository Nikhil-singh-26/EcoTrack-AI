import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import DeviceForm from '../components/DeviceForm';
import LoadingSpinner from '../components/LoadingSpinner';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/api/devices');
      setDevices(res.data.data);
    } catch (error) {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    try {
      await api.delete(`/api/devices/${id}`);
      setDevices(devices.filter(d => d._id !== id));
      toast.success('Device deleted');
    } catch (error) {
      toast.error('Failed to delete device');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/api/devices/${id}/toggle`);
      setDevices(devices.map(d => 
        d._id === id ? { ...d, status: res.data.data.status } : d
      ));
      toast.success(`Device turned ${res.data.data.status}`);
    } catch (error) {
      toast.error('Failed to toggle device');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devices</h1>
        <button
          onClick={() => {
            setEditingDevice(null);
            setShowForm(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <FaPlus />
          <span>Add Device</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device, idx) => (
          <motion.div
            key={device._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{device.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{device.type}</p>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${
                device.status === 'on' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {device.status}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm"><span className="font-medium">Power:</span> {device.powerRating} W</p>
              <p className="text-sm"><span className="font-medium">Room:</span> {device.room}</p>
              <p className="text-sm"><span className="font-medium">Today's usage:</span> {device.todayUsage?.toFixed(2) || 0} kWh</p>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => handleToggle(device._id, device.status)}
                className={`p-2 rounded ${
                  device.status === 'on'
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                    : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                }`}
                title={device.status === 'on' ? 'Turn off' : 'Turn on'}
              >
                {device.status === 'on' ? <FaToggleOff /> : <FaToggleOn />}
              </button>
              <button
                onClick={() => {
                  setEditingDevice(device);
                  setShowForm(true);
                }}
                className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded"
                title="Edit"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDelete(device._id)}
                className="p-2 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded"
                title="Delete"
              >
                <FaTrash />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {devices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No devices added yet. Click "Add Device" to get started.</p>
        </div>
      )}

      {showForm && (
        <DeviceForm
          device={editingDevice}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            fetchDevices();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
};

export default Devices;