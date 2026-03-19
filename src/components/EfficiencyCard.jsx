import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';

const EfficiencyCard = ({ score = 0, category = "N/A", suggestion = "" }) => {
  const getScoreColor = (s) => {
    if (s >= 90) return "text-green-500";
    if (s >= 70) return "text-primary-500";
    if (s >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="card relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FaShieldAlt className="text-emerald-600" />
          Efficiency Score
        </h3>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
            {/* Simple SVG Progress Ring */}
            <svg className="w-32 h-32 transform -rotate-90">
                <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200 dark:text-gray-700"
                />
                <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (364.4 * score) / 100}
                    className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
                />
            </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-xs text-gray-400">Score</span>
          </div>
        </div>

        <div className="mt-4 text-center">
            <p className="font-semibold text-lg">{category}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{suggestion}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default EfficiencyCard;
