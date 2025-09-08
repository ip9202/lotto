import React, { useState, useEffect } from 'react';
import { 
  ArrowPathIcon, 
  PlayIcon, 
  StopIcon, 
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { SessionList, SessionForm, SessionDetailModal } from '../components/SessionManagement';
import { UserSession, SessionCreate, SessionUpdate } from '../types/session';
import { createSession, updateSession } from '../services/sessionService';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { useNavigate } from 'react-router-dom';

interface SystemStatus {
  latest_db_draw: number;
  latest_site_draw: number;
  has_new_data: boolean;
  new_draws_count: number;
  scheduler_status: boolean;
}

interface UpdateProgress {
  current_status: {
    latest_db_draw: number;
    latest_site_draw: number;
    new_draws_count: number;
    has_new_data: boolean;
  };
  recent_draws: Array<{
    draw_number: number;
    draw_date: string;
    numbers: number[];
    bonus_number: number;
  }>;
  progress_percentage: number;
  last_updated: string;
}

interface SchedulerStatus {
  is_running: boolean;
  next_run: string;
  status: string;
}

const Admin: React.FC = () => {
  const { user, isAuthenticated, logout, isLoading } = useUnifiedAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string>('');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isStartingScheduler, setIsStartingScheduler] = useState(false);
  const [isStoppingScheduler, setIsStoppingScheduler] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // 세션 관리 상태
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions'>('dashboard');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [sessionFormMode, setSessionFormMode] = useState<'create' | 'edit'>('create');

  // 시스템 상태 조회
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/check-latest-data`);
      const data = await response.json();
      if (data.success) {
        setSystemStatus(data.data);
      }
    } catch (error) {
      console.error('시스템 상태 조회 실패:', error);
    }
  };

  // 업데이트 진행 상황 조회
  const fetchUpdateProgress = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/update-progress`);
      const data = await response.json();
      if (data.success) {
        setUpdateProgress(data.data);
      }
    } catch (error) {
      console.error('업데이트 진행 상황 조회 실패:', error);
    }
  };

  // 스케줄러 상태 조회
  const fetchSchedulerStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/scheduler-status`);
      const data = await response.json();
      if (data.success) {
        setSchedulerStatus(data.data);
      }
    } catch (error) {
      console.error('스케줄러 상태 조회 실패:', error);
    }
  };

  // 데이터 업데이트 실행
  const handleUpdateData = async () => {
    setIsUpdating(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/update-latest-data`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        if (data.data.status === 'already_updated') {
          setMessage({ type: 'info', text: data.data.message });
          
          // 3초 후 메시지 자동 제거
          setTimeout(() => {
            setMessage(null);
          }, 3000);
        } else {
          setMessage({ type: 'success', text: data.data.message });
          
          // 백그라운드 작업 완료까지 모니터링
          const checkCompletion = async () => {
            let attempts = 0;
            const maxAttempts = 30; // 최대 30초 대기
            
            const interval = setInterval(async () => {
              attempts++;
              
              try {
                const progressResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/update-progress`);
                const progressData = await progressResponse.json();
                
                if (progressData.success) {
                  // 새로운 데이터가 없어지면 작업 완료
                  if (!progressData.data.current_status.has_new_data) {
                    clearInterval(interval);
                    setMessage({ type: 'success', text: '데이터 업데이트가 완료되었습니다!' });
                    
                    // 상태 새로고침
                    fetchSystemStatus();
                    fetchUpdateProgress();
                    
                    // 3초 후 메시지 제거
                    setTimeout(() => {
                      setMessage(null);
                    }, 3000);
                  }
                }
                
                // 최대 시도 횟수 초과 시 강제 완료
                if (attempts >= maxAttempts) {
                  clearInterval(interval);
                  setMessage({ type: 'info', text: '데이터 업데이트가 완료되었습니다.' });
                  
                  // 상태 새로고침
                  fetchSystemStatus();
                  fetchUpdateProgress();
                  
                  // 3초 후 메시지 제거
                  setTimeout(() => {
                    setMessage(null);
                  }, 3000);
                }
              } catch (error) {
                console.error('진행 상황 확인 실패:', error);
              }
            }, 1000); // 1초마다 확인
          };
          
          checkCompletion();
        }
      } else {
        setMessage({ type: 'error', text: '데이터 업데이트 시작에 실패했습니다.' });
        
        // 3초 후 메시지 자동 제거
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' });
      
      // 3초 후 메시지 자동 제거
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  // 스케줄러 시작
  const handleStartScheduler = async () => {
    setIsStartingScheduler(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/start-scheduler`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '스케줄러가 시작되었습니다!' });
        fetchSchedulerStatus();
        
        // 3초 후 메시지 자동 제거
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: '스케줄러 시작에 실패했습니다.' });
        
        // 3초 후 메시지 자동 제거
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' });
      
      // 3초 후 메시지 자동 제거
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } finally {
      setIsStartingScheduler(false);
    }
  };

  // 스케줄러 중지
  const handleStopScheduler = async () => {
    setIsStoppingScheduler(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/stop-scheduler`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '스케줄러가 중지되었습니다!' });
        fetchSchedulerStatus();
        
        // 3초 후 메시지 자동 제거
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: '스케줄러 중지에 실패했습니다.' });
        
        // 3초 후 메시지 자동 제거
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' });
      
      // 3초 후 메시지 자동 제거
        setTimeout(() => {
          setMessage(null);
        }, 3000);
    } finally {
      setIsStoppingScheduler(false);
    }
  };

  // 세션 관리 함수들
  const handleCreateSession = () => {
    setSessionFormMode('create');
    setSelectedSession(null);
    setShowSessionForm(true);
  };

  const handleEditSession = (session: UserSession) => {
    setSessionFormMode('edit');
    setSelectedSession(session);
    setShowSessionForm(true);
  };

  const handleViewSession = (session: UserSession) => {
    setSelectedSession(session);
    setShowSessionDetail(true);
  };

  const handleSessionFormSubmit = async (data: SessionCreate | SessionUpdate) => {
    try {
      let response;
      
      if (sessionFormMode === 'create') {
        response = await createSession(data as SessionCreate);
      } else {
        response = await updateSession(selectedSession!.session_id, data as SessionUpdate);
      }
      
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: `세션이 ${sessionFormMode === 'create' ? '생성' : '수정'}되었습니다!` 
        });
        setShowSessionForm(false);
        
        // 3초 후 메시지 자동 제거
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        setMessage({ 
          type: 'error', 
          text: response.error?.message || `세션 ${sessionFormMode === 'create' ? '생성' : '수정'}에 실패했습니다.` 
        });
        
        // 3초 후 메시지 자동 제거
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '네트워크 오류가 발생했습니다.' 
      });
      
      // 3초 후 메시지 자동 제거
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
  };

  const handleSessionRefresh = () => {
    // 세션 목록 새로고침 (SessionList 컴포넌트에서 처리)
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchSystemStatus();
    fetchUpdateProgress();
    fetchSchedulerStatus();
    
    // 10초마다 진행 상황 새로고침 (더 자주 업데이트)
    const progressInterval = setInterval(() => {
      fetchUpdateProgress();
    }, 10000);
    
    // 30초마다 전체 상태 새로고침
    const statusInterval = setInterval(() => {
      fetchSystemStatus();
      fetchSchedulerStatus();
    }, 30000);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, []);

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircleIcon className="w-5 h-5 text-green-600" />
    ) : (
      <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
    );
  };

  // 관리자 권한 확인
  const isAdmin = user?.role === 'admin';
  
  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // 로딩 중이거나 로그인하지 않은 경우
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // 관리자가 아닌 경우 접근 거부
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">접근 권한 없음</h2>
          <p className="text-gray-600 mb-6">
            관리자 권한이 필요한 페이지입니다.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            메인페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">🔐 관리자 대시보드</h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">로또 데이터 자동화 시스템 관리</p>
            </div>
            
            {/* 관리자 정보 및 로그아웃 */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  {user?.nickname || user?.email} 관리자
                </p>
                <p className="text-xs text-gray-500">
                  로그인: {user?.last_login_at ? new Date(user.last_login_at).toLocaleString('ko-KR') : ''}
                </p>
              </div>
              <button
                onClick={logout}
                className="flex items-center px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1 sm:mr-2" />
                로그아웃
              </button>
            </div>
          </div>
          
          {/* 탭 네비게이션 */}
          <div className="mt-4 sm:mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 시스템 대시보드
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sessions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 세션 관리
              </button>
            </nav>
          </div>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : message.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' && <CheckCircleIcon className="w-5 h-5 mr-2" />}
              {message.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5 mr-2" />}
              {message.type === 'info' && <InformationCircleIcon className="w-5 h-5 mr-2" />}
              {message.text}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 시스템 상태 */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                  시스템 상태
                </h2>
                
                {systemStatus ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-gray-600">DB 최신 회차:</span>
                      <span className="font-semibold text-base sm:text-lg">{systemStatus.latest_db_draw}회차</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-gray-600">사이트 최신 회차:</span>
                      <span className="font-semibold text-base sm:text-lg">{systemStatus.latest_site_draw}회차</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">새로운 데이터:</span>
                      <span className={`font-semibold ${systemStatus.has_new_data ? 'text-green-600' : 'text-gray-600'}`}>
                        {systemStatus.has_new_data ? `${systemStatus.new_draws_count}개` : '없음'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">스케줄러 상태:</span>
                      <div className="flex items-center">
                        {getStatusIcon(systemStatus.scheduler_status)}
                        <span className={`ml-2 font-semibold ${getStatusColor(systemStatus.scheduler_status)}`}>
                          {systemStatus.scheduler_status ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">로딩 중...</div>
                )}
              </div>

          {/* 실시간 업데이트 진행 상황 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ArrowPathIcon className="w-5 h-5 mr-2 text-purple-600" />
              실시간 진행 상황
            </h2>
            
            {updateProgress ? (
              <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">진행률:</span>
                    <span className="font-semibold text-lg text-purple-600">
                      {updateProgress.progress_percentage}%
                    </span>
                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${updateProgress.progress_percentage}%` }}
                    ></div>
                  </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">DB 최신:</span>
                  <span className="font-semibold">{updateProgress.current_status.latest_db_draw}회차</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">사이트 최신:</span>
                  <span className="font-semibold">{updateProgress.current_status.latest_site_draw}회차</span>
                </div>
                                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">새로운 데이터:</span>
                    <span className={`font-semibold ${updateProgress.current_status.has_new_data ? 'text-green-600' : 'text-gray-600'}`}>
                      {updateProgress.current_status.has_new_data ? `${updateProgress.current_status.new_draws_count}개` : '없음'}
                    </span>
                  </div>
                <div className="text-xs text-gray-500 text-center pt-2 border-t">
                  마지막 업데이트: {updateProgress.last_updated}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">로딩 중...</div>
            )}
          </div>

          {/* 스케줄러 상태 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <PlayIcon className="w-5 h-5 mr-2 text-green-600" />
              스케줄러 상태
            </h2>
            
            {schedulerStatus ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">상태:</span>
                  <div className="flex items-center">
                    {getStatusIcon(schedulerStatus.is_running)}
                    <span className={`ml-2 font-semibold ${getStatusColor(schedulerStatus.is_running)}`}>
                      {schedulerStatus.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">다음 실행:</span>
                  <span className="font-semibold text-blue-600">{schedulerStatus.next_run}</span>
                </div>
                
                {/* 스케줄러 제어 버튼 */}
                <div className="flex space-x-3 pt-4">
                  {schedulerStatus.is_running ? (
                    <button
                      onClick={handleStopScheduler}
                      disabled={isStoppingScheduler}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <StopIcon className="w-4 h-4 mr-2" />
                      {isStoppingScheduler ? '중지 중...' : '스케줄러 중지'}
                    </button>
                  ) : (
                    <button
                      onClick={handleStartScheduler}
                      disabled={isStartingScheduler}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlayIcon className="w-4 h-4 mr-2" />
                      {isStartingScheduler ? '시작 중...' : '스케줄러 시작'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">로딩 중...</div>
            )}
          </div>
        </div>

        {/* 데이터 업데이트 트리거 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <ArrowPathIcon className="w-5 h-5 mr-2 text-purple-600" />
            수동 데이터 업데이트
          </h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">주의사항</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  이 기능은 관리자만 사용할 수 있습니다. 수동 업데이트는 백그라운드에서 실행되며, 
                  새로운 데이터가 있을 때만 처리됩니다.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleUpdateData}
            disabled={isUpdating}
            className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            {isUpdating ? '업데이트 중...' : '최신 데이터 업데이트 실행'}
          </button>
          
          <p className="text-sm text-gray-600 mt-3">
            마지막 업데이트: {new Date().toLocaleString('ko-KR')}
          </p>
        </div>

        {/* 보안 경고 */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-red-800">보안 경고</h3>
              <p className="text-red-700 mt-2">
                이 페이지는 관리자 전용입니다. 현재는 인증 시스템이 구현되지 않았으므로, 
                프로덕션 환경에서는 반드시 관리자 로그인 기능을 구현해야 합니다.
              </p>
              <div className="mt-4 p-3 bg-red-100 rounded border border-red-300">
                <p className="text-sm text-red-800 font-medium">차후 구현 예정:</p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                  <li>관리자 로그인/로그아웃</li>
                  <li>JWT 토큰 기반 인증</li>
                  <li>권한 관리 시스템</li>
                  <li>접근 로그 기록</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {/* 세션 관리 탭 */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* 세션 관리 헤더 */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">👥 세션 관리</h2>
                <p className="text-gray-600">사용자 세션 생성, 수정, 관리</p>
              </div>
              <button
                onClick={handleCreateSession}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                새 세션 생성
              </button>
            </div>

            {/* 세션 목록 */}
            <SessionList
              onEdit={handleEditSession}
              onView={handleViewSession}
              onRefresh={handleSessionRefresh}
            />
          </div>
        )}
      </div>

      {/* 세션 폼 모달 */}
      <SessionForm
        session={selectedSession}
        isOpen={showSessionForm}
        onClose={() => setShowSessionForm(false)}
        onSubmit={handleSessionFormSubmit}
        mode={sessionFormMode}
      />

      {/* 세션 상세 보기 모달 */}
      <SessionDetailModal
        session={selectedSession}
        isOpen={showSessionDetail}
        onClose={() => setShowSessionDetail(false)}
      />
    </div>
  );
};

export default Admin;
