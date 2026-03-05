import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaHome, 
  FaMicrochip, 
  FaChartLine, 
  FaUser, 
  FaCog,
  FaLeaf,
  FaTachometerAlt,
  FaUsers,
  FaTrophy // Added FaTrophy
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: FaTachometerAlt },
    { path: '/devices', name: 'Devices', icon: FaMicrochip },
    { path: '/insights', name: 'Insights', icon: FaChartLine },
    { path: '/leaderboard', name: 'Leaderboard', icon: FaTrophy },
    { path: '/profile', name: 'Profile', icon: FaUser },
    ...(user?.role === 'admin' ? [{ path: '/admin', name: 'Admin', icon: FaUsers }] : []),
  ];

  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-white dark:bg-gray-800 shadow-lg hidden md:block"
    >
      <div className="flex items-center justify-center h-16 border-b dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <FaLeaf className="text-primary-600 text-2xl" />
          <span className="text-xl font-bold text-gray-800 dark:text-white">EcoTrack AI</span>
        </div>
      </div>
      
      <nav className="mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors ${
                isActive ? 'bg-primary-100 dark:bg-gray-700 border-r-4 border-primary-600' : ''
              }`
            }
          >
            <item.icon className="mr-3" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4 border-t dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;