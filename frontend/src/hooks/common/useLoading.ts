import { useState, useCallback } from 'react';

/**
 * 로딩 상태 관리를 위한 공통 훅
 * 
 * @example
 * const { isLoading, startLoading, stopLoading, withLoading } = useLoading();
 * 
 * // 수동 제어
 * startLoading();
 * await someAsyncOperation();
 * stopLoading();
 * 
 * // 자동 제어
 * await withLoading(async () => {
 *   await someAsyncOperation();
 * });
 */
export const useLoading = (initialState: boolean = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    startLoading();
    try {
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    setIsLoading
  };
};

export default useLoading;