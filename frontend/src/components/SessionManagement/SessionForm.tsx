import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UserSession, SessionCreate, SessionUpdate } from '../../types/session';

interface SessionFormProps {
  session?: UserSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SessionCreate | SessionUpdate) => void;
  mode: 'create' | 'edit';
}

const SessionForm: React.FC<SessionFormProps> = ({ 
  session, 
  isOpen, 
  onClose, 
  onSubmit, 
  mode 
}) => {
  const [formData, setFormData] = useState<SessionCreate>({
    session_name: '',
    max_recommendations: 10,
    manual_ratio: 30,
    auto_ratio: 70,
    include_numbers: [],
    exclude_numbers: [],
    preferred_numbers: [],
    session_type: 'admin',
    description: '',
    tags: [],
    expires_at: ''
  });

  const [includeNumber, setIncludeNumber] = useState('');
  const [excludeNumber, setExcludeNumber] = useState('');
  const [preferredNumber, setPreferredNumber] = useState('');
  const [newTag, setNewTag] = useState('');

  // 폼 초기화
  useEffect(() => {
    if (session && mode === 'edit') {
      setFormData({
        session_name: session.session_name,
        max_recommendations: session.max_recommendations,
        manual_ratio: session.manual_ratio,
        auto_ratio: session.auto_ratio,
        include_numbers: session.include_numbers || [],
        exclude_numbers: session.exclude_numbers || [],
        preferred_numbers: session.preferred_numbers || [],
        session_type: session.session_type,
        description: session.description || '',
        tags: session.tags || [],
        expires_at: session.expires_at ? new Date(session.expires_at).toISOString().split('T')[0] : ''
      });
    } else {
      // 새 세션 생성 시 기본값
      setFormData({
        session_name: '',
        max_recommendations: 10,
        manual_ratio: 30,
        auto_ratio: 70,
        include_numbers: [],
        exclude_numbers: [],
        preferred_numbers: [],
        session_type: 'admin',
        description: '',
        tags: [],
        expires_at: ''
      });
    }
  }, [session, mode]);

  // 입력 필드 변경 처리
  const handleInputChange = (field: keyof SessionCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 포함 번호 추가
  const addIncludeNumber = () => {
    const num = parseInt(includeNumber);
    if (num >= 1 && num <= 45 && !formData.include_numbers?.includes(num)) {
      handleInputChange('include_numbers', [...(formData.include_numbers || []), num]);
      setIncludeNumber('');
    }
  };

  // 포함 번호 제거
  const removeIncludeNumber = (number: number) => {
    handleInputChange('include_numbers', formData.include_numbers?.filter(n => n !== number) || []);
  };

  // 제외 번호 추가
  const addExcludeNumber = () => {
    const num = parseInt(excludeNumber);
    if (num >= 1 && num <= 45 && !formData.exclude_numbers?.includes(num)) {
      handleInputChange('exclude_numbers', [...(formData.exclude_numbers || []), num]);
      setExcludeNumber('');
    }
  };

  // 제외 번호 제거
  const removeExcludeNumber = (number: number) => {
    handleInputChange('exclude_numbers', formData.exclude_numbers?.filter(n => n !== number) || []);
  };

  // 선호 번호 추가
  const addPreferredNumber = () => {
    const num = parseInt(preferredNumber);
    if (num >= 1 && num <= 45 && !formData.preferred_numbers?.includes(num)) {
      handleInputChange('preferred_numbers', [...(formData.preferred_numbers || []), num]);
      setPreferredNumber('');
    }
  };

  // 선호 번호 제거
  const removePreferredNumber = (number: number) => {
    handleInputChange('preferred_numbers', formData.preferred_numbers?.filter(n => n !== number) || []);
  };

  // 태그 추가
  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      handleInputChange('tags', [...(formData.tags || []), newTag.trim()]);
      setNewTag('');
    }
  };

  // 태그 제거
  const removeTag = (tag: string) => {
    handleInputChange('tags', formData.tags?.filter(t => t !== tag) || []);
  };

  // 비율 자동 조정
  const adjustRatios = (field: 'manual' | 'auto', value: number) => {
    if (field === 'manual') {
      const autoValue = 100 - value;
      handleInputChange('manual_ratio', value);
      handleInputChange('auto_ratio', autoValue);
    } else {
      const manualValue = 100 - value;
      handleInputChange('auto_ratio', value);
      handleInputChange('manual_ratio', manualValue);
    }
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!formData.session_name.trim()) {
      alert('세션 이름을 입력해주세요.');
      return;
    }

    if (formData.manual_ratio + formData.auto_ratio !== 100) {
      alert('수동과 AI 비율의 합이 100%가 되어야 합니다.');
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? '새 세션 생성' : '세션 수정'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                세션 이름 *
              </label>
              <input
                type="text"
                value={formData.session_name}
                onChange={(e) => handleInputChange('session_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="세션 이름을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                세션 타입
              </label>
              <select
                value={formData.session_type}
                onChange={(e) => handleInputChange('session_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="admin">관리자</option>
                <option value="user">사용자</option>
                <option value="test">테스트</option>
              </select>
            </div>
          </div>

          {/* 추천 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 추천 수
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.max_recommendations}
                onChange={(e) => handleInputChange('max_recommendations', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수동 비율 (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.manual_ratio}
                onChange={(e) => adjustRatios('manual', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI 비율 (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.auto_ratio}
                onChange={(e) => adjustRatios('auto', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 번호 설정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">번호 설정</h3>
            
            {/* 포함 번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                포함할 번호
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={includeNumber}
                  onChange={(e) => setIncludeNumber(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1-45"
                />
                <button
                  type="button"
                  onClick={addIncludeNumber}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.include_numbers?.map((number) => (
                  <span
                    key={number}
                    className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {number}
                    <button
                      type="button"
                      onClick={() => removeIncludeNumber(number)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 제외 번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제외할 번호
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={excludeNumber}
                  onChange={(e) => setExcludeNumber(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1-45"
                />
                <button
                  type="button"
                  onClick={addExcludeNumber}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.exclude_numbers?.map((number) => (
                  <span
                    key={number}
                    className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {number}
                    <button
                      type="button"
                      onClick={() => removeExcludeNumber(number)}
                      className="ml-1 text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 선호 번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선호 번호
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={preferredNumber}
                  onChange={(e) => setPreferredNumber(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1-45"
                />
                <button
                  type="button"
                  onClick={addPreferredNumber}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.preferred_numbers?.map((number) => (
                  <span
                    key={number}
                    className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {number}
                    <button
                      type="button"
                      onClick={() => removePreferredNumber(number)}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="태그를 입력하세요"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-gray-600 hover:text-gray-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 추가 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                만료일
              </label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => handleInputChange('expires_at', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="세션에 대한 설명을 입력하세요"
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {mode === 'create' ? '생성' : '수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionForm;
