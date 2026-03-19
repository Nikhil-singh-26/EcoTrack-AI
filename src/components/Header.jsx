import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaBars, FaSignOutAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-emerald-50 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-emerald-700 hover:bg-emerald-50"
          >
            <FaBars />
          </button>

          {/* Right side icons */}
          <div className="flex items-center space-x-4 ml-auto">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-emerald-700 hover:bg-emerald-50"
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button className="flex items-center space-x-2 focus:outline-none">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-sm font-bold text-emerald-950">
                  {user?.name}
                </span>
              </button>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-emerald-700 hover:bg-emerald-50"
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t dark:border-gray-700"
        >
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/devices"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Devices
            </Link>
            <Link
              to="/insights"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Insights
            </Link>
            <Link
              to="/leaderboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Leaderboard
            </Link>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;