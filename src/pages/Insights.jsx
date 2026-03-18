import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { FaLeaf, FaChartLine, FaCalendarAlt, FaRobot } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';

const Insights = () => {
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [carbonData, setCarbonData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchInsights();
  }, [period]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const [predRes, carbonRes, leaderRes] = await Promise.all([
        api.get('energy/predict-bill'),
        api.get(`energy/carbon-footprint?period=${period}`),
        api.get('users/leaderboard') // need to implement this endpoint
      ]);
      setPrediction(predRes.data.data);
      setCarbonData(carbonRes.data.data);
      setLeaderboard(leaderRes.data.data);
    } catch (error) {
      console.error('Failed to load insights', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Energy Insights</h1>

      {/* Period Selector */}
      <div className="flex space-x-2">
        {['day', 'week', 'month', 'year'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg capitalize ${
              period === p
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bill Prediction */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-3 mb-4">
            <FaChartLine className="text-primary-600 text-xl" />
            <h2 className="text-lg font-semibold">AI Bill Prediction</h2>
          </div>
          {prediction && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Estimated Next Bill</p>
                <p className="text-3xl font-bold text-primary-600">${prediction.predictedBill}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className="text-lg font-semibold">{prediction.confidence}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Trend</p>
                  <p className={`text-lg font-semibold capitalize ${
                    prediction.trend === 'increasing' ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {prediction.trend}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on your average daily consumption of {prediction.averageDaily} kWh
              </p>
            </div>
          )}
        </motion.div>

        {/* Carbon Footprint */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-3 mb-4">
            <FaLeaf className="text-green-600 text-xl" />
            <h2 className="text-lg font-semibold">Carbon Footprint</h2>
          </div>
          {carbonData && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total CO₂ ({period})</p>
                <p className="text-3xl font-bold text-green-600">{carbonData.totalCarbon} kg</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">vs Average</p>
                  <p className={`text-lg font-semibold ${
                    carbonData.isEfficient ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {carbonData.comparison > 0 ? '+' : ''}{carbonData.comparison} kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Trees to offset</p>
                  <p className="text-lg font-semibold">{carbonData.treesNeeded}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card md:col-span-2"
        >
          <div className="flex items-center space-x-3 mb-4">
            <FaCalendarAlt className="text-primary-600 text-xl" />
            <h2 className="text-lg font-semibold">Energy Efficiency Leaderboard</h2>
          </div>
          <div className="space-y-3">
            {leaderboard.map((user, idx) => (
              <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-sm ${
                    idx === 0 ? 'bg-yellow-400 text-gray-900' :
                    idx === 1 ? 'bg-gray-300 text-gray-700' :
                    idx === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">Saved {user.totalEnergySaved} kWh</p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-primary-600">
                  {user.rank} pts
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-gray-500">No data available</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Insights;