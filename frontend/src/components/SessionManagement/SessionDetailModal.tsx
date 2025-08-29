import React from 'react';
import { XMarkIcon, ClockIcon, TagIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { UserSession } from '../../types/session';

interface SessionDetailModalProps {
  session: UserSession | null;
  isOpen: boolean;
  onClose: () => void;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ session, isOpen, onClose }) => {
  if (!isOpen || !session) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? '활성' : '비활성'}
      </span>
    );
  };

  const getSessionTypeBadge = (type: string) => {
    const typeConfig = {
      admin: { color: 'bg-purple-100 text-purple-800', label: '관리자' },
      user: { color: 'bg-blue-100 text-blue-800', label: '사용자' },
      test: { color: 'bg-yellow-100 text-yellow-800', label: '테스트' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.admin;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{session.session_name}</h2>
            <p className="text-sm text-gray-600 mt-1">세션 ID: {session.session_id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
                기본 정보
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">상태:</span>
                  {getStatusBadge(session.is_active)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">타입:</span>
                  {getSessionTypeBadge(session.session_type)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">생성자:</span>
                  <span className="font-medium">{session.created_by}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">생성일:</span>
                  <span className="font-medium">{formatDate(session.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">수정일:</span>
                  <span className="font-medium">{formatDate(session.updated_at)}</span>
                </div>
                {session.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">만료일:</span>
                    <span className="font-medium">{formatDate(session.expires_at)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2 text-green-600" />
                추천 설정
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">최대 추천 수:</span>
                  <span className="font-medium">{session.max_recommendations}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">수동 비율:</span>
                  <span className="font-medium">{session.manual_ratio}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI 비율:</span>
                  <span className="font-medium">{session.auto_ratio}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 기록:</span>
                  <span className="font-medium">{session.total_histories}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 추천:</span>
                  <span className="font-medium">{session.total_recommendations}개</span>
                </div>
                {session.days_until_expiry !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">만료까지:</span>
                    <span className={`font-medium ${
                      session.days_until_expiry <= 7 ? 'text-red-600' : 
                      session.days_until_expiry <= 30 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {session.days_until_expiry}일
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 번호 설정 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">번호 설정</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 포함 번호 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">포함할 번호</h4>
                {session.include_numbers && session.include_numbers.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {session.include_numbers.map((number) => (
                      <span
                        key={number}
                        className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {number}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">설정된 번호 없음</p>
                )}
              </div>

              {/* 제외 번호 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">제외할 번호</h4>
                {session.exclude_numbers && session.exclude_numbers.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {session.exclude_numbers.map((number) => (
                      <span
                        key={number}
                        className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                      >
                        {number}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">설정된 번호 없음</p>
                )}
              </div>

              {/* 선호 번호 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">선호 번호</h4>
                {session.preferred_numbers && session.preferred_numbers.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {session.preferred_numbers.map((number) => (
                      <span
                        key={number}
                        className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                      >
                        {number}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">설정된 번호 없음</p>
                )}
              </div>
            </div>
          </div>

          {/* 태그 */}
          {session.tags && session.tags.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TagIcon className="w-5 h-5 mr-2 text-purple-600" />
                태그
              </h3>
              <div className="flex flex-wrap gap-2">
                {session.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 설명 */}
          {session.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">설명</h3>
              <p className="text-gray-700 leading-relaxed">{session.description}</p>
            </div>
          )}

          {/* 통계 차트 (간단한 시각화) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">활동 통계</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{session.total_histories}</div>
                <div className="text-sm text-gray-600">총 기록</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{session.total_recommendations}</div>
                <div className="text-sm text-gray-600">총 추천</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {session.total_histories > 0 
                    ? Math.round(session.total_recommendations / session.total_histories * 10) / 10
                    : 0
                  }
                </div>
                <div className="text-sm text-gray-600">평균 추천/기록</div>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;
