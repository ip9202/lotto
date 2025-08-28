import React from 'react';
import { clsx } from 'clsx';

interface LottoBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'bonus' | 'selected' | 'recommended';
  onClick?: () => void;
  className?: string;
}

const LottoBall: React.FC<LottoBallProps> = ({
  number,
  size = 'md',
  variant = 'default',
  onClick,
  className
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg'
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 border-gray-300',
    bonus: 'bg-yellow-100 text-yellow-700 border-yellow-400',
    selected: 'bg-blue-100 text-blue-700 border-blue-400',
    recommended: 'bg-green-100 text-green-700 border-green-400'
  };

  const isClickable = !!onClick;

  return (
    <div
      className={clsx(
        'rounded-full border-2 font-bold flex items-center justify-center transition-all duration-200',
        sizeClasses[size],
        variantClasses[variant],
        isClickable && 'cursor-pointer hover:scale-110 hover:shadow-md',
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
