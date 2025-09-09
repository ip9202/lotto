import React from 'react';

interface SchedulerJob {
  id: string;
  name: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  next_run?: string;
  last_run?: string;
  last_result?: 'success' | 'failed';
  error_message?: string;
}

interface SchedulerStatus {
  is_running: boolean;
  total_jobs: number;
  active_jobs: number;
  failed_jobs: number;
  next_job?: SchedulerJob;
  recent_jobs: SchedulerJob[];
}

interface SchedulerStatusCardProps {
  status: SchedulerStatus;
  isLoading?: boolean;
  onStartScheduler?: () => void;
  onStopScheduler?: () => void;
  onTriggerUpdate?: () => void;
  className?: string;
}

const SchedulerStatusCard: React.FC<SchedulerStatusCardProps> = ({ 
  status, 
  isLoading = false,
  onStartScheduler,
  onStopScheduler,
  onTriggerUpdate,
  className = '' 
}) => {
  const getJobStatusColor = (jobStatus: string) => {
    switch (jobStatus) {
      case 'completed':
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'running':
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getJobStatusText = (jobStatus: string) => {
    switch (jobStatus) {
      case 'scheduled':
        return '예약됨';
      case 'running':
        return '실행중';
      case 'completed':
        return '완료';
      case 'failed':
        return '실패';
      case 'success':
        return '성공';
      default:
        return '알 수 없음';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getTimeUntilNext = (nextRun: string) => {
    const now = new Date();
    const next = new Date(nextRun);
    const diff = next.getTime() - now.getTime();
    
    if (diff <= 0) return '곧 실행';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}일 ${hours % 24}시간 후`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes}분 후`;
    } else {
      return `${minutes}분 후`;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">스케줄러 상태</h3>
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
        <h3 className="text-lg font-semibold text-gray-800">스케줄러 상태</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status.is_running ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
          }`}>
            {status.is_running ? '실행중' : '중지됨'}
          </span>
          {status.is_running ? (
            <button
              onClick={onStopScheduler}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              중지
            </button>
          ) : (
            <button
              onClick={onStartScheduler}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              시작
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* 스케줄러 통계 */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{status.total_jobs}</div>
            <div className="text-xs text-gray-600">전체 작업</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{status.active_jobs}</div>
            <div className="text-xs text-gray-600">활성 작업</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{status.failed_jobs}</div>
            <div className="text-xs text-gray-600">실패 작업</div>
          </div>
        </div>

        {/* 다음 실행 작업 */}
        {status.next_job && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">다음 실행 작업</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">{status.next_job.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(status.next_job.status)}`}>
                  {getJobStatusText(status.next_job.status)}
                </span>
              </div>
              {status.next_job.next_run && (
                <div className="flex items-center justify-between text-blue-700">
                  <span>실행 예정</span>
                  <span className="font-medium">
                    {getTimeUntilNext(status.next_job.next_run)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 최근 작업 */}
        {status.recent_jobs && status.recent_jobs.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-3">최근 작업</h4>
            <div className="space-y-2">
              {status.recent_jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{job.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.last_result ? getJobStatusColor(job.last_result) : getJobStatusColor(job.status)
                      }`}>
                        {job.last_result ? getJobStatusText(job.last_result) : getJobStatusText(job.status)}
                      </span>
                    </div>
                    {job.last_run && (
                      <div className="text-xs text-gray-600 mt-1">
                        마지막 실행: {formatDateTime(job.last_run)}
                      </div>
                    )}
                    {job.error_message && (
                      <div className="text-xs text-red-600 mt-1">
                        {job.error_message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 수동 업데이트 버튼 */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onTriggerUpdate}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            수동 업데이트 실행
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulerStatusCard;