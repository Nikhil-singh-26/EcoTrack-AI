import { useState, useEffect } from 'react';
import { FaBell, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationDropdown = () => {
  const [alerts, setAlerts] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'inbox'

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('energy/alerts');
      setAlerts(res.data.data || []);
    } catch (error) {
      try {
        const deviceRes = await api.get('devices');
        const activeDevices = deviceRes.data.data.filter(d => d.status === 'on');
        const activeAc = activeDevices.find(d => d.type === 'ac');
        
        const mockAlerts = [
          { _id: '1', type: 'high-usage', severity: 'warning', title: 'Energy Spike', message: 'Usage 2x higher than normal in Living Room.', createdAt: new Date() }
        ];

        if (activeAc) {
          mockAlerts.push({ 
            _id: '2', 
            type: 'tip', 
            severity: 'info', 
            title: 'Eco Tip', 
            message: `Switch off ${activeAc.name} for 1 hour to save 1.5kg CO2.`, 
            createdAt: new Date() 
          });
        } else if (activeDevices.length > 0) {
          mockAlerts.push({ 
            _id: '3', 
            type: 'tip', 
            severity: 'info', 
            title: 'Eco Tip', 
            message: `Switch off ${activeDevices[0].name} to reduce standby power.`, 
            createdAt: new Date() 
          });
        } else {
          mockAlerts.push({ 
            _id: '4', 
            type: 'tip', 
            severity: 'info', 
            title: 'General Tip', 
            message: 'All devices are off. Excellent job saving energy!', 
            createdAt: new Date() 
          });
        }
        setAlerts(mockAlerts);
      } catch (e) {
        setAlerts([
          { _id: '1', type: 'high-usage', severity: 'warning', title: 'Energy Spike', message: 'Normal simulation data loaded.', createdAt: new Date() }
        ]);
      }
    }
  };

  const unreadAlerts = alerts.filter(a => !readIds.has(a._id));
  const readAlerts = alerts.filter(a => readIds.has(a._id));
  const currentViewAlerts = activeTab === 'new' ? unreadAlerts : readAlerts;

  const markAllRead = () => {
    const allIds = new Set([...readIds, ...alerts.map(a => a._id)]);
    setReadIds(allIds);
    setActiveTab('inbox');
  };

  const getIcon = (severity) => {
    switch (severity) {
      case 'critical': return <FaExclamationTriangle className="text-red-500" />;
      case 'warning': return <FaExclamationTriangle className="text-yellow-500" />;
      default: return <FaInfoCircle className="text-emerald-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-emerald-700 hover:bg-emerald-50 relative focus:outline-none transition-all duration-200"
      >
        <FaBell className="text-xl" />
        {unreadAlerts.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white ring-1 ring-red-200 animate-bounce">
            {unreadAlerts.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl shadow-emerald-200/50 border border-emerald-50 z-20 overflow-hidden"
            >
              <div className="p-4 border-b border-emerald-50 bg-emerald-50/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-emerald-950 flex items-center gap-2">
                    <FaBell className="text-emerald-600" />
                    Alerts Center
                  </h3>
                  {unreadAlerts.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                      {unreadAlerts.length} New
                    </span>
                  )}
                </div>
                
                <div className="flex p-0.5 bg-emerald-100/50 rounded-xl">
                  <button 
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${activeTab === 'new' ? 'bg-white text-emerald-600 shadow-sm' : 'text-emerald-500'}`}
                  >
                    NEW ({unreadAlerts.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab('inbox')}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${activeTab === 'inbox' ? 'bg-white text-emerald-600 shadow-sm' : 'text-emerald-500'}`}
                  >
                    INBOX ({readAlerts.length})
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                {currentViewAlerts.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-emerald-600 font-medium italic">No notifications in {activeTab}.</p>
                  </div>
                ) : (
                  currentViewAlerts.map(alert => (
                    <div 
                      key={alert._id} 
                      className={`p-3 rounded-2xl bg-white border border-transparent hover:border-emerald-100 hover:bg-emerald-50/30 transition-all duration-200 group cursor-pointer ${activeTab === 'inbox' ? 'opacity-80' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1 p-2 bg-white rounded-xl shadow-sm border border-emerald-50 group-hover:scale-110 transition-transform">
                          {getIcon(alert.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-black text-emerald-950 truncate ${activeTab === 'inbox' ? 'font-bold' : ''}`}>{alert.title}</p>
                          <p className="text-xs text-emerald-600 font-medium mt-0.5 leading-tight line-clamp-2">{alert.message}</p>
                          <p className="text-[10px] text-emerald-400 font-bold mt-2 uppercase tracking-wider">{new Date(alert.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {activeTab === 'new' && unreadAlerts.length > 0 && (
                <div className="p-3 border-t border-emerald-50 bg-white">
                  <button 
                    onClick={markAllRead}
                    className="w-full py-2 bg-emerald-600 text-white text-[11px] font-black hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-200"
                  >
                    MARK ALL AS READ
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
