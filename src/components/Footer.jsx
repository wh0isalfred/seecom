import { FaInstagram, FaTiktok } from 'react-icons/fa';

const iconBtn = {
  width: 40, height: 40,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '50%', border: '1px solid #000',
  color: '#000', transition: 'background 0.2s, color 0.2s',
};

const legalLink = {
  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
  fontSize: '11px',
  letterSpacing: '0.04em',
  color: '#666',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  cursor: 'pointer',
  transition: 'color 0.2s',
};

export default function Footer({ onNavigate }) {
  return (
    <footer
      style={{
        backgroundColor: '#fff',
        borderTop: '3px solid #000',
        width: '100%',
        boxSizing: 'border-box',
        padding: '48px 24px 36px',
        textAlign: 'center',
      }}
    >
      {/* Social icons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
        <a
          href="https://www.instagram.com/jeh._see/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          style={iconBtn}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
        >
          <FaInstagram size={17} />
        </a>
        <a
          href="https://www.tiktok.com/@jehsee.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TikTok"
          style={iconBtn}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
        >
          <FaTiktok size={16} />
        </a>
      </div>

      {/* Brand · location */}
      <p style={{
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
        fontSize: '12px', letterSpacing: '0.1em', color: '#000',
        textTransform: 'uppercase', margin: '0 0 20px',
      }}>
        see.Com ·  Global
      </p>

      {/* Legal links */}
      <p style={{ margin: '0 0 16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 10px' }}>
        <a onClick={() => onNavigate?.('terms')} style={legalLink} onMouseEnter={e => e.currentTarget.style.color = '#000'} onMouseLeave={e => e.currentTarget.style.color = '#666'}>Terms & Conditions</a>
        <span style={{ color: '#ccc' }}>·</span>
        <a onClick={() => onNavigate?.('privacy')} style={legalLink} onMouseEnter={e => e.currentTarget.style.color = '#000'} onMouseLeave={e => e.currentTarget.style.color = '#666'}>Privacy Policy</a>
        <span style={{ color: '#ccc' }}>·</span>
        <a onClick={() => onNavigate?.('no-return')} style={legalLink} onMouseEnter={e => e.currentTarget.style.color = '#000'} onMouseLeave={e => e.currentTarget.style.color = '#666'}>No-Return Policy</a>
      </p>

      {/* Contact */}
      <p style={{
        fontFamily: "'Archivo', Helvetica, Arial, sans-serif", fontSize: '11px',
        letterSpacing: '0.02em', color: '#999', margin: '0 0 20px', lineHeight: 1.8,
      }}>
        Order issues: <a href="tel:+2349167699583" style={{ color: '#666' }}>+234 916 769 9583</a>
        <br />
        Other inquiries: <a href="tel:+2347065772394" style={{ color: '#666' }}>+234 706 577 2394</a>
      </p>

      {/* Copyright */}
      <p style={{
        fontFamily: "'Archivo', Helvetica, Arial, sans-serif", fontSize: '10px',
        letterSpacing: '0.04em', color: '#bbb', margin: 0,
      }}>
        © 2026 SEE.COM
      </p>
    </footer>
  );
}
