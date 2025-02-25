'use client';

import { CSSProperties, ReactNode } from 'react';

interface InteractiveButtonProps {
  onClick: () => void;
  children: ReactNode;
  style?: CSSProperties;
}

export function InteractiveButton({ onClick, children, style }: InteractiveButtonProps) {
  return (
    <button
      onClick={onClick}
      style={style}
      onMouseOver={(e) => {
        if (e.currentTarget.style.backgroundColor === '#228be6') {
          e.currentTarget.style.backgroundColor = '#1c7ed6';
        }
      }}
      onMouseOut={(e) => {
        if (e.currentTarget.style.backgroundColor === '#1c7ed6') {
          e.currentTarget.style.backgroundColor = '#228be6';
        }
      }}
    >
      {children}
    </button>
  );
}
