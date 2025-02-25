'use client';

import { CSSProperties, ReactNode } from 'react';

interface InteractiveLinkProps {
  href: string;
  children: ReactNode;
  style?: CSSProperties;
}

export function InteractiveLink({ href, children, style }: InteractiveLinkProps) {
  return (
    <a
      href={href}
      style={style}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#228be6';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#228be6';
      }}
    >
      {children}
    </a>
  );
}
