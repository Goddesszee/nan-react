// Shared scaffold for new NAN ecosystem verticals (Homes, Market, Gigs, Careers, Payroll, AI Assistant).
// Each page below wraps this with its own copy/icon. Wire up real data/routes as each
// vertical goes live. This gives every section a consistent, on-brand shell in the
// meantime rather than a broken link or blank page.

export function EcosystemPage({ setPage, title, tagline, features }) {
  const letter = title.replace('NAN ', '').charAt(0)
  return (
    <div className="page">
      <div className="page-card" style={{ maxWidth: 560 }}>
        <div className="page-header">
          {setPage && (
            <button className="back-btn" onClick={() => setPage('home')}>←</button>
          )}
          <h2>{title}</h2>
        </div>

        <div style={{ textAlign: 'center', padding: '12px 8px 28px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 18px',
            background: 'var(--violet2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, color: 'var(--violet)',
          }}>
            {letter}
          </div>
          <p style={{ color: 'var(--text2)', fontSize: '.95rem', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
            {tagline}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)', padding: '14px 16px',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--blue)', flexShrink: 0,
              }} />
              <span style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--text2)' }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 24, textAlign: 'center', fontSize: '.78rem',
          fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
          color: 'var(--text3)',
        }}>
          Coming soon
        </div>
      </div>
    </div>
  )
}
