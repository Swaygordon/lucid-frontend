import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const COLOR_MAP = {
  blue: {
    gradient: 'from-blue-500 to-blue-700',
    glow: 'hover:shadow-glow-blue',
    icon: 'bg-white/20',
    badge: 'bg-white/20 text-white',
  },
  green: {
    gradient: 'from-emerald-500 to-green-700',
    glow: 'hover:shadow-glow-green',
    icon: 'bg-white/20',
    badge: 'bg-white/20 text-white',
  },
  orange: {
    gradient: 'from-orange-500 to-amber-600',
    glow: 'hover:shadow-glow-orange',
    icon: 'bg-white/20',
    badge: 'bg-white/20 text-white',
  },
  purple: {
    gradient: 'from-violet-500 to-purple-700',
    glow: 'hover:shadow-glow-purple',
    icon: 'bg-white/20',
    badge: 'bg-white/20 text-white',
  },
  yellow: {
    gradient: 'from-yellow-400 to-amber-500',
    glow: 'hover:shadow-glow-orange',
    icon: 'bg-white/20',
    badge: 'bg-white/20 text-white',
  },
  red: {
    gradient: 'from-red-500 to-rose-700',
    glow: 'hover:shadow-glow-red',
    icon: 'bg-white/20',
    badge: 'bg-white/20 text-white',
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

export const StatCard = ({ icon: Icon, title, value, change, trend, color = 'blue' }) => {
  const config = COLOR_MAP[color] ?? COLOR_MAP.blue;
  const isUp = trend === 'up';

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`
        bg-gradient-to-br ${config.gradient} ${config.glow}
        rounded-2xl p-6 shadow-lg transition-shadow duration-300 relative overflow-hidden
      `}
    >
      {/* Decorative background circle */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute -bottom-6 -right-2 w-16 h-16 bg-white/10 rounded-full" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${config.icon}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${config.badge}`}>
              {isUp
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {change}
            </div>
          )}
        </div>
        <p className="text-white/75 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
};
