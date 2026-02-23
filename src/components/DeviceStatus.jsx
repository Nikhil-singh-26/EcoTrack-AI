import { useState, useEffect } from 'react';
import api from '../services/api';
import { FaPlug, FaPowerOff } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const DeviceStatus = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/api/devices');
      setDevices(res.data.data);
    } catch (error) {
      console.error('Failed to fetch devices', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = async (id, currentStatus) => {
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

  const simulateDevice = async (id) => {
    try {
      await api.post('/api/energy/simulate', { deviceId: id, hours: 1 });
      toast.success('Simulation data added');
    } catch (error) {
      toast.error('Simulation failed');
    }
  };

  if (loading) return <div>Loading devices...</div>;

  return (
    <div className="space-y-3">
      {devices.slice(0, 5).map((device, idx) => (
        <motion.div
          key={device._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${
              device.status === 'on' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <div>
              <p className="font-medium text-sm">{device.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {device.powerRating} W · {device.room}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => simulateDevice(device._id)}
              className="p-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-200"
              title="Simulate usage"
            >
              Simulate
            </button>
            <button
              onClick={() => toggleDevice(device._id, device.status)}
              className={`p-2 rounded-full ${
                device.status === 'on'
                  ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
                  : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
              }`}
            >
              {device.status === 'on' ? <FaPowerOff /> : <FaPlug />}
            </button>
          </div>
        </motion.div>
      ))}
      {devices.length === 0 && (
        <p className="text-center text-gray-500">No devices added yet.</p>
      )}
    </div>
  );
};

export default DeviceStatus;