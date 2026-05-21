'use client';

import React from 'react';

interface Props {
  mensaje: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ModalConfirm({ mensaje, onConfirmar, onCancelar }: Props) {
  return (
    <div
      onClick={onCancelar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 340,
          background: 'linear-gradient(145deg, #1E2430, #161A22)',
          border: '1px solid rgba(245, 166, 35, 0.2)',
          borderRadius: 20,
          padding: '32px 24px 24px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(245, 166, 35, 0.08)',
          animation: 'modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Ícono de advertencia */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(243, 156, 18, 0.12)',
          border: '2px solid rgba(243, 156, 18, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F39C12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        {/* Mensaje */}
        <p style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: '#EAEDF2',
          lineHeight: 1.5,
          marginBottom: 28,
          fontFamily: 'Inter, sans-serif',
        }}>
          {mensaje}
        </p>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-ghost"
            onClick={onCancelar}
            style={{ flex: 1, padding: '14px 16px', borderRadius: 12, fontSize: '0.9rem' }}
          >
            Cancelar
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirmar}
            style={{ flex: 1, padding: '14px 16px', borderRadius: 12, fontSize: '0.9rem' }}
          >
            Confirmar
          </button>
        </div>
      </div>

      {/* Animación CSS inline */}
      <style>{`
        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
