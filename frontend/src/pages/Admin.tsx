import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { SessionList, SessionForm, SessionDetailModal } from '../components/SessionManagement';
import { UserSession, SessionCreate, SessionUpdate } from '../types/session';
import { createSession, updateSession } from '../services/sessionService';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { useNavigate } from 'react-router-dom';
import { useMessageHandler } from '../hooks/admin/useMessageHandler';
import MessageAlert from '../components/admin/layout/MessageAlert';
import SystemStatusCard from '../components/admin/layout/SystemStatusCard';
import UpdateProgressCard from '../components/admin/layout/UpdateProgressCard';
import UnifiedSchedulerCard from '../components/admin/layout/UnifiedSchedulerCard';

interface SystemStatus {
  latest_db_draw: number;
  latest_site_draw: number;
  has_new_data: boolean;
  new_draws_count: number;
  scheduler_status: boolean;
}

interface Statistics {
  public_recommendations: {
    total: number;
    ai: number;
    manual: number;
    member: number;
    guest: number;
    recent_7days: number;
  };
  personal_recommendations: {
    total: number;
    recent_7days: number;
  };
  latest_draw: number;
  total_recommendations: number;
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
  const { message, showSuccess, showError, showInfo, clearMessage } = useMessageHandler();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [, setIsUpdating] = useState(false);
  const [, setIsStartingScheduler] = useState(false);
  const [, setIsStoppingScheduler] = useState(false);
  
  // 세션 관리 상태
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'dummy-data'>('dashboard');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [sessionFormMode, setSessionFormMode] = useState<'create' | 'edit'>('create');
  
  // 더미 데이터 생성 상태
  const [drawNumbers, setDrawNumbers] = useState<Array<{
    draw_number: number;
    draw_date: string;
    numbers: number[];
    bonus_number: number;
  }>>([]);
  const [dummyDataForm, setDummyDataForm] = useState({
    draw_number: 0,
    total_count: 0,
    rank_distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);

  // 데이터 변환 유틸리티 함수들
  const convertToSystemStatus = (status: SystemStatus | null) => {
    if (!status) return null;
    return {
      database: 'connected' as const,
      api: 'running' as const,
      scheduler: status.scheduler_status ? 'running' as const : 'stopped' as const,
      total_draws: status.latest_db_draw,
      latest_draw: status.latest_site_draw
    };
  };

  const convertToUpdateProgress = (progress: UpdateProgress | null) => {
    if (!progress) return null;
    return {
      status: progress.current_status.has_new_data ? 'running' as const : 'idle' as const,
      current_step: progress.current_status.has_new_data ? '새로운 데이터 처리 중' : '대기중',
      total_steps: 100,
      completed_steps: progress.progress_percentage,
      processed_data: {
        new_draws: progress.current_status.new_draws_count,
        total_draws: progress.current_status.latest_db_draw,
        latest_draw: progress.current_status.latest_site_draw
      }
    };
  };

  const convertToSchedulerStatus = (scheduler: SchedulerStatus | null) => {
    if (!scheduler) return null;
    return {
      is_running: scheduler.is_running,
      total_jobs: 1, // 실제로는 1개의 스케줄러 작업만 있음
      active_jobs: scheduler.is_running ? 1 : 0,
      failed_jobs: 0,
      next_job: {
        id: 'auto-update',
        name: '자동 데이터 업데이트',
        status: 'scheduled' as const,
        next_run: scheduler.next_run
      },
      recent_jobs: []
    };
  };

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

  // 통계 데이터 조회
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/statistics`);
      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('통계 데이터 조회 실패:', error);
    }
  };

  // 데이터 업데이트 실행
  const handleUpdateData = async () => {
    setIsUpdating(true);
    clearMessage();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/update-latest-data`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        if (data.data.status === 'already_updated') {
          showInfo(data.data.message);
        } else {
          showSuccess(data.data.message);
          
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
                    showSuccess('데이터 업데이트가 완료되었습니다!');
                    
                    // 상태 새로고침
                    fetchSystemStatus();
                    fetchUpdateProgress();
                  }
                }
                
