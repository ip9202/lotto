import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showSuccess: (message: string, title?: string, options?: Partial<Notification>) => string;
  showError: (message: string, title?: string, options?: Partial<Notification>) => string;
  showInfo: (message: string, title?: string, options?: Partial<Notification>) => string;
  showWarning: (message: string, title?: string, options?: Partial<Notification>) => string;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
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

    console.log('🔔 NotificationContext: 새 알림 추가됨', newNotification);
    setNotifications(prev => {
      console.log('🔔 기존 알림 목록:', prev);
      console.log('🔔 새로운 알림 목록:', [...prev, newNotification]);
      return [...prev, newNotification];
    });

    // 자동 제거
    if (newNotification.autoClose && newNotification.duration) {
      setTimeout(() => {
        console.log('🔔 자동 제거:', id);
        hideNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const hideNotification = useCallback((id: string) => {
    console.log('🔔 알림 제거:', id);
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    console.log('🔔 모든 알림 제거');
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
    console.log('🚨 showError 호출됨:', message);
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

  const value = {
    notifications,
    showNotification,
    hideNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification은 NotificationProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
};

export default NotificationProvider;
