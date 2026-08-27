import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState(''); // eslint-disable-line
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setEmail('');
      setPassword('');
      setConfirm('');
      setError('');
      setDone(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setDone(false);
  };

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup') {
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        onSuccess?.();
        onClose?.();
      } else {
        await signUp(email, password);
        setDone(true);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          zIndex: 999990,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#fff',
          zIndex: 999991,
          padding: '48px 40px 40px',
          boxSizing: 'border-box',
          animation: 'slideUp 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          margin: '0 16px',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#bbb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#000')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#bbb')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {done ? (
          /* ── Signup confirm ── */
          <>
            <Logo />
            <Divider />
            <h2 style={heading}>Account Created</h2>
            <p style={sub}>
              Your account has been created successfully. You can now log in using your email and password.
            </p>
            {/* <h2 style={heading}>CHECK YOUR EMAIL</h2>
            <p style={sub}>
              We sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account, then log in.
            </p> */}
            <button style={primaryBtn(false)} onClick={() => switchMode('login')}>
              BACK TO LOGIN
            </button>
          </>
        ) : (
          <>
            <Logo />
            <Divider />

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e8', marginBottom: '28px' }}>
              {['login', 'signup'].map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    paddingBottom: '12px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    background: 'none',
                    border: 'none',
                    borderBottom: mode === m ? '2px solid #000' : '2px solid transparent',
                    color: mode === m ? '#000' : '#bbb',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                    marginBottom: '-1px',
                  }}
                >
                  {m === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#fff5f5',
                border: '1px solid #fecaca',
                borderLeft: '3px solid #be1826',
                fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                fontSize: '12px',
                color: '#be1826',
                marginBottom: '16px',
                letterSpacing: '0.02em',
              }}>
                {error}
              </div>
            )}

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <Field
                type="email"
                placeholder="Email address"
                value={email}
                onChange={setEmail}
                onEnter={handleSubmit}
              />
              <Field
                type="password"
                placeholder="Password"
                value={password}
                onChange={setPassword}
                onEnter={handleSubmit}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={primaryBtn(loading)}
            >
              {loading ? '...' : mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
            </button>

            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '12px', color: '#999', textAlign: 'center', margin: 0 }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                style={{ background: 'none', border: 'none', padding: 0, fontFamily: "'Archivo', sans-serif", fontSize: '12px', color: '#000', textDecoration: 'underline', cursor: 'pointer' }}
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </>
  );
}

function Logo() {
  return (
    <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '22px', letterSpacing: '0.22em', color: '#000', textAlign: 'center', marginBottom: '18px' }}>
      SEE.COM
    </div>
  );
}

function Divider() {
  return <div style={{ width: 36, height: 3, background: '#be1826', margin: '0 auto 24px' }} />;
}

function Field({ type, placeholder, value, onChange, onEnter }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      style={{
        width: '100%',
        padding: '12px 14px',
        fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
        fontSize: '13px',
        border: '1px solid #e0e0e0',
        borderRadius: '2px',
        outline: 'none',
        boxSizing: 'border-box',
        color: '#000',
        transition: 'border-color 0.2s',
      }}
      onFocus={(e) => (e.target.style.borderColor = '#000')}
      onBlur={(e)  => (e.target.style.borderColor = '#e0e0e0')}
    />
  );
}

const heading = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  fontSize: '15px',
  letterSpacing: '0.1em',
  color: '#000',
  textAlign: 'center',
  marginBottom: '12px',
};

const sub = {
  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
  fontSize: '13px',
  color: '#666',
  lineHeight: 1.6,
  textAlign: 'center',
  marginBottom: '28px',
};

const primaryBtn = (loading) => ({
  width: '100%',
  padding: '13px',
  background: '#000',
  color: '#fff',
  border: 'none',
  borderRadius: '2px',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '0.14em',
  cursor: loading ? 'default' : 'pointer',
  opacity: loading ? 0.6 : 1,
  marginBottom: '16px',
  transition: 'background 0.2s',
});
