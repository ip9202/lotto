import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PerformanceData {
  period: string;
  total: number;
  winners: number;
  winRate: number;
}

interface RecommendationPerformanceChartProps {
  data: PerformanceData[];
  title?: string;
  height?: number;
  type?: 'line' | 'bar';
}

const RecommendationPerformanceChart: React.FC<RecommendationPerformanceChartProps> = ({
  data,
  title = "추천 성과 추이",
  height = 300,
  type = 'line'
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>(type);
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
              {entry.dataKey === 'winRate' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" fill="#3b82f6" name="총 추천" radius={[2, 2, 0, 0]} />
          <Bar dataKey="winners" fill="#10b981" name="당첨" radius={[2, 2, 0, 0]} />
        </BarChart>
      );
    }

    return (
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="period" 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#e0e0e0' }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#e0e0e0' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="총 추천"
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="winners" 
          stroke="#10b981" 
          strokeWidth={2}
          name="당첨"
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="winRate" 
          stroke="#f59e0b" 
          strokeWidth={2}
          name="당첨률 (%)"
          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    );
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2">
          <button 
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              chartType === 'line' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setChartType('line')}
          >
            선형
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              chartType === 'bar' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setChartType('bar')}
          >
            막대
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height + 40}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default RecommendationPerformanceChart;
