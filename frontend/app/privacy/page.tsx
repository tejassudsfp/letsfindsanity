export default function PrivacyPage() {
  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h1 className="mb-lg">privacy policy</h1>

      <div style={{ lineHeight: '1.8' }}>
        <section className="mb-xl">
          <h2 className="mb-md" style={{ color: 'var(--accent)' }}>builders only</h2>
          <p className="mb-md" style={{ fontWeight: 500 }}>
            letsfindsanity is strictly for users 18 years of age or older. we do not knowingly
            collect or maintain information from persons under 18 years of age. if you are under 18,
            you must not access or use this service.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">overview</h2>
          <p className="mb-md">
            letsfindsanity is a hobby project built to provide a safe, anonymous space for builders
            to journal and support each other. your privacy is fundamental to this mission.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">information we collect</h2>
          <h3 className="mb-sm">account information</h3>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>email address (for passwordless authentication)</li>
            <li>three-word anonymous identity (chosen by you)</li>
          </ul>

          <h3 className="mb-sm">content you create</h3>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>private journal entries</li>
            <li>public posts (anonymized)</li>
            <li>comments and reactions</li>
          </ul>

          <h3 className="mb-sm">ai analysis</h3>
          <p className="mb-md">
            we use anthropic's claude ai models to analyze your writing. your content is sent to
            anthropic's api for processing but is not used to train their models.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">how we use your information</h2>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>to provide ai-powered analysis and reflection</li>
            <li>to enable anonymous community sharing</li>
            <li>to moderate content for safety</li>
            <li>to improve the platform experience</li>
          </ul>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">anonymity and safety</h2>
          <p className="mb-md">
            all posts shared with the community are:
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>automatically anonymized by ai to remove identifying information</li>
            <li>attributed only to your three-word identity</li>
            <li>reviewed for safety before publication</li>
          </ul>
          <p className="mb-md">
            private journal entries are never shared publicly and remain visible only to you.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">encryption & data security</h2>
          <p className="mb-md">
            your data is stored securely in a postgresql database with the following protections:
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li><strong>private journal entries:</strong> encrypted using fernet symmetric encryption before storage</li>
            <li><strong>admin access:</strong> administrators cannot read your encrypted journal entries—even with database access</li>
            <li><strong>public posts:</strong> not encrypted (shared with community)</li>
            <li><strong>in transit:</strong> all data transmitted over https</li>
            <li><strong>at rest:</strong> database encryption provided by hosting infrastructure</li>
          </ul>
          <p className="mb-md">
            for complete technical details on how encryption works, visit our{' '}
            <a href="/tech" style={{ color: 'var(--accent)' }}>technical transparency page</a>.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">cookies</h2>
          <p className="mb-md">
            we use essential cookies to keep you logged in and ensure the site works properly:
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li><strong>authentication cookie (auth_token):</strong> keeps you logged in securely</li>
            <li><strong>duration:</strong> 30 days</li>
            <li><strong>purpose:</strong> strictly necessary for authentication</li>
          </ul>
          <p className="mb-md">
            we do not use tracking cookies, advertising cookies, or analytics cookies beyond basic
            vercel analytics (which is privacy-friendly and gdpr-compliant).
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">third-party services</h2>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li><strong>anthropic claude:</strong> ai analysis and moderation</li>
            <li><strong>openai:</strong> semantic search embeddings</li>
            <li><strong>vercel analytics:</strong> privacy-friendly usage statistics (no personal data)</li>
          </ul>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">your rights</h2>
          <p className="mb-md">you have the right to:</p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>access your data</li>
            <li>delete your account and associated data</li>
            <li>opt out of public sharing (keep everything private)</li>
          </ul>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">future changes</h2>
          <p className="mb-md">
            letsfindsanity is currently free and operated as a hobby project. we may:
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>introduce paid features in the future</li>
            <li>commercialize the platform if it proves successful</li>
          </ul>
          <p className="mb-md">
            any significant changes to this privacy policy will be communicated to users.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">legal compliance</h2>
          <p className="mb-md">
            while we implement strong encryption to protect your privacy, we comply with all applicable laws:
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>we may disclose information if required by valid legal process (subpoena, court order)</li>
            <li>we will notify users of legal requests unless prohibited by law</li>
            <li>we do not sell or share user data with third parties for marketing purposes</li>
            <li>we retain the right to cooperate with law enforcement in cases of illegal activity</li>
          </ul>
          <p className="mb-md">
            this project is open source. you can audit our code at{' '}
            <a href="https://github.com/tejassudsfp/letsfindsanity" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              github.com/tejassudsfp/letsfindsanity
            </a>.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">contact</h2>
          <p className="mb-md">
            questions about privacy? email us at{' '}
            <a href="mailto:hello@letsfindsanity.com" style={{ color: 'var(--accent)' }}>
              hello@letsfindsanity.com
            </a>
          </p>
        </section>

        <p className="text-tertiary" style={{ fontSize: '12px' }}>
          last updated: november 2025
        </p>
      </div>
    </div>
  )
}
