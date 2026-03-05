import { motion } from 'framer-motion';
import { FaLeaf, FaTree, FaBolt } from 'react-icons/fa';

const CarbonImpactCard = ({ energyUsage = 0 }) => {
  // CO2 per kWh = 0.82 kg (India average)
  const CO2_FACTOR = 0.82;
  const carbonEmission = energyUsage * CO2_FACTOR;

  // Tree calculation: 1 tree absorbs ≈ 21 kg CO2 per year
  const treesRequiredToOffset = carbonEmission / 21;

  // Visual indicators logic:
  // Low impact → Green (< 4kg)
  // Medium impact → Yellow (4kg - 10kg)
  // High impact → Red (> 10kg)
  let statusColor = "text-green-600 bg-green-100 dark:bg-green-900/20";
  let impactText = "Low";
  let borderColor = "border-green-500";

  if (carbonEmission > 10) {
    statusColor = "text-red-600 bg-red-100 dark:bg-red-900/20";
    impactText = "High";
    borderColor = "border-red-500";
  } else if (carbonEmission > 4) {
    statusColor = "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
    impactText = "Moderate";
    borderColor = "border-yellow-500";
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`card border-l-4 ${borderColor}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FaLeaf className="text-primary-600" />
          Carbon Footprint Tracker
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
          {impactText} Impact
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <FaBolt className="text-yellow-500 text-2xl mb-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400 text-center">Energy Used</span>
          <span className="text-xl font-bold">{energyUsage.toFixed(1)} kWh</span>
        </div>

        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <FaLeaf className="text-gray-600 dark:text-gray-400 text-2xl mb-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400 text-center">CO₂ Emitted</span>
          <span className="text-xl font-bold">{carbonEmission.toFixed(2)} kg</span>
        </div>

        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <FaTree className="text-green-500 text-2xl mb-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400 text-center">Trees to Offset</span>
          <span className="text-xl font-bold">{Math.ceil(treesRequiredToOffset)} Trees</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center italic">
        *Based on average India emission factor of 0.82kg CO₂/kWh
      </p>
    </motion.div>
  );
};

export default CarbonImpactCard;
