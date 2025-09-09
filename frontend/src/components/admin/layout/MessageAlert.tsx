import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { Message } from '../../../hooks/admin/useMessageHandler';

interface MessageAlertProps {
  message: Message | null;
  className?: string;
}

const MessageAlert: React.FC<MessageAlertProps> = ({ message, className = '' }) => {
  if (!message) return null;

  const getAlertStyles = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 mr-2" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 mr-2" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getAlertStyles()} ${className}`}>
      <div className="flex items-center">
        {getIcon()}
        {message.text}
      </div>
    </div>
  );
};

export default MessageAlert;