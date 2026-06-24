import { useEffect, useState } from 'react';

export default function Footer() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <footer
      style={{
        backgroundColor: '#fff',
        borderTop: '3px solid #000',
        marginTop: 0,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Content Area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr',
          gap: isDesktop ? '48px' : '40px',
          padding: isDesktop ? '56px 40px' : '48px 24px',
          maxWidth: '100%',
          textAlign: isDesktop ? 'left' : 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo & Socials */}
        <div>
          <div
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontWeight: 600,
              fontSize: '18px',
              letterSpacing: '0.22em',
              color: '#000',
              marginBottom: '24px',
            }}
          >
            See.Com
          </div>

          {/* Social Links */}
          <div style={{ display: 'flex', gap: '24px', justifyContent: isDesktop ? 'flex-start' : 'center' }}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                fontSize: '11px',
                letterSpacing: '0.08em',
                color: '#666',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#000')}
              onMouseLeave={(e) => (e.target.style.color = '#666')}
            >
              Instagram
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                fontSize: '11px',
                letterSpacing: '0.08em',
                color: '#666',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#000')}
              onMouseLeave={(e) => (e.target.style.color = '#666')}
            >
              TikTok
            </a>
          </div>
        </div>

        {/* Information Section */}
        <div>
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: '#000',
              marginBottom: '20px',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Information
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href="#"
              style={{
                fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                fontSize: '11px',
                letterSpacing: '0.05em',
                color: '#666',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#000')}
              onMouseLeave={(e) => (e.target.style.color = '#666')}
            >
              Terms & Conditions
            </a>
            <a
              href="#"
              style={{
                fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                fontSize: '11px',
                letterSpacing: '0.05em',
                color: '#666',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#000')}
              onMouseLeave={(e) => (e.target.style.color = '#666')}
            >
              Privacy Policy
            </a>
            <a
              href="#"
              style={{
                fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                fontSize: '11px',
                letterSpacing: '0.05em',
                color: '#666',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#000')}
              onMouseLeave={(e) => (e.target.style.color = '#666')}
            >
              Returns Policy
            </a>
          </div>
        </div>

        {/* Contact Us Section */}
        <div>
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: '#000',
              marginBottom: '20px',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Contact Us
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div
                style={{
                  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  color: '#999',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Issues & Order Inquiries:
              </div>
              <a
                href="tel:+2347065772394"
                style={{
                  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.target.style.color = '#000')}
                onMouseLeave={(e) => (e.target.style.color = '#666')}
              >
                +234 706 577 2394
              </a>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  color: '#999',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                All Other Inquiries:
              </div>
              <a
                href="tel:+2347065772394"
                style={{
                  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.target.style.color = '#000')}
                onMouseLeave={(e) => (e.target.style.color = '#666')}
              >
                +234 706 577 2394
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
