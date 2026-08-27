import { useState, useEffect } from 'react';
import logoBadge from '../assets/badge.webp';
import Footer from '../components/Footer';
import LegalMarkdown from '../components/LegalMarkdown';
import { POLICY_EFFECTIVE_DATE, POLICY_LAST_UPDATED } from '../content/legalPolicies';

function PageHeader({ onNavigate, isMobile }) {
  return (
    <header style={{
      padding: isMobile ? '16px 20px' : '18px 40px',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      <button onClick={() => onNavigate?.('home')} style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '16px' : '20px', letterSpacing: '0.22em', color: '#bd3b28', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        see.Com
      </button>
      <img src={logoBadge} alt="SEE.COM" onClick={() => onNavigate?.('landing')} style={{ position: 'absolute', right: isMobile ? '20px' : '40px', top: '50%', transform: 'translateY(-50%)', width: isMobile ? '36px' : '44px', height: isMobile ? '36px' : '44px', objectFit: 'cover', cursor: 'pointer' }} />
    </header>
  );
}

export default function LegalPageLayout({ title, content, onNavigate }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: '#fff' }}>
      <PageHeader onNavigate={onNavigate} isMobile={isMobile} />

      <div style={{ padding: isMobile ? '32px 20px 8px' : '48px 40px 8px', maxWidth: 720 }}>
        <button
          onClick={() => onNavigate?.('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, marginBottom: 20,
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10,
            letterSpacing: '0.1em', color: '#999', textTransform: 'uppercase',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '24px' : '32px', letterSpacing: '0.02em', color: '#000', margin: '0 0 8px' }}>
          {title}
        </h1>
        <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: 11, letterSpacing: '0.05em', color: '#bbb', margin: '0 0 32px', textTransform: 'uppercase' }}>
          Effective {POLICY_EFFECTIVE_DATE} · Last updated {POLICY_LAST_UPDATED}
        </p>
      </div>

      <div style={{ padding: isMobile ? '0 20px 60px' : '0 40px 80px', maxWidth: 720, flex: 1 }}>
        <LegalMarkdown content={content} />
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