                // 최대 시도 횟수 초과 시 강제 완료
                if (attempts >= maxAttempts) {
                  clearInterval(interval);
                  showInfo('데이터 업데이트가 완료되었습니다.');
                  
                  // 상태 새로고침
                  fetchSystemStatus();
                  fetchUpdateProgress();
                }
              } catch (error) {
                console.error('진행 상황 확인 실패:', error);
              }
            }, 1000); // 1초마다 확인
          };
          
          checkCompletion();
        }
      } else {
        showError('데이터 업데이트 시작에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 스케줄러 시작
  const handleStartScheduler = async () => {
    setIsStartingScheduler(true);
    clearMessage();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/start-scheduler`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        showSuccess('스케줄러가 시작되었습니다!');
        fetchSchedulerStatus();
      } else {
        showError('스케줄러 시작에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsStartingScheduler(false);
    }
  };

  // 스케줄러 중지
  const handleStopScheduler = async () => {
    setIsStoppingScheduler(true);
    clearMessage();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/stop-scheduler`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        showSuccess('스케줄러가 중지되었습니다!');
        fetchSchedulerStatus();
      } else {
        showError('스케줄러 중지에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
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
        showSuccess(`세션이 ${sessionFormMode === 'create' ? '생성' : '수정'}되었습니다!`);
        setShowSessionForm(false);
      } else {
        showError(response.error?.message || `세션 ${sessionFormMode === 'create' ? '생성' : '수정'}에 실패했습니다.`);
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    }
  };

  const handleSessionRefresh = () => {
    // 세션 목록 새로고침 (SessionList 컴포넌트에서 처리)
  };

  // 더미 데이터 생성 관련 함수들
  const fetchDrawNumbers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/draw-numbers`);
      const data = await response.json();
      if (data.success) {
        setDrawNumbers(data.data.draws);
        if (data.data.draws.length > 0 && dummyDataForm.draw_number === 0) {
          setDummyDataForm(prev => ({
            ...prev,
            draw_number: data.data.draws[0].draw_number
          }));
        }
      }
    } catch (error) {
      console.error('회차 목록 조회 실패:', error);
    }
  };

  const handleGenerateDummyData = async () => {
    setIsGenerating(true);
    clearMessage();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/dummy-recommendations/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dummyDataForm),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGenerationResult(data.data);
        showSuccess(data.message);
      } else {
        showError(data.detail || '더미 데이터 생성에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDummyDataFormChange = (field: string, value: any) => {
    setDummyDataForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRankDistributionChange = (rank: number, value: number) => {
    setDummyDataForm(prev => {
      const newRankDistribution = {
        ...prev.rank_distribution,
        [rank]: value
      };
      
      // 등수별 분포의 합계가 총 생성 수를 초과하지 않도록 제한
      const totalDistributed = Object.values(newRankDistribution).reduce((a, b) => (a || 0) + (b || 0), 0);
      if (totalDistributed > prev.total_count) {
        // 총 생성 수를 초과하는 경우, 해당 등수의 값을 조정
        const maxValue = prev.total_count - (totalDistributed - value);
        newRankDistribution[rank] = Math.max(0, maxValue);
      }
      
      return {
        ...prev,
        rank_distribution: newRankDistribution
      };
    });
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchSystemStatus();
    fetchUpdateProgress();
    fetchSchedulerStatus();
    fetchStatistics();
    fetchDrawNumbers();
    
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

  // 관리자 권한 확인
  const isAdmin = user?.role === 'admin';
  
  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트 (로딩 완료 후에만)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
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
                onClick={() => setActiveTab('dummy-data')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'dummy-data'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎲 더미 데이터 생성
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
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
        <MessageAlert message={message} className="mb-6" />

        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 시스템 상태 */}
              <SystemStatusCard 
                status={convertToSystemStatus(systemStatus)!} 
                isLoading={!systemStatus}
              />

              {/* 업데이트 진행 상황 */}
              <UpdateProgressCard 
                progress={convertToUpdateProgress(updateProgress)!} 
                isLoading={!updateProgress}
                onTriggerUpdate={handleUpdateData}
              />
            </div>
            
            {/* 통합 스케줄러 관리 */}
            <div className="mt-8">
              <UnifiedSchedulerCard 
                onTriggerUpdate={handleUpdateData}
              />
            </div>
          </>
        )}

        {/* 더미 데이터 생성 탭 */}
        {activeTab === 'dummy-data' && (
          <div className="space-y-6">
            {/* 더미 데이터 생성 헤더 */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🎲 더미 데이터 생성</h2>
                <p className="text-gray-600">통계 데이터 확보를 위한 더미 추천 데이터 생성</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 더미 데이터 생성 폼 */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">생성 설정</h3>
                
                <div className="space-y-4">
                  {/* 회차 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      회차 선택
                    </label>
                    <select
                      value={dummyDataForm.draw_number}
                      onChange={(e) => handleDummyDataFormChange('draw_number', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>회차를 선택하세요</option>
                      {drawNumbers.map((draw) => (
                        <option key={draw.draw_number} value={draw.draw_number}>
                          {draw.draw_number}회차 ({draw.draw_date})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 총 생성 수 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      총 생성 수
                    </label>
                    <input
                      type="number"
                      value={dummyDataForm.total_count === 0 ? '' : dummyDataForm.total_count}
                      onChange={(e) => handleDummyDataFormChange('total_count', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                      min="0"
                      max="10000"
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 등수별 분포 설정 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      등수별 분포 설정
                    </label>
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((rank) => (
                        <div key={rank} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {rank}등 ({rank === 1 ? '6개 일치' : rank === 2 ? '5개+보너스' : rank === 3 ? '5개 일치' : rank === 4 ? '4개 일치' : '3개 일치'})
                          </span>
                          <input
                            type="number"
                            value={dummyDataForm.rank_distribution[rank] === 0 ? '' : dummyDataForm.rank_distribution[rank]}
                            onChange={(e) => handleRankDistributionChange(rank, e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                            min="0"
                            max={dummyDataForm.total_count || 0}
                            placeholder="0"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      미당첨: {Math.max(0, (dummyDataForm.total_count || 0) - Object.values(dummyDataForm.rank_distribution || {}).reduce((a, b) => (a || 0) + (b || 0), 0))}개
                    </div>
                  </div>

                  {/* 생성 버튼 */}
                  <button
                    onClick={handleGenerateDummyData}
                    disabled={isGenerating || dummyDataForm.draw_number === 0 || dummyDataForm.total_count === 0}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? '생성 중...' : '더미 데이터 생성'}
                  </button>
                </div>
              </div>

              {/* 생성 결과 미리보기 */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">생성 결과</h3>
                
                {generationResult ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-800 font-medium">생성 완료!</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">총 생성 수:</span>
                        <span className="text-sm font-medium">{generationResult.created_count}개</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">생성 기간:</span>
                        <span className="text-sm font-medium">
                          {generationResult.start_date} ~ {generationResult.end_date}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">일별 생성 분포:</h4>
                      <div className="space-y-1">
                        {generationResult.daily_stats && Object.entries(generationResult.daily_stats).map(([date, count]) => (
                          <div key={date} className="flex justify-between text-xs">
                            <span className="text-gray-600">{date}</span>
                            <span className="font-medium">{count || 0}개</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">등수별 분포:</h4>
                      <div className="space-y-1">
                        {generationResult.rank_distribution && Object.entries(generationResult.rank_distribution).map(([rank, count]) => (
                          <div key={rank} className="flex justify-between text-xs">
                            <span className="text-gray-600">{rank}등:</span>
                            <span className="font-medium">{count || 0}개</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">미당첨:</span>
                          <span className="font-medium">{generationResult.no_win_count || 0}개</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">더미 데이터를 생성하면 결과가 여기에 표시됩니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 세션 관리 탭 - 차후 개발 예정 */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* 세션 관리 헤더 */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">👥 세션 관리</h2>
                <p className="text-gray-600">사용자 세션 생성, 수정, 관리</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  차후 개발 예정
                </span>
                <button
                  onClick={handleCreateSession}
                  disabled
                  className="flex items-center px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  새 세션 생성
                </button>
              </div>
            </div>

            {/* 개발 예정 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-blue-800">세션 관리 기능 개발 예정</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>사용자별 개인화된 추천 설정을 관리하는 세션 관리 기능이 개발 예정입니다.</p>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>사용자별 추천 설정 관리</li>
                      <li>세션별 추천 수 제한</li>
                      <li>번호 포함/제외 설정</li>
                      <li>세션 만료 시간 관리</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 세션 목록 - 비활성화 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">세션 목록</h3>
                <p className="mt-1 text-sm text-gray-500">세션 관리 기능이 활성화되면 여기에 세션 목록이 표시됩니다.</p>
              </div>
            </div>
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
