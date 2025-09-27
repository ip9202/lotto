import React, { useState, useEffect } from 'react';

interface SchedulerConfig {
  day_of_week: string;
  day_name: string;
  hour: number;
  minute: number;
  is_running: boolean;
  next_run: string;
}

interface UnifiedSchedulerCardProps {
  className?: string;
  onTriggerUpdate?: () => void;
}

const UnifiedSchedulerCard: React.FC<UnifiedSchedulerCardProps> = ({ 
  className = '',
  onTriggerUpdate
}) => {
  const [config, setConfig] = useState<SchedulerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/scheduler-status`);
      const data = await response.json();
      
      if (data.success) {
        // 새 API 응답 구조에 맞게 수정
        const schedulerData = data.data.scheduler_config || data.data;
        setConfig({
          day_of_week: schedulerData.day_of_week || 'sat',
          day_name: schedulerData.day_name || '토요일',
          hour: schedulerData.hour || 21,
          minute: schedulerData.minute || 20,
          is_running: data.data.is_running || false,
          next_run: data.data.next_run_time ? new Date(data.data.next_run_time).toLocaleString('ko-KR') : '알 수 없음'
        });
        setFormData({
          day_of_week: schedulerData.day_of_week || 'sat',
          hour: schedulerData.hour || 21,
          minute: schedulerData.minute || 20
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
  const handleSaveConfig = async () => {
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

  // 스케줄러 시작
  const handleStartScheduler = async () => {
    try {
      setIsStarting(true);
      setMessage(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/start-scheduler`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '스케줄러가 시작되었습니다!' });
        fetchConfig();
      } else {
        setMessage({ type: 'error', text: '스케줄러 시작에 실패했습니다.' });
      }
    } catch (error) {
      console.error('스케줄러 시작 오류:', error);
      setMessage({ type: 'error', text: '스케줄러 시작 중 오류가 발생했습니다.' });
    } finally {
      setIsStarting(false);
    }
  };

  // 스케줄러 중지
  const handleStopScheduler = async () => {
    try {
      setIsStopping(true);
      setMessage(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/stop-scheduler`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '스케줄러가 중지되었습니다!' });
        fetchConfig();
      } else {
        setMessage({ type: 'error', text: '스케줄러 중지에 실패했습니다.' });
      }
    } catch (error) {
      console.error('스케줄러 중지 오류:', error);
      setMessage({ type: 'error', text: '스케줄러 중지 중 오류가 발생했습니다.' });
    } finally {
      setIsStopping(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">스케줄러 관리</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">스케줄러 관리</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            config?.is_running ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
          }`}>
            {config?.is_running ? '실행중' : '중지됨'}
          </span>
          {config?.is_running ? (
            <button
              onClick={handleStopScheduler}
              disabled={isStopping}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isStopping ? '중지 중...' : '중지'}
            </button>
          ) : (
            <button
              onClick={handleStartScheduler}
              disabled={isStarting}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isStarting ? '시작 중...' : '시작'}
            </button>
          )}
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 현재 상태 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">현재 상태</h4>
          
          {config && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">실행 요일:</span>
                <span className="text-sm font-medium">{config.day_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">실행 시간:</span>
                <span className="text-sm font-medium">
                  {(config.hour || 0).toString().padStart(2, '0')}:{(config.minute || 0).toString().padStart(2, '0')}
                </span>
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
          )}

        </div>

        {/* 설정 변경 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">설정 변경</h4>
          
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
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '저장 중...' : '설정 저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSchedulerCard;
