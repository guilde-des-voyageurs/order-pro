'use client';

import React from 'react';

interface ErrorPageInteractiveProps {
  title: string;
  message: string;
  showReset?: boolean;
  onReset?: () => void;
}

export function ErrorPageInteractive({ title, message, showReset, onReset }: ErrorPageInteractiveProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <h1 style={{
        fontSize: '2rem',
        marginBottom: '1rem',
        color: '#343a40'
      }}>
        {title}
      </h1>
      <p style={{
        fontSize: '1.1rem',
        color: '#6c757d',
        marginBottom: '2rem'
      }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {showReset && (
          <button
            onClick={onReset}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              color: '#fff',
              backgroundColor: '#228be6',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1c7ed6';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#228be6';
            }}
          >
            Réessayer
          </button>
        )}
        <a
          href="/"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            color: '#228be6',
            textDecoration: 'none',
            border: '1px solid #228be6',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#228be6';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#228be6';
          }}
        >
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
}
