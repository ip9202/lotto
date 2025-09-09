import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import { Notification, NotificationType } from '../../hooks/common/useNotification';

interface NotificationContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose,
  position = 'top-right'
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const getNotificationStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: CheckCircleIcon,
          iconColor: 'text-green-400'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: XCircleIcon,
          iconColor: 'text-red-400'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: ExclamationTriangleIcon,
          iconColor: 'text-yellow-400'
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: InformationCircleIcon,
          iconColor: 'text-blue-400'
        };
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-md w-full`}>
      {notifications.map((notification) => {
        const styles = getNotificationStyles(notification.type);
        const IconComponent = styles.icon;

        return (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border shadow-lg transform transition-all duration-300 ease-in-out ${styles.container}`}
            role="alert"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <IconComponent className={`w-5 h-5 ${styles.iconColor}`} />
              </div>
              <div className="ml-3 flex-1">
                {notification.title && (
                  <h3 className="text-sm font-medium mb-1">
                    {notification.title}
                  </h3>
                )}
                <p className="text-sm">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => onClose(notification.id)}
                className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationContainer;