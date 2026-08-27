export default function FetchErrorState({ message = "Couldn't load products.", onRetry, height = 320 }) {
  return (
    <div style={{
      height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
    }}>
      <p style={{
        fontFamily: "'Archivo', sans-serif", fontSize: 12, color: '#999', letterSpacing: '0.04em',
        textAlign: 'center', margin: 0, maxWidth: 260,
      }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: '10px 24px', background: '#bd3b28', color: '#fff', border: 'none',
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10,
          letterSpacing: '0.16em', cursor: 'pointer', transition: 'background 0.2s', textTransform: 'uppercase',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#000'}
        onMouseLeave={e => e.currentTarget.style.background = '#bd3b28'}
      >
        Try Again
      </button>
    </div>
  );
}
