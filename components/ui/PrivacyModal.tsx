'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PrivacyModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ open, onClose }: PrivacyModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="privacy-modal show"
      onClick={onClose}
      style={{
        display: 'flex',
        position: 'fixed',
        zIndex: 50000,
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(10px)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '50px 40px',
          borderRadius: '20px',
          maxWidth: '700px',
          width: '90%',
          position: 'relative',
          textAlign: 'center',
          wordBreak: 'keep-all',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '25px',
            fontSize: '32px',
            color: '#9ca3af',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#d4af37')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
        >
          ×
        </button>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '2em',
            marginBottom: '25px',
            background: 'linear-gradient(-45deg, #d4af37, #ffd700, #b8860b)',
            backgroundSize: '300% 300%',
            animation: 'modalGradientFlow 4s ease-in-out infinite',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            wordBreak: 'keep-all',
          }}
        >
          개인정보처리방침
        </h1>

        <div
          style={{
            textAlign: 'left',
            color: '#4a4a4a',
            lineHeight: '1.8',
            maxHeight: '60vh',
            overflowY: 'auto',
            padding: '20px',
          }}
        >
          <h3 style={{ color: '#2c3e50', fontSize: '1.1em' }}>1. 개인정보의 처리 목적</h3>
          <p style={{ marginBottom: '15px' }}>
            BAAL(이하 "회사")은 사용자가 브라우저에서 직접 파일을 처리하는 무료 온라인 도구를 제공합니다. 회사는{' '}
            <strong style={{ color: '#2c3e50', fontWeight: 700 }}>어떠한 개인정보도 수집하지 않습니다.</strong>
          </p>

          <h3 style={{ color: '#2c3e50', marginTop: '20px', fontSize: '1.1em' }}>2. 처리하는 개인정보 항목</h3>
          <p style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#2c3e50', fontWeight: 700 }}>없음</strong> - 모든 파일 처리는 사용자의 브라우저
            내에서만 이루어지며, 서버로 전송되지 않습니다.
          </p>

          <h3 style={{ color: '#2c3e50', marginTop: '20px', fontSize: '1.1em' }}>3. 개인정보의 처리 및 보유기간</h3>
          <p style={{ marginBottom: '15px' }}>회사는 개인정보를 수집하지 않으므로 보유하지 않습니다.</p>

          <h3 style={{ color: '#2c3e50', marginTop: '20px', fontSize: '1.1em' }}>4. 쿠키(Cookie) 사용</h3>
          <p style={{ marginBottom: '15px' }}>
            본 웹사이트는 Google AdSense 광고 서비스를 사용합니다. Google은 사용자의 관심사에 맞는 광고를 제공하기
            위해 쿠키를 사용할 수 있습니다.
          </p>
          <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
            <li>
              Google의 광고 쿠키 정책:{' '}
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 600 }}
              >
                링크
              </a>
            </li>
            <li>쿠키 설정은 브라우저에서 관리하실 수 있습니다.</li>
          </ul>

          <h3 style={{ color: '#2c3e50', marginTop: '20px', fontSize: '1.1em' }}>5. 개인정보 보호책임자</h3>
          <p style={{ marginBottom: '15px' }}>
            이메일:{' '}
            <a
              href="mailto:summon@baal.co.kr"
              style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 600 }}
            >
              summon@baal.co.kr
            </a>
            <br />
            사용자는 회사의 서비스를 이용하며 발생한 모든 개인정보 보호 관련 문의를 위 연락처로 하실 수 있습니다.
          </p>

          <h3 style={{ color: '#2c3e50', marginTop: '20px', fontSize: '1.1em' }}>6. 개인정보처리방침 변경</h3>
          <p style={{ marginBottom: '15px' }}>
            본 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있으며, 변경
            시 웹사이트를 통해 공지합니다.
          </p>

          <p style={{ marginTop: '30px', textAlign: 'center', color: '#7f8c8d', fontSize: '0.9em' }}>
            시행일자: 2025년 1월 24일
          </p>
        </div>

        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');

          @keyframes modalGradientFlow {
            0%,
            100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
}
