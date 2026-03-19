import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaLeaf, FaTree, FaCar, FaChevronLeft, FaChevronRight, FaLightbulb, FaChartArea } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('energy/carbon-analytics');
            setData(res.data.data);
        } catch (error) {
            console.error(error);
            setData({
                totalCarbon: 5.6,
                totalConsumption: 6.8,
                treesRequired: 1,
                drivingKm: 12.5,
                chartData: [],
                emissionFactor: 0.82,
                aiInsight: "Analyzing your pattern... reducing AC usage between 2 PM - 5 PM could lower your weekly carbon output by 12kg CO2."
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApplySchedule = async () => {
        try {
            await api.post('energy/apply-schedule', { planType: 'Carbon Optimization' });
            toast.success('Smart Schedule applied! Check your alerts.');
            window.dispatchEvent(new Event('refreshNotifications'));
        } catch (error) {
            toast.error('Failed to apply schedule');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 p-4 md:p-0">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-emerald-950">Carbon Analytics</h1>
                <p className="text-sm text-emerald-600 font-medium">AI-powered tracking & environmental impact</p>
            </div>

            {/* Impact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-[2rem] bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-xl shadow-emerald-200 relative overflow-hidden group"
                >
                    <div className="relative z-10">
                        <p className="text-sm font-bold opacity-80">Total Footprint</p>
                        <div className="flex items-baseline gap-2 mt-4">
                            <span className="text-5xl font-black">{data?.totalCarbon || '0.00'}</span>
                            <span className="text-xl font-bold opacity-90 text-emerald-100">kg CO₂</span>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full">
                            <FaLeaf className="animate-pulse" />
                            <span>AI analyzing historic trends...</span>
                        </div>
                    </div>
                    <FaLeaf className="absolute -bottom-6 -right-6 text-9xl opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-6 flex flex-col justify-between"
                >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl">
                        <FaTree />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Trees Required</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-4xl font-black text-emerald-950">{data?.treesRequired || '0'}</span>
                            <span className="text-sm font-bold text-emerald-600">trees</span>
                        </div>
                        <p className="text-[10px] text-emerald-300 font-bold mt-2 italic">To offset your tracking period</p>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-6 flex flex-col justify-between relative group"
                >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl group-hover:scale-110 transition-transform">
                        <FaCar />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Driving Equivalent</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-4xl font-black text-emerald-950">{data?.drivingKm || '0.0'}</span>
                            <span className="text-sm font-bold text-emerald-600">km</span>
                        </div>
                        <p className="text-[10px] text-emerald-300 font-bold mt-2 italic">In average gasoline car emissions</p>
                    </div>
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaChevronRight />
                    </button>
                </motion.div>
            </div>

            {/* Chart & Insights Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <h3 className="font-black text-emerald-950 tracking-tight">Emissions Over Time</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-lg">
                            <span className="text-[10px] font-black text-emerald-600">Last 7 Days</span>
                            <FaChevronLeft className="text-[8px] text-emerald-300" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.chartData || []}>
                                <defs>
                                    <linearGradient id="colorEmission" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#10b981', fontWeight: 900}} />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#059669', fontSize: '12px', fontWeight: 900 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="emission" 
                                    stroke="#10b981" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorEmission)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        {(!data?.chartData || data?.chartData?.length === 0) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                                <p className="text-xs font-bold text-emerald-300 italic uppercase tracking-tighter">No carbon data tracked yet.</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 text-center md:text-left">
                        <p className="text-[10px] font-black italic text-emerald-300 uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-full">
                            *Based on average India emission factor of {data?.emissionFactor || '0.82'}kg CO₂/kWh
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card p-6 bg-emerald-50/50 border-emerald-100 flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <FaLightbulb className="text-emerald-500 text-xl" />
                            <h4 className="font-black text-emerald-950 tracking-tight">AI Intelligence</h4>
                        </div>
                        <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                            {data?.aiInsight}
                        </p>
                        <button 
                            onClick={handleApplySchedule}
                            className="mt-2 w-full py-3 bg-emerald-600 text-white text-xs font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 uppercase tracking-widest"
                        >
                            Apply Smart Schedule
                        </button>
                    </div>

                    <div className="card p-6 bg-yellow-50/50 border-yellow-100 border-dashed">
                        <p className="text-[10px] font-black text-yellow-600 uppercase tracking-tighter mb-2">Upcoming Feature</p>
                        <h4 className="font-black text-emerald-950 tracking-tight flex items-center gap-2">
                             Savings Simulator
                        </h4>
                        <p className="text-xs text-yellow-700 mt-2 font-medium leading-relaxed italic">
                            Simulate how adding solar panels or smart plugs will reduce your future carbon debt.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
