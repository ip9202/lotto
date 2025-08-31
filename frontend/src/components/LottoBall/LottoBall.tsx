import React from 'react';
import { clsx } from 'clsx';

interface LottoBallProps {
  number: number;
  size?: 'mobile' | 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'bonus' | 'selected' | 'recommended' | 'winning';
  onClick?: () => void;
  className?: string;
}

// 로또 공 색깔 매핑 함수
const getLottoBallColor = (number: number) => {
  if (number >= 1 && number <= 10) {
    return 'yellow'; // 노란색
  } else if (number >= 11 && number <= 20) {
    return 'blue'; // 파란색
  } else if (number >= 21 && number <= 30) {
    return 'red'; // 빨간색
  } else if (number >= 31 && number <= 40) {
    return 'gray'; // 회색
  } else if (number >= 41 && number <= 45) {
    return 'green'; // 초록색
  }
  return 'gray'; // 기본값
};

const LottoBall: React.FC<LottoBallProps> = ({
  number,
  size = 'md',
  variant = 'default',
  onClick,
  className
}) => {
  const sizeClasses = {
    mobile: 'w-8 h-8 text-sm sm:w-10 sm:h-10 sm:text-base',
    xs: 'w-8 h-8 text-sm sm:w-10 sm:h-10 sm:text-base',
    sm: 'w-8 h-8 text-sm sm:w-10 sm:h-10 sm:text-base',
    md: 'w-10 h-10 text-base sm:w-12 sm:h-12 sm:text-lg',
    lg: 'w-12 h-12 text-lg sm:w-16 sm:h-16 sm:text-xl'
  };

  // 로또 공 색깔별 스타일
  const getLottoBallStyle = (number: number, variant: string) => {
    const color = getLottoBallColor(number);
    
    if (variant === 'selected') {
      // 선택된 경우: 진한 색 + 테두리
      const selectedStyles = {
        yellow: 'bg-gradient-to-br from-yellow-300 to-yellow-400 text-yellow-900 border-yellow-500 shadow-lg ring-2 ring-yellow-300 ring-offset-2',
        blue: 'bg-gradient-to-br from-blue-300 to-blue-400 text-blue-900 border-blue-500 shadow-lg ring-2 ring-blue-300 ring-offset-2',
        red: 'bg-gradient-to-br from-red-300 to-red-400 text-red-900 border-red-500 shadow-lg ring-2 ring-red-300 ring-offset-2',
        gray: 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900 border-gray-500 shadow-lg ring-2 ring-gray-300 ring-offset-2',
        green: 'bg-gradient-to-br from-green-300 to-green-400 text-green-900 border-green-500 shadow-lg ring-2 ring-green-300 ring-offset-2'
      };
      return selectedStyles[color as keyof typeof selectedStyles];
    } else if (variant === 'winning' || variant === 'bonus') {
      // 당첨번호인 경우: 화려하고 선명한 색
      const winningStyles = {
        yellow: 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white border-yellow-600 shadow-lg',
        blue: 'bg-gradient-to-br from-blue-400 to-blue-500 text-white border-blue-600 shadow-lg',
        red: 'bg-gradient-to-br from-red-400 to-red-500 text-white border-red-600 shadow-lg',
        gray: 'bg-gradient-to-br from-gray-400 to-gray-500 text-white border-gray-600 shadow-lg',
        green: 'bg-gradient-to-br from-green-400 to-green-500 text-white border-green-600 shadow-lg'
      };
      return winningStyles[color as keyof typeof winningStyles];
    } else {
      // 선택되지 않은 경우: 흐린 색
      const defaultStyles = {
        yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200 shadow-sm',
        blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm',
        red: 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200 shadow-sm',
        gray: 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 border-gray-200 shadow-sm',
        green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200 shadow-sm'
      };
      return defaultStyles[color as keyof typeof defaultStyles];
    }
  };

  const isClickable = !!onClick;

  return (
    <div
      className={clsx(
        'rounded-full border-2 font-bold flex items-center justify-center transition-all duration-200',
        sizeClasses[size],
        // 로또 공 색깔별 스타일 적용
        getLottoBallStyle(number, variant),
        isClickable && 'cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {number}
    </div>
  );
};

export default LottoBall;
