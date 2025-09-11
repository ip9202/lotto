import { useState, useCallback } from 'react';

export type MessageType = 'success' | 'error' | 'info';

export interface Message {
  type: MessageType;
  text: string;
}

export const useMessageHandler = () => {
  const [message, setMessage] = useState<Message | null>(null);

  // 메시지 설정 (3초 후 자동 제거)
  const showMessage = useCallback((type: MessageType, text: string) => {
    setMessage({ type, text });
    
    // 3초 후 메시지 자동 제거
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  }, []);

  // 즉시 메시지 제거
  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  // 편의 메서드들
  const showSuccess = useCallback((text: string) => showMessage('success', text), [showMessage]);
  const showError = useCallback((text: string) => showMessage('error', text), [showMessage]);
  const showInfo = useCallback((text: string) => showMessage('info', text), [showMessage]);

  return {
    message,
    showMessage,
    showSuccess,
    showError,
    showInfo,
    clearMessage
  };
};