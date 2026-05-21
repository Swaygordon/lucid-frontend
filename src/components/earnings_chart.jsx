import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Eye, EyeOff } from 'lucide-react';

// [API] GET /providers/:id/earnings?period=week|month|year
//   → { data: [{ name: string, earnings: number, jobs: number }], total: number, avg: number }
const weeklyData = [];
const monthlyData = [];
const yearlyData = [];

const EarningsChart = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [chartType, setChartType] = useState('area');
  const [showJobs, setShowJobs] = useState(true);

  const getDataForTimeframe = () => {
    switch(timeframe) {
      case 'week':
        return weeklyData;
      case 'month':
        return monthlyData;
      case 'year':
        return yearlyData;
      default:
        return monthlyData;
    }
  };

  const data = getDataForTimeframe();
  const totalEarnings = data.reduce((sum, item) => sum + item.earnings, 0);
  const totalJobs = data.reduce((sum, item) => sum + item.jobs, 0);
  const avgEarnings = (totalEarnings / data.length).toFixed(0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#1a1f2e] border-2 border-blue-600 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-green-600 font-semibold">
              Earnings: GH₵{payload[0].value.toLocaleString()}
            </p>
            {showJobs && payload[1] && (
              <p className="text-sm text-blue-600 font-semibold">
                Jobs: {payload[1].value}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {['week', 'month', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                timeframe === period
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-[#1a1f2e] text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#252b3b] border-2 border-gray-200 dark:border-[#2d3748]'
              }`}
            >
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>

        {/* Chart Type Selector */}
        <div className="flex gap-2">
          {['area', 'line', 'bar'].map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all capitalize ${
                chartType === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-[#1a1f2e] text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#252b3b] border-2 border-gray-200 dark:border-[#2d3748]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Toggle Jobs Display */}
        <button
          onClick={() => setShowJobs(!showJobs)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1f2e] border-2 border-gray-200 dark:border-[#2d3748] rounded-lg hover:bg-gray-100 dark:hover:bg-[#252b3b] transition-colors"
        >
          {showJobs ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-primary" />}
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
            {showJobs ? 'Hide' : 'Show'} Jobs
          </span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800/50">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">GH₵{totalEarnings.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Total Jobs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{totalJobs}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20 rounded-lg p-4 border-2 border-orange-200 dark:border-orange-800/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-secondary">Avg Per Period</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">GH₵{avgEarnings}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-[#1a1f2e] rounded-lg border-2 border-gray-200 dark:border-[#1e293b] p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">
          Earnings Trend - {timeframe === 'week' ? 'Weekly' : timeframe === 'month' ? 'Monthly' : 'Yearly'}
        </h3>
        
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: '600' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: '600' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorEarnings)"
              />
              {showJobs && (
                <Area
                  type="monotone"
                  dataKey="jobs"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorJobs)"
                />
              )}
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: '600' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: '600' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 5 }}
                activeDot={{ r: 7 }}
              />
              {showJobs && (
                <Line
                  type="monotone"
                  dataKey="jobs"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: '600' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: '600' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="earnings" 
                fill="#2563eb" 
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
              {showJobs && (
                <Bar 
                  dataKey="jobs" 
                  fill="#10b981" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default EarningsChart;