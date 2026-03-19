import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaLeaf, FaDollarSign, FaBolt, FaHistory, FaCheckCircle, FaUndo } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

const SavingsSimulator = () => {
    const [devices, setDevices] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [simulatedHours, setSimulatedHours] = useState({});
    
    // Results
    const [originalMonthly, setOriginalMonthly] = useState({ cost: 0, kwh: 0, co2: 0 });
    const [newMonthly, setNewMonthly] = useState({ cost: 0, kwh: 0, co2: 0 });

    const CO2_FACTOR = 0.85; 
    const RATE = 0.12; 

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [devRes, statsRes] = await Promise.all([
                api.get('devices'),
                api.get('energy/stats')
            ]);
            
            const activeDevices = devRes.data.data;
            setDevices(activeDevices);
            setStats(statsRes.data.data);

            // Set initial simulated hours (default to current average or a baseline)
            const initialHours = {};
            activeDevices.forEach(d => {
                // If device is high power (AC/Oven), simulate 4 hrs, else 8 hrs
                initialHours[d._id] = d.powerRating > 1500 ? 4 : 8;
            });
            setSimulatedHours(initialHours);

            // Baseline Cost from stats if available, else calculate from initialHours
            const monthlyStats = statsRes.data.data?.usage?.monthly;
            if (monthlyStats?.total > 0) {
                setOriginalMonthly({
                    cost: monthlyStats.cost || (monthlyStats.total * RATE),
                    kwh: monthlyStats.total,
                    co2: monthlyStats.total * CO2_FACTOR
                });
            } else {
                calculateResults(initialHours, true);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load simulator data');
        } finally {
            setLoading(false);
        }
    };

    const calculateResults = (hoursMap, isInitial = false) => {
        let totalKwh = 0;
        
        devices.forEach(d => {
            const hrs = hoursMap[d._id] || 0;
            const kwhPerDay = (d.powerRating * hrs) / 1000;
            totalKwh += (kwhPerDay * 30); // Monthly projection
        });

        const results = {
            kwh: Math.round(totalKwh * 100) / 100,
            cost: Math.round(totalKwh * RATE * 100) / 100,
            co2: Math.round(totalKwh * CO2_FACTOR * 100) / 100
        };

        if (isInitial && originalMonthly.kwh === 0) {
             setOriginalMonthly(results);
        }
        setNewMonthly(results);
    };

    const handleHourChange = (deviceId, val) => {
        const updated = { ...simulatedHours, [deviceId]: parseFloat(val) };
        setSimulatedHours(updated);
        calculateResults(updated);
    };

    const resetValues = () => {
        const resetHours = {};
        devices.forEach(d => {
            resetHours[d._id] = d.powerRating > 1500 ? 4 : 8;
        });
        setSimulatedHours(resetHours);
        calculateResults(resetHours);
        toast.success('Simulation reset');
    };

    const handleCommitPlan = async () => {
        try {
            await api.post('energy/apply-schedule', { planType: 'Savings Simulator Plan' });
            toast.success('Simulation plan committed! We will monitor your progress.');
            window.dispatchEvent(new Event('refreshNotifications'));
        } catch (error) {
            toast.error('Failed to commit plan');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
    );

    const savings = {
        cost: Math.max(0, originalMonthly.cost - newMonthly.cost),
        kwh: Math.max(0, originalMonthly.kwh - newMonthly.kwh),
        co2: Math.max(0, originalMonthly.co2 - newMonthly.co2)
    };

    const savingsPercent = originalMonthly.cost > 0 ? (savings.cost / originalMonthly.cost) * 100 : 0;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-emerald-950 flex items-center gap-2">
                        <FaPlay className="text-emerald-500 text-sm" />
                        Savings Simulator
                    </h1>
                    <p className="text-sm text-emerald-600 font-medium italic">Adjust your usage patterns to see potential environmental and financial gains.</p>
                </div>
                <button 
                    onClick={resetValues}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors"
                >
                    <FaUndo /> Reset To Baseline
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Proposed Changes Column */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="card p-6 bg-white/80 backdrop-blur-md border-emerald-50 shadow-emerald-100/50">
                        <h3 className="font-black text-emerald-950 mb-6 flex items-center gap-2">
                            <FaBolt className="text-emerald-500" />
                            Proposed Usage Plan
                        </h3>
                        
                        <div className="space-y-8">
                            {devices.length === 0 && <p className="text-sm text-gray-400 italic">No devices found. Add devices to simulate savings.</p>}
                            {devices.map((device, index) => (
                                <motion.div 
                                    key={device._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${device.powerRating > 1000 ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                <FaBolt />
                                            </div>
                                            <div>
                                                <span className="text-sm font-black text-emerald-950">{device.name}</span>
                                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{device.room} • {device.powerRating}W</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-black text-emerald-600">{simulatedHours[device._id] || 0}</span>
                                            <span className="text-[10px] font-bold text-emerald-400 ml-1">hrs/day</span>
                                        </div>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="24" 
                                        step="0.5"
                                        value={simulatedHours[device._id] || 0}
                                        onChange={(e) => handleHourChange(device._id, e.target.value)}
                                        className="w-full h-2 bg-emerald-50 rounded-lg appearance-none cursor-pointer accent-emerald-600 hover:accent-emerald-400"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-6 border-dashed border-emerald-200 bg-emerald-50/20">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                                <FaHistory />
                            </div>
                            <div>
                                <h4 className="font-black text-emerald-950">How it works?</h4>
                                <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                                    We calculate the projected energy cost based on your power ratings and the hours you set. 
                                    Compare this with your "Baseline" (Current Trend) to see your **Green Delta**.
                                </p>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Impact Summary Column */}
                <div className="lg:col-span-4 space-y-6">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-8 rounded-[3rem] bg-emerald-950 text-white shadow-2xl relative overflow-hidden group"
                    >
                        <div className="relative z-10">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">Simulated Savings</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black text-white">${savings.cost.toFixed(2)}</span>
                                <span className="text-sm font-bold text-emerald-400 italic">/month</span>
                            </div>
                            
                            <div className="mt-8 space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                     <div className="flex items-center gap-3">
                                        <FaLeaf className="text-emerald-400" />
                                        <span className="text-xs font-bold">CO₂ Reduced</span>
                                     </div>
                                     <span className="text-sm font-black">{savings.co2.toFixed(1)} kg</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                     <div className="flex items-center gap-3">
                                        <FaBolt className="text-yellow-400" />
                                        <span className="text-xs font-bold">Energy Saved</span>
                                     </div>
                                     <span className="text-sm font-black">{savings.kwh.toFixed(1)} kWh</span>
                                </div>
                            </div>

                            <div className="mt-10">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
                                    <span>Goal Progress</span>
                                    <span>{Math.round(savingsPercent)}% Better</span>
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, savingsPercent)}%` }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-green-300 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                    />
                                </div>
                            </div>
                        </div>
                        <FaLeaf className="absolute -top-10 -right-10 text-[15rem] text-emerald-900/40 rotate-12" />
                    </motion.div>

                    <div className="card p-6 bg-gradient-to-br from-white to-emerald-50">
                        <h4 className="font-black text-emerald-950 mb-4 flex items-center gap-2">
                            <FaCheckCircle className="text-emerald-600" />
                            Eco Certification
                        </h4>
                        <div className="space-y-3">
                            <p className="text-xs text-emerald-700 font-medium">
                                By adhering to this simulated plan, you could improve your Efficiency Score by up to **15 points**!
                            </p>
                            <button 
                                onClick={handleCommitPlan}
                                className="w-full py-4 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transform active:scale-95 transition-all"
                            >
                                Commit to this Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SavingsSimulator;
