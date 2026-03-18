import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaPaperPlane, FaTimes, FaLightbulb } from 'react-icons/fa';
import api from '../services/api';

const AICopilotPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am your EcoTrack Copilot. How can I help you save energy today?' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMsg = { role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await api.post('ai/copilot', { question });
      const aiMsg = { 
        role: 'ai', 
        text: res.data.answer,
        tips: res.data.tips
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary-600 text-white rounded-full shadow-2xl z-50 flex items-center gap-2"
      >
        <FaRobot className="text-2xl" />
        <span className="hidden md:inline font-semibold">Eco Copilot</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 w-[90%] md:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col border border-primary-100 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-primary-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaRobot />
                <span className="font-bold">EcoTrack AI Copilot</span>
              </div>
              <button onClick={() => setIsOpen(false)}><FaTimes /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-primary-600 text-white rounded-tr-none' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                  }`}>
                    {m.text}
                    {m.tips && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 space-y-1">
                        {m.tips.map((tip, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-primary-500 font-medium italic">
                            <FaLightbulb className="flex-shrink-0" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl animate-pulse text-sm">Thinking...</div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleAsk} className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask me anything about energy..."
                  className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AICopilotPanel;
