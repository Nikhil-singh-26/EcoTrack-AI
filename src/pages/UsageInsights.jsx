import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaClock, FaBolt, FaChevronLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        // Filter out zero values
        const activeUsage = payload.filter(p => p.value > 0);
        
        if (activeUsage.length === 0) return null;

        return (
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-emerald-50">
                <p className="text-xs font-black text-emerald-950 mb-2 border-b border-emerald-50 pb-1 flex items-center gap-2">
                    <FaClock className="text-emerald-500" /> {label}
                </p>
                <div className="space-y-1.5">
                    {activeUsage.map((p, index) => (
                        <div key={index} className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
                                <span className="text-[10px] font-bold text-gray-600">{p.name}:</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-600">{p.value.toFixed(2)} kWh</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-emerald-50 flex justify-between">
                        <span className="text-[10px] font-black text-emerald-950 uppercase">Total:</span>
                        <span className="text-[10px] font-black text-emerald-600">
                            {activeUsage.reduce((sum, p) => sum + p.value, 0).toFixed(2)} kWh
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const UsageInsights = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsageData();
    }, []);

    const fetchUsageData = async () => {
        try {
            const res = await api.get('energy/usage-by-device');
            setData(res.data.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load usage insights');
        } finally {
            setLoading(false);
        }
    };

    // Extract unique device names for the Legend/Bars
    const deviceNames = data.length > 0 
        ? Object.keys(data[0]).filter(key => key !== 'time') 
        : [];

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20 p-4 md:p-0">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 bg-white rounded-xl shadow-sm hover:bg-emerald-50 text-emerald-600 transition-colors"
                >
                    <FaChevronLeft />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-emerald-950">Usage Deep-Dive</h1>
                    <p className="text-sm text-emerald-600 font-medium">Clear breakdown of active device behavior</p>
                </div>
            </div>

            {/* Chart Area */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-8 bg-white/90 backdrop-blur-md"
            >
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                            <FaBolt className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-black text-emerald-950">Active Device Correlation</h3>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Hover bar to see active contributors</p>
                        </div>
                    </div>
                </div>

                <div className="h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barGap={0}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="time" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fill: '#64748b', fontWeight: 900}}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fill: '#64748b', fontWeight: 900}}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                            <Legend 
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}
                            />
                            {deviceNames.map((name, index) => (
                                <Bar 
                                    key={name}
                                    dataKey={name} 
                                    stackId="a" 
                                    fill={colors[index % colors.length]} 
                                    radius={0}
                                    barSize={40}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Info Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 bg-gradient-to-br from-emerald-600 to-emerald-500 text-white border-none shadow-xl shadow-emerald-100">
                    <h4 className="font-black mb-2">Real-Time Verification</h4>
                    <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                        This data is aggregated directly from your MongoDB `EnergyReadings` collection. 
                        Each stack represents the raw consumption reported by individual device sensors within that hour.
                    </p>
                </div>
                <div className="card p-6 border-dashed border-emerald-200 bg-emerald-50/50">
                    <h4 className="font-black text-emerald-950 mb-2 flex items-center gap-2">
                        <FaBolt className="text-emerald-500" />
                        Peak Usage Analytics
                    </h4>
                    <p className="text-xs text-emerald-700 font-medium">
                        Analyze which device is contributing most to your peaks. Switch off heavy devices during hours with the tallest stacks.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UsageInsights;
