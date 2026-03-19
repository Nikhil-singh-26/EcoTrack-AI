import { motion } from 'framer-motion'

const SummaryCard = ({ title, value, icon, change, onClick }) => {
  const isPositive = change >= 0

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`card ${onClick ? 'cursor-pointer hover:shadow-lg transition-all duration-300' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-full text-primary-600 text-xl">
          {icon}
        </div>
      </div>
      {change !== undefined && (
        <p className={`mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{change}% from last period
        </p>
      )}
    </motion.div>
  )
}

export default SummaryCard