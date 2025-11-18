import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer" style={{
      borderTop: '1px solid var(--border)',
      marginTop: '64px',
      fontSize: '13px',
      color: 'var(--text-secondary)',
      padding: '16px 24px'
    }}>
      <div>
        <div className="footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: '3fr 1.5fr 1.5fr 1.5fr 2fr',
          gap: '48px',
          marginBottom: '24px'
        }}>
          {/* About */}
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              letsfindsanity
            </h3>
            <p style={{ lineHeight: '1.6', marginBottom: '12px' }}>
              a space for builders to journal, support <br /> and ask for advice anonymously !
            </p>
            <p style={{ lineHeight: '1.6' }}>
              inspired by{' '}
              <a
                href="https://freewrite.io"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'none' }}
              >
                freewrite.io
              </a>
              {' '}by farza
            </p>
          </div>

          {/* Legal */}
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              legal
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                privacy policy
              </Link>
              <Link href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                terms of service
              </Link>
              <Link href="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                about
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              resources
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/tech" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                technical transparency
              </Link>
              <a
                href="mailto:fred@letsfindsanity.com"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
              >
                contact us
              </a>
            </div>
          </div>

          {/* Open Source */}
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              open source
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href="https://github.com/tejassudsfp/letsfindsanity"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
              >
                view on github
              </a>
              <span style={{ color: 'var(--text-tertiary)' }}>
                MIT license
              </span>
            </div>
          </div>

          {/* Empty column for spacing */}
          <div></div>
        </div>

      </div>

      {/* Bottom copyright */}
      <div>
        <div className="footer-bottom" style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-tertiary)'
        }}>
          <div>
            © 2025 letsfindsanity. open source under MIT license.
          </div>
          <div>
            last updated november 2025
          </div>
        </div>
      </div>
    </footer>
  )
}
