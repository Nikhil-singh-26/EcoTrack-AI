import { NavLink, Link } from 'react-router-dom';
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

const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();

  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: FaTachometerAlt },
    { path: '/devices', name: 'Devices', icon: FaMicrochip },
    { path: '/leaderboard', name: 'Leaderboard', icon: FaTrophy },
    ...(user?.role === 'admin' ? [{ path: '/admin', name: 'Admin', icon: FaUsers }] : []),
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isOpen ? 256 : 0,
        opacity: isOpen ? 1 : 0
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white border-r border-emerald-50 hidden md:block relative h-full overflow-hidden whitespace-nowrap"
    >
      <div className="flex items-center justify-center h-20 border-b border-emerald-50 px-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-200 flex-shrink-0">
            <FaLeaf className="text-white text-xl" />
          </div>
          {isOpen && <span className="text-xl font-black text-emerald-950 tracking-tight">EcoTrack AI</span>}
        </div>
      </div>
      
      <nav className="mt-8 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`
            }
          >
            <item.icon className="mr-3 text-lg flex-shrink-0" />
            {isOpen && <span className="font-semibold">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
      
      {isOpen && (
        <Link 
          to="/profile"
          className="absolute bottom-10 left-4 right-4 p-4 border rounded-2xl border-emerald-50 bg-emerald-50/30 hover:bg-emerald-100/50 transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-emerald-950 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-emerald-600 font-medium truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </Link>
      )}
    </motion.aside>
  );
};

export default Sidebar;