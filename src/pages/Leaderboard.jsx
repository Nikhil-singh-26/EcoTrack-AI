import { useState, useEffect } from 'react';
import api from '../services/api';
import { FaTrophy, FaMedal, FaLeaf } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('users/leaderboard');
      setLeaders(res.data.data);
    } catch (error) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <FaTrophy className="text-yellow-500" />
          Eco Warriors Leaderboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Top 10 users with the lowest carbon footprint this month</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">User</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">Carbon Emitted</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {leaders.map((user, index) => (
                <motion.tr 
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 font-bold">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        {index === 0 ? <FaMedal className="text-yellow-500" /> : <FaLeaf className="text-green-500" />}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className="font-semibold text-red-500">{user.totalCarbon.toFixed(2)} kg</span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-green-500 font-medium">+{user.totalSavings.toFixed(1)} kWh</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
