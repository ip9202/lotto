import React from 'react';

interface MiniLottoBallProps {
  number: number;
  variant?: 'default' | 'bonus' | 'selected' | 'recommended';
  onClick?: () => void;
  className?: string;
}

const MiniLottoBall: React.FC<MiniLottoBallProps> = ({
  number,
  variant = 'default',
  onClick,
  className
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 border-gray-300',
    bonus: 'bg-yellow-100 text-yellow-700 border-yellow-400',
    selected: 'bg-blue-100 text-blue-700 border-blue-400',
    recommended: 'bg-green-100 text-green-700 border-green-400'
  };

  const isClickable = !!onClick;

  return (
    <div
      className={`w-2 h-2 text-xs border rounded-full font-bold flex items-center justify-center transition-all duration-200 ${variantClasses[variant]} ${className || ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      style={{
        width: '6px',
        height: '6px',
        fontSize: '4px',
        minWidth: '6px',
        minHeight: '6px',
        maxWidth: '6px',
        maxHeight: '6px'
      }}
    >
      {number}
    </div>
  );
};

export default MiniLottoBall;
