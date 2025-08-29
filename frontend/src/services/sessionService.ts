// 세션 관리 API 서비스

import { 
  UserSession, 
  SessionCreate, 
  SessionUpdate, 
  SessionListResponse, 
  SessionResponse,
  SessionStats,
  SessionBulkCreate,
  ApiResponse
} from '../types/session';

const API_BASE_URL = 'http://localhost:8000';

// 공통 API 호출 함수
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: data.message || `HTTP ${response.status} 오류`,
          details: data
        }
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '네트워크 오류가 발생했습니다.',
        details: error
      }
    };
  }
}

// 세션 목록 조회
export async function getSessions(): Promise<ApiResponse<UserSession[]>> {
  const response = await apiCall<SessionListResponse>('/admin/sessions/');
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.sessions
    };
  }
  return response as ApiResponse<UserSession[]>;
}

// 세션 상세 조회
export async function getSession(sessionId: string): Promise<ApiResponse<UserSession>> {
  const response = await apiCall<SessionResponse>(`/admin/sessions/${sessionId}`);
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.session
    };
  }
  return response as ApiResponse<UserSession>;
}

// 세션 생성
export async function createSession(sessionData: SessionCreate): Promise<ApiResponse<UserSession>> {
  const response = await apiCall<SessionResponse>('/admin/sessions/', {
    method: 'POST',
    body: JSON.stringify(sessionData)
  });
  
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.session
    };
  }
  return response as ApiResponse<UserSession>;
}

// 세션 수정
export async function updateSession(
  sessionId: string, 
  sessionData: SessionUpdate
): Promise<ApiResponse<UserSession>> {
  const response = await apiCall<SessionResponse>(`/admin/sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(sessionData)
  });
  
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.session
    };
  }
  return response as ApiResponse<UserSession>;
}

// 세션 삭제
export async function deleteSession(sessionId: string): Promise<ApiResponse<boolean>> {
  const response = await apiCall<{ success: boolean }>(`/admin/sessions/${sessionId}`, {
    method: 'DELETE'
  });
  
  return {
    success: response.success,
    data: response.success
  };
}

// 세션 활성화
export async function activateSession(sessionId: string): Promise<ApiResponse<UserSession>> {
  const response = await apiCall<SessionResponse>(`/admin/sessions/${sessionId}/activate`, {
    method: 'POST'
  });
  
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.session
    };
  }
  return response as ApiResponse<UserSession>;
}

// 세션 비활성화
export async function deactivateSession(sessionId: string): Promise<ApiResponse<UserSession>> {
  const response = await apiCall<SessionResponse>(`/admin/sessions/${sessionId}/deactivate`, {
    method: 'POST'
  });
  
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.session
    };
  }
  return response as ApiResponse<UserSession>;
}

// 세션 만료 시간 연장
export async function extendSessionExpiry(
  sessionId: string, 
  days: number = 30
): Promise<ApiResponse<UserSession>> {
  const response = await apiCall<SessionResponse>(`/admin/sessions/${sessionId}/extend`, {
    method: 'POST',
    body: JSON.stringify({ days })
  });
  
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.session
    };
  }
  return response as ApiResponse<UserSession>;
}

// 세션 통계 조회
export async function getSessionStats(): Promise<ApiResponse<SessionStats>> {
  const response = await apiCall<SessionStats>('/admin/sessions/stats');
  return response;
}

// 일괄 세션 생성
export async function bulkCreateSessions(bulkData: SessionBulkCreate): Promise<ApiResponse<UserSession[]>> {
  const response = await apiCall<{ sessions: UserSession[] }>('/admin/sessions/bulk', {
    method: 'POST',
    body: JSON.stringify(bulkData)
  });
  
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.sessions
    };
  }
  return response as ApiResponse<UserSession[]>;
}

// 만료된 세션 정리
export async function cleanupExpiredSessions(): Promise<ApiResponse<{ deleted_count: number }>> {
  const response = await apiCall<{ deleted_count: number }>('/admin/sessions/cleanup', {
    method: 'POST'
  });
  return response;
}

// 세션 검색
export async function searchSessions(query: string): Promise<ApiResponse<UserSession[]>> {
  const response = await apiCall<SessionListResponse>(`/admin/sessions/search?q=${encodeURIComponent(query)}`);
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.sessions
    };
  }
  return response as ApiResponse<UserSession[]>;
}
