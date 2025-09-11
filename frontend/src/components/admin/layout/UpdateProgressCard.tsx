import React from 'react';

interface UpdateProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  current_step: string;
  total_steps: number;
  completed_steps: number;
  start_time?: string;
  end_time?: string;
  error_message?: string;
  processed_data?: {
    new_draws: number;
    total_draws: number;
    latest_draw: number;
  };
}

interface UpdateProgressCardProps {
  progress: UpdateProgress;
  isLoading?: boolean;
  onTriggerUpdate?: () => void;
  className?: string;
}

const UpdateProgressCard: React.FC<UpdateProgressCardProps> = ({ 
  progress, 
  isLoading = false, 
  onTriggerUpdate,
  className = '' 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'idle':
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'running':
        return '진행중';
      case 'error':
        return '오류';
      case 'idle':
      default:
        return '대기중';
    }
  };

  const getProgressPercentage = () => {
    if (progress.total_steps === 0) return 0;
    return Math.round((progress.completed_steps / progress.total_steps) * 100);
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration}초`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}분 ${duration % 60}초`;
    } else {
      return `${Math.floor(duration / 3600)}시간 ${Math.floor((duration % 3600) / 60)}분`;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">업데이트 진행상황</h3>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">업데이트 진행상황</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(progress.status)}`}>
          {getStatusText(progress.status)}
        </span>
      </div>

      <div className="space-y-4">
        {/* 진행률 바 */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">진행률</span>
            <span className="text-gray-800 font-medium">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progress.status === 'error' ? 'bg-red-500' : 
                progress.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>{progress.completed_steps} / {progress.total_steps} 단계</span>
          </div>
        </div>

        {/* 현재 단계 */}
        {progress.current_step && (
          <div>
            <span className="text-sm text-gray-600">현재 단계</span>
            <p className="text-gray-800 font-medium">{progress.current_step}</p>
          </div>
        )}

        {/* 소요 시간 */}
        {progress.start_time && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">소요 시간</span>
            <span className="text-gray-800 font-medium">
              {formatDuration(progress.start_time, progress.end_time)}
            </span>
          </div>
        )}

        {/* 오류 메시지 */}
        {progress.status === 'error' && progress.error_message && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{progress.error_message}</p>
          </div>
        )}

        {/* 처리된 데이터 정보 */}
        {progress.processed_data && progress.status === 'completed' && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-800 mb-2">처리 결과</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">신규 데이터</span>
                <span className="text-green-600 font-medium">+{progress.processed_data.new_draws}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">전체 데이터</span>
                <span className="text-gray-800 font-medium">{progress.processed_data.total_draws.toLocaleString()}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">최신 회차</span>
                <span className="text-gray-800 font-medium">{progress.processed_data.latest_draw}회</span>
              </div>
            </div>
          </div>
        )}

        {/* 수동 업데이트 버튼 */}
        {onTriggerUpdate && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onTriggerUpdate}
              disabled={progress.status === 'running'}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {progress.status === 'running' ? '업데이트 진행 중...' : '지금 데이터 업데이트'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateProgressCard;