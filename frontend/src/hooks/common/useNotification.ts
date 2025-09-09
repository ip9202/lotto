import { useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
}

/**
 * 알림 관리를 위한 공통 훅
 * alert() 대신 사용하여 일관된 사용자 경험 제공
 * 
 * @example
 * const { notifications, showNotification, hideNotification, showSuccess, showError } = useNotification();
 * 
 * // 성공 알림
 * showSuccess('저장되었습니다!');
 * 
 * // 에러 알림
 * showError('저장에 실패했습니다.');
 * 
 * // 사용자 정의 알림
 * showNotification({
 *   type: 'info',
 *   title: '알림',
 *   message: '새로운 데이터가 있습니다.',
 *   duration: 5000
 * });
 */
export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      autoClose: true,
      duration: 3000,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // 자동 제거
    if (newNotification.autoClose && newNotification.duration) {
      setTimeout(() => {
        hideNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 편의 메서드들
  const showSuccess = useCallback((message: string, title?: string, options?: Partial<Notification>) => {
    return showNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  }, [showNotification]);

  const showError = useCallback((message: string, title?: string, options?: Partial<Notification>) => {
    return showNotification({
      type: 'error',
      title,
      message,
      duration: 5000, // 에러는 조금 더 오래 표시
      ...options
    });
  }, [showNotification]);

  const showInfo = useCallback((message: string, title?: string, options?: Partial<Notification>) => {
    return showNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  }, [showNotification]);

  const showWarning = useCallback((message: string, title?: string, options?: Partial<Notification>) => {
    return showNotification({
      type: 'warning',
      title,
      message,
      ...options
    });
  }, [showNotification]);

  return {
    notifications,
    showNotification,
    hideNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
};

export default useNotification;