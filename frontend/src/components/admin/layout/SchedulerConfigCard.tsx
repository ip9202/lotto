import React, { useState, useEffect } from 'react';

interface SchedulerConfig {
  day_of_week: string;
  day_name: string;
  hour: number;
  minute: number;
  is_running: boolean;
  next_run: string;
}

interface SchedulerConfigCardProps {
  className?: string;
}

const SchedulerConfigCard: React.FC<SchedulerConfigCardProps> = ({ className = '' }) => {
  const [config, setConfig] = useState<SchedulerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // 설정 폼 상태
  const [formData, setFormData] = useState({
    day_of_week: 'sun',
    hour: 0,
    minute: 1
  });

  const dayOptions = [
    { value: 'mon', label: '월요일' },
    { value: 'tue', label: '화요일' },
    { value: 'wed', label: '수요일' },
    { value: 'thu', label: '목요일' },
    { value: 'fri', label: '금요일' },
    { value: 'sat', label: '토요일' },
    { value: 'sun', label: '일요일' }
  ];

  // 설정 조회
  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/scheduler-config`);
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.data);
        setFormData({
          day_of_week: data.data.day_of_week,
          hour: data.data.hour,
          minute: data.data.minute
        });
      } else {
        setMessage({ type: 'error', text: data.error?.message || '설정 조회에 실패했습니다.' });
      }
    } catch (error) {
      console.error('설정 조회 오류:', error);
      setMessage({ type: 'error', text: '설정 조회 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 설정 저장
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/scheduler-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.data);
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error?.message || '설정 저장에 실패했습니다.' });
      }
    } catch (error) {
      console.error('설정 저장 오류:', error);
      setMessage({ type: 'error', text: '설정 저장 중 오류가 발생했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">스케줄러 설정</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">스케줄러 설정</h3>
      
      {/* 메시지 표시 */}
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 현재 설정 표시 */}
      {config && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">현재 설정</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">실행 요일:</span>
              <span className="text-sm font-medium">{config.day_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">실행 시간:</span>
                <span className="text-sm font-medium">{config.hour.toString().padStart(2, '0')}:{config.minute.toString().padStart(2, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">다음 실행:</span>
              <span className="text-sm font-medium">{config.next_run}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">상태:</span>
              <span className={`text-sm font-medium ${
                config.is_running ? 'text-green-600' : 'text-red-600'
              }`}>
                {config.is_running ? '실행 중' : '중지됨'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 설정 폼 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            실행 요일
          </label>
          <select
            value={formData.day_of_week}
            onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시간 (0-23)
            </label>
            <input
              type="number"
              min="0"
              max="23"
              value={formData.hour}
              onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              분 (0-59)
            </label>
            <input
              type="number"
              min="0"
              max="59"
              value={formData.minute}
              onChange={(e) => setFormData({ ...formData, minute: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={fetchConfig}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            새로고침
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulerConfigCard;
