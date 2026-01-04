/**
 * Tooltip component for showing keyboard shortcuts
 */
import { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ children, content, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-50 px-3 py-2 text-xs text-text-primary bg-surface-elevated border border-border
            rounded shadow-lg animate-fade-in max-w-xs
            ${position === 'top' && 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'}
            ${position === 'bottom' && 'top-full left-1/2 transform -translate-x-1/2 mt-2'}
            ${position === 'left' && 'right-full top-1/2 transform -translate-y-1/2 mr-2'}
            ${position === 'right' && 'left-full top-1/2 transform -translate-y-1/2 ml-2'}
            ${className}
          `}
        >
          {content}
          {/* Arrow */}
          <div
            className={`
              absolute w-2 h-2 bg-surface-elevated border-l border-b border-border
              ${position === 'top' && 'top-full left-1/2 transform -translate-x-1/2 -mt-1 rotate-45'}
              ${position === 'bottom' && 'bottom-full left-1/2 transform -translate-x-1/2 mb-1 rotate-45'}
              ${position === 'left' && 'left-full top-1/2 transform -translate-y-1/2 -ml-1 rotate-45'}
              ${position === 'right' && 'right-full top-1/2 transform -translate-y-1/2 -mr-1 rotate-45'}
            `}
          />
        </div>
      )}
    </div>
  );
}