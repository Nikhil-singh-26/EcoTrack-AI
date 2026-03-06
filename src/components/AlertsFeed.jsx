import { useState, useEffect } from 'react';
import { FaBell, FaInfoCircle, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const AlertsFeed = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/api/energy/alerts'); // Assuming this exists or using stats
      setAlerts(res.data.data || []);
    } catch (error) {
      // If endpoint doesn't exist yet, we'll show mock for hackathon demo
      setAlerts([
        { _id: '1', type: 'high-usage', severity: 'warning', title: 'Energy Spike', message: 'Usage 2x higher than normal in Living Room.', createdAt: new Date() },
        { _id: '2', type: 'tip', severity: 'info', title: 'Eco Tip', message: 'Switch off AC for 1 hour to save 1.5kg CO2.', createdAt: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (severity) => {
    switch (severity) {
      case 'critical': return <FaExclamationTriangle className="text-red-500" />;
      case 'warning': return <FaExclamationTriangle className="text-yellow-500" />;
      default: return <FaInfoCircle className="text-blue-500" />;
    }
  };

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FaBell className="text-primary-600" />
          Smart Alerts
        </h3>
        {alerts.length > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full animate-pulse">
            {alerts.length} New
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 italic">No recent alerts. You're doing great!</p>
        ) : (
          alerts.map(alert => (
            <div key={alert._id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 hover:border-primary-200 transition-colors">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">{getIcon(alert.severity)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{alert.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{alert.message}</p>
                  <p className="text-[10px] text-gray-400 mt-2">{new Date(alert.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <button 
        onClick={() => navigate('/insights')}
        className="mt-4 text-xs text-primary-600 font-bold hover:underline w-full text-center">
        View All History
      </button>
    </div>
  );
};

export default AlertsFeed;
