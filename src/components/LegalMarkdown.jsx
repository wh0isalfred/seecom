/**
 * Minimal markdown-to-JSX renderer, scoped to exactly what the SEE.COM legal
 * policy content uses: #/##/### headings, "- " bullet lists, **bold** inline,
 * "---" horizontal rules, and plain paragraphs (with hard line breaks where
 * the source has them on separate lines within one block).
 *
 * Not a general-purpose markdown parser — kept intentionally small so the
 * legal pages render exactly what's in src/content/legalPolicies.js with no
 * surprises.
 */

function renderInline(line, key) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <span key={key}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} style={{ fontWeight: 700, color: '#000' }}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}

export default function LegalMarkdown({ content }) {
  const blocks = content.trim().split(/\n\s*\n/);

  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        // Heading levels
        if (lines[0].startsWith('### ')) {
          return (
            <h3 key={i} style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: 13, letterSpacing: '0.04em', color: '#000',
              margin: '28px 0 8px', textTransform: 'uppercase',
            }}>
              {lines[0].slice(4)}
            </h3>
          );
        }
        if (lines[0].startsWith('## ')) {
          return (
            <h2 key={i} style={{
              fontFamily: "'Clash Display', sans-serif", fontWeight: 600,
              fontSize: 17, letterSpacing: '0.01em', color: '#000',
              margin: '32px 0 10px',
            }}>
              {lines[0].slice(3)}
            </h2>
          );
        }
        if (lines[0].startsWith('# ')) {
          return (
            <h1 key={i} style={{
              fontFamily: "'Clash Display', sans-serif", fontWeight: 600,
              fontSize: 24, letterSpacing: '0.01em', color: '#000',
              margin: '40px 0 14px', paddingTop: i === 0 ? 0 : 20,
              borderTop: i === 0 ? 'none' : '3px solid #000',
            }}>
              {lines[0].slice(2)}
            </h1>
          );
        }

        // Horizontal rule
        if (lines.length === 1 && lines[0] === '---') {
          return <hr key={i} style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '32px 0' }} />;
        }

        // Bullet list
        if (lines.every(l => l.startsWith('- '))) {
          return (
            <ul key={i} style={{ margin: '0 0 16px', paddingLeft: 20 }}>
              {lines.map((l, j) => (
                <li key={j} style={{
                  fontFamily: "'Archivo', sans-serif", fontSize: 13, lineHeight: 1.8,
                  color: '#444', marginBottom: 4,
                }}>
                  {renderInline(l.slice(2), j)}
                </li>
              ))}
            </ul>
          );
        }

        // Paragraph — preserve intentional line breaks within the block
        return (
          <p key={i} style={{
            fontFamily: "'Archivo', sans-serif", fontSize: 13, lineHeight: 1.8,
            color: '#444', margin: '0 0 16px',
          }}>
            {lines.map((l, j) => (
              <span key={j}>
                {renderInline(l, j)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}
