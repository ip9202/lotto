import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NumberFrequencyData {
  number: number;
  frequency: number;
  isHot?: boolean;
  isCold?: boolean;
}

interface NumberFrequencyChartProps {
  data: NumberFrequencyData[];
  title?: string;
  height?: number;
}

const NumberFrequencyChart: React.FC<NumberFrequencyChartProps> = ({
  data,
  title = "번호별 출현 빈도",
  height = 300
}) => {
  // 로또 공 색깔 매핑 (1-10: 노랑, 11-20: 파랑, 21-30: 빨강, 31-40: 검정, 41-45: 초록)
  const getLottoBallColor = (number: number) => {
    if (number <= 10) return '#fbbf24'; // 노랑
    if (number <= 20) return '#3b82f6'; // 파랑
    if (number <= 30) return '#ef4444'; // 빨강
    if (number <= 40) return '#374151'; // 검정
    return '#10b981'; // 초록
  };

  // 데이터를 6개씩 그룹화하여 표시 (모바일 친화적)
  const groupedData = [];
  for (let i = 0; i < data.length; i += 6) {
    const group = data.slice(i, i + 6);
    const groupNumber = Math.floor(i / 6) + 1;
    groupedData.push({
      group: `${groupNumber}구간`,
      numbers: group.map(item => ({
        ...item,
        name: item.number.toString(),
        color: getLottoBallColor(item.number)
      }))
    });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium text-gray-900">번호 {data.number}</p>
          <p className="text-blue-600">
            출현 빈도: <span className="font-bold">{data.frequency}회</span>
          </p>
          {data.isHot && (
            <p className="text-red-500 text-sm">🔥 핫 넘버</p>
          )}
          {data.isCold && (
            <p className="text-blue-500 text-sm">❄️ 콜드 넘버</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {groupedData.map((group, index) => (
          <div key={index}>
            <h4 className="text-sm font-medium text-gray-600 mb-2">{group.group}</h4>
            <ResponsiveContainer width="100%" height={height / groupedData.length}>
              <BarChart data={group.numbers} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  domain={[0, 'dataMax + 20']}
                />
                <Tooltip content={<CustomTooltip />} />
                {group.numbers.map((item, index) => (
                  <Bar
                    key={index}
                    dataKey="frequency"
                    fill={item.color}
                    radius={[2, 2, 0, 0]}
                    stroke={item.isHot ? '#dc2626' : item.isCold ? '#2563eb' : 'none'}
                    strokeWidth={item.isHot || item.isCold ? 2 : 0}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NumberFrequencyChart;
