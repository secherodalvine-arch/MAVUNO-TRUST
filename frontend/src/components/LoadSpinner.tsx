import React from 'react';
import './LoadSpinner.css';

interface LoadSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

export const LoadSpinner: React.FC<LoadSpinnerProps> = ({
  size = 'md',
  text,
  fullPage = false,
}) => {
  return (
    <div className={`load-spinner-wrap ${fullPage ? 'load-spinner-fullpage' : ''}`} role="status" aria-live="polite">
      <div className={`load-spinner load-spinner--${size}`} aria-hidden="true" />
      {text && <span className="load-spinner-text">{text}</span>}
      <span className="sr-only">{text ?? 'Loading...'}</span>
    </div>
  );
};

export default LoadSpinner;
