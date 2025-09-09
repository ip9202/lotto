import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  PlayIcon, 
  StopIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { UserSession } from '../../types/session';
import { 
  getSessions, 
  deleteSession, 
  activateSession, 
  deactivateSession,
  cleanupExpiredSessions
} from '../../services/sessionService';

interface SessionListProps {
  onEdit: (session: UserSession) => void;
  onView: (session: UserSession) => void;
  onRefresh: () => void;
}

const SessionList: React.FC<SessionListProps> = ({ onEdit, onView, onRefresh }) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'recommendations'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 세션 목록 로드
  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await getSessions();
      if (response.success && response.data) {
        setSessions(response.data);
        setFilteredSessions(response.data);
      }
    } catch (error) {
      console.error('세션 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터링
  useEffect(() => {
    let filtered = sessions;

    // 상태 필터링
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => 
        statusFilter === 'active' ? session.is_active : !session.is_active
      );
    }

    // 검색어 필터링
    if (searchQuery.trim()) {
      filtered = filtered.filter(session =>
        session.session_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.session_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.session_name.toLowerCase();
          bValue = b.session_name.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'updated':
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
        case 'recommendations':
          aValue = a.total_recommendations;
          bValue = b.total_recommendations;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredSessions(filtered);
  }, [sessions, searchQuery, statusFilter, sortBy, sortOrder]);

  // 세션 삭제
  const handleDelete = async (sessionId: string) => {
    if (!window.confirm('정말로 이 세션을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await deleteSession(sessionId);
      if (response.success) {
        await loadSessions();
        onRefresh();
      }
    } catch (error) {
      console.error('세션 삭제 실패:', error);
    }
  };

  // 세션 활성화/비활성화
  const handleToggleStatus = async (session: UserSession) => {
    try {
      if (session.is_active) {
        await deactivateSession(session.session_id);
      } else {
        await activateSession(session.session_id);
      }
      await loadSessions();
      onRefresh();
    } catch (error) {
      console.error('세션 상태 변경 실패:', error);
    }
  };

  // 만료된 세션 정리
  const handleCleanup = async () => {
    if (!window.confirm('만료된 세션들을 정리하시겠습니까?')) {
      return;
    }

    try {
      const response = await cleanupExpiredSessions();
      if (response.success) {
        await loadSessions();
        onRefresh();
      }
    } catch (error) {
      console.error('세션 정리 실패:', error);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadSessions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* 헤더 및 컨트롤 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">세션 관리</h3>
            <p className="text-sm text-gray-600">
              총 {sessions.length}개 세션, 활성 {sessions.filter(s => s.is_active).length}개
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleCleanup}
              className="px-3 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
            >
              만료 세션 정리
            </button>
            <button
              onClick={loadSessions}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
            >
              새로고침
            </button>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 검색 */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="세션 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 상태 필터 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">모든 상태</option>
            <option value="active">활성만</option>
            <option value="inactive">비활성만</option>
          </select>

          {/* 정렬 */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created-desc">생성일 최신순</option>
            <option value="created-asc">생성일 오래된순</option>
            <option value="updated-desc">수정일 최신순</option>
            <option value="updated-asc">수정일 오래된순</option>
            <option value="name-asc">이름순</option>
            <option value="recommendations-desc">추천수 많은순</option>
          </select>
        </div>
      </div>

      {/* 세션 목록 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                세션 정보
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                설정
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                통계
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                {/* 세션 정보 */}
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {session.session_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {session.session_id}
                    </div>
                    {session.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {session.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      생성: {new Date(session.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </td>

                {/* 설정 */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div>최대 추천: {session.max_recommendations}개</div>
                    <div>수동: {session.manual_ratio}% / AI: {session.auto_ratio}%</div>
                    {session.include_numbers && session.include_numbers.length > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        포함: {session.include_numbers.join(', ')}
                      </div>
                    )}
                    {session.exclude_numbers && session.exclude_numbers.length > 0 && (
                      <div className="text-xs text-red-600 mt-1">
                        제외: {session.exclude_numbers.join(', ')}
                      </div>
                    )}
                  </div>
                </td>

                {/* 통계 */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div>기록: {session.total_histories}개</div>
                    <div>총 추천: {session.total_recommendations}개</div>
                    {session.days_until_expiry !== null && (
                      <div className="text-xs text-orange-600 mt-1">
                        만료까지: {session.days_until_expiry}일
                      </div>
                    )}
                  </div>
                </td>

                {/* 상태 */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {session.is_active ? '활성' : '비활성'}
                    </span>
                    {session.expires_at && (
                      <ClockIcon className="h-4 w-4 text-gray-400" title={`만료: ${new Date(session.expires_at).toLocaleDateString('ko-KR')}`} />
                    )}
                  </div>
                </td>

                {/* 작업 */}
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(session)}
                      className="text-blue-600 hover:text-blue-900"
                      title="상세 보기"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(session)}
                      className="text-green-600 hover:text-green-900"
                      title="수정"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(session)}
                      className={`${
                        session.is_active 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                      title={session.is_active ? '비활성화' : '활성화'}
                    >
                      {session.is_active ? <StopIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(session.session_id)}
                      className="text-red-600 hover:text-red-900"
                      title="삭제"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 빈 상태 */}
      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {searchQuery || statusFilter !== 'all' ? '검색 결과가 없습니다.' : '세션이 없습니다.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionList;
