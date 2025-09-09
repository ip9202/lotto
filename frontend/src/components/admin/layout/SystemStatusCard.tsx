import React from 'react';

interface SystemStatus {
  database: 'connected' | 'disconnected' | 'error';
  api: 'running' | 'stopped' | 'error';
  scheduler: 'running' | 'stopped' | 'error';
  last_update?: string;
  total_draws?: number;
  latest_draw?: number;
}

interface SystemStatusCardProps {
  status: SystemStatus;
  isLoading?: boolean;
  className?: string;
}

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ 
  status, 
  isLoading = false, 
  className = '' 
}) => {
  const getStatusColor = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'connected':
      case 'running':
        return 'text-green-600 bg-green-100';
      case 'disconnected':
      case 'stopped':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'connected':
        return '연결됨';
      case 'running':
        return '실행중';
      case 'disconnected':
        return '연결끊김';
      case 'stopped':
        return '중지됨';
      case 'error':
        return '오류';
      default:
        return '알 수 없음';
    }
  };

  const StatusBadge: React.FC<{ status: string; label: string }> = ({ status, label }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {getStatusText(status)}
      </span>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">시스템 상태</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">시스템 상태</h3>
      <div className="space-y-4">
        <StatusBadge status={status.database} label="데이터베이스" />
        <StatusBadge status={status.api} label="API 서버" />
        <StatusBadge status={status.scheduler} label="스케줄러" />
        
        {status.last_update && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">마지막 업데이트</span>
              <span className="text-gray-800 font-medium">
                {new Date(status.last_update).toLocaleString('ko-KR')}
              </span>
            </div>
          </div>
        )}
        
        {(status.total_draws || status.latest_draw) && (
          <div className="pt-2 space-y-2">
            {status.total_draws && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">총 데이터 수</span>
                <span className="text-gray-800 font-medium">{status.total_draws.toLocaleString()}개</span>
              </div>
            )}
            {status.latest_draw && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">최신 회차</span>
                <span className="text-gray-800 font-medium">{status.latest_draw}회</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemStatusCard;