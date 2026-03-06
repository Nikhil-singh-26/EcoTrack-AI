import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBolt, FaLeaf, FaMicrochip, FaChartLine, FaExclamationTriangle, FaGem, FaRedo } from 'react-icons/fa';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SummaryCard from '../components/summarycard';
import CarbonImpactCard from '../components/CarbonImpactCard';
import EfficiencyCard from '../components/EfficiencyCard';
import AICopilotPanel from '../components/AICopilotPanel';
import AlertsFeed from '../components/AlertsFeed';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();

    const handleRefresh = () => fetchAllData();
    window.addEventListener('refreshDashboard', handleRefresh);
    return () => window.removeEventListener('refreshDashboard', handleRefresh);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes, scoreRes, rewardsRes] = await Promise.all([
        api.get('/api/energy/stats'),
        api.get('/api/energy/analytics/insights'),
        api.get('/api/energy/analytics/efficiency-score'),
        api.get('/api/rewards')
      ]);

      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setScoreData(scoreRes.data.data);
      setRewards(rewardsRes.data.data);
    } catch (error) {
      console.error('Data Fetch Error:', error);
      toast.error('Failed to load dashboard sync');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  const dailyUsage = stats?.usage?.daily?.total || 0;
  const hasData = dailyUsage > 0 || (analytics?.averageWeeklyUsage && analytics?.averageWeeklyUsage > 0);
  
  // Mock chart data for Recharts (Feature 3)
  const chartData = [
    { name: 'Mon', usage: 4.5, carbon: 3.6 },
    { name: 'Tue', usage: 3.8, carbon: 3.1 },
    { name: 'Wed', usage: 5.2, carbon: 4.2 },
    { name: 'Thu', usage: 4.9, carbon: 4.0 },
    { name: 'Fri', usage: 6.1, carbon: 5.0 },
    { name: 'Sat', usage: 3.2, carbon: 2.6 },
    { name: 'Sun', usage: 2.8, carbon: 2.3 },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-green-500">
            Smart Energy Intelligence
          </h1>
          <p className="text-sm text-gray-500">Welcome back! Here's your real-time impact report.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={fetchAllData}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
            >
                <FaRedo className="text-gray-500" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 rounded-xl font-bold border border-yellow-200">
                <FaGem />
                <span>{rewards?.points || 0} Points</span>
            </div>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
          <FaBolt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No energy data available yet</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Try running a simulation from your devices to see insights.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard 
              title="Avg Daily (Weekly)" 
              value={`${analytics?.averageWeeklyUsage || 0} kWh`} 
              icon={<FaBolt />} 
            />
            <SummaryCard 
              title="Estimated Bill" 
              value={`$${analytics?.estimatedMonthlyBill || 0}`} 
              icon={<FaChartLine />} 
            />
            <SummaryCard 
              title="Peak Usage Day" 
              value={analytics?.highestUsageDay || 'N/A'} 
              icon={<FaExclamationTriangle />} 
            />
            <SummaryCard 
              title="Current Streak" 
              value={`${rewards?.streak || 0} Days`} 
              icon={<FaLeaf />} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Main Trends - Recharts (Feature 3) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Consumption vs Carbon Emission</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="usage" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
                  <Area type="monotone" dataKey="carbon" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCarbon)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="card">
                <h3 className="text-lg font-bold mb-4">Daily Efficiency Comparison</h3>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.slice(-5)}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="usage" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.usage > 5 ? '#ef4444' : '#2563eb'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>
             
             <div className="card bg-gradient-to-br from-primary-600 to-indigo-700 text-white p-6 border-none">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="text-white/80 font-medium">Unlocked Badges</h4>
                        <div className="flex gap-2 mt-4 text-2xl">
                             {(rewards?.badges || []).map((b,i) => (
                                <motion.div key={i} whileHover={{scale: 1.2}} title={b.name} className="p-2 bg-white/20 rounded-lg">
                                    {b.icon}
                                </motion.div>
                             ))}
                             {rewards?.badges?.length === 0 && <span className="text-sm italic opacity-60">No badges yet. Start saving!</span>}
                        </div>
                    </div>
                </div>
                <div className="mt-8">
                    <button 
                        onClick={() => navigate('/leaderboard')}
                        className="w-full py-2 bg-white text-primary-600 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-colors">
                        View Challenges
                    </button>
                </div>
             </div>
          </div>
        </div>

        {/* Intelligence Column */}
        <div className="lg:col-span-4 space-y-6">
          <EfficiencyCard 
            score={scoreData?.score} 
            category={scoreData?.category} 
            suggestion={scoreData?.suggestion}
          />
          
          <CarbonImpactCard energyUsage={dailyUsage} />

          <AlertsFeed />

          <div className="card border-t-4 border-primary-500">
            <h3 className="font-bold mb-3 flex items-center gap-2">
                <FaChartLine className="text-primary-500" />
                AI Suggestion
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                "{analytics?.savingSuggestion}"
            </p>
          </div>
        </div>
        </div>
        </>
      )}

      <AICopilotPanel />
    </div>
  );
};


export default Dashboard;