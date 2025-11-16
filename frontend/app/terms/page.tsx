export default function TermsPage() {
  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h1 className="mb-lg">terms of service</h1>

      <div style={{ lineHeight: '1.8' }}>
        <section className="mb-xl">
          <h2 className="mb-md" style={{ color: 'var(--accent)' }}>builders only</h2>
          <p className="mb-md" style={{ fontWeight: 500 }}>
            letsfindsanity is strictly for users 18 years of age or older. by using this platform,
            you confirm that you are at least 18 years old. if you are under 18, you must not
            access or use this service.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">acceptance of terms</h2>
          <p className="mb-md">
            by accessing and using letsfindsanity, you accept and agree to be bound by these terms
            of service. if you do not agree to these terms, please do not use the platform.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">description of service</h2>
          <p className="mb-md">
            letsfindsanity is a hobby project providing:
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>private journaling with ai-powered reflection</li>
            <li>anonymous community sharing and support</li>
            <li>topic-based discovery and connection</li>
          </ul>
          <p className="mb-md">
            the platform is currently free to use and operated as a personal project.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">inspiration and acknowledgment</h2>
          <p className="mb-md">
            this platform is inspired by farza's freewrite and the freewrite community. we're
            grateful for their pioneering work in creating spaces for authentic builder expression.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">user responsibilities</h2>
          <h3 className="mb-sm">you agree to:</h3>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>provide accurate information during registration</li>
            <li>maintain the security of your account</li>
            <li>respect the anonymity of other users</li>
            <li>not attempt to identify other users</li>
            <li>use the platform in good faith for personal reflection and community support</li>
          </ul>

          <h3 className="mb-sm">you agree not to:</h3>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>post harmful, threatening, or harassing content</li>
            <li>share others' private information</li>
            <li>use the platform for spam or commercial purposes</li>
            <li>attempt to circumvent content moderation</li>
            <li>engage in behavior that would compromise the safety of the community</li>
          </ul>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">content moderation</h2>
          <p className="mb-md">
            we use ai-powered moderation to maintain a safe, supportive environment:
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>posts are checked for safety before publication</li>
            <li>comments are moderated for respectful discourse</li>
            <li>repeated violations may result in being blocked from commenting</li>
            <li>we reserve the right to remove content that violates community standards</li>
          </ul>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">encryption & privacy</h2>
          <p className="mb-md">
            your private journal entries are encrypted using industry-standard encryption (fernet):
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>private journals are encrypted before being stored in the database</li>
            <li>administrators cannot read your encrypted journal entries</li>
            <li>public posts are not encrypted (visible to the community)</li>
          </ul>
          <p className="mb-md">
            for technical details, visit our{' '}
            <a href="/tech" style={{ color: 'var(--accent)' }}>technical transparency page</a>.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">legal compliance</h2>
          <p className="mb-md">
            while we use encryption to protect your privacy, we comply with all applicable laws:
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>we may be required to disclose information pursuant to valid legal process</li>
            <li>we cooperate with law enforcement when legally required</li>
            <li>encryption does not shield illegal activity from legal accountability</li>
            <li>we will notify users of legal requests unless prohibited by law</li>
          </ul>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">intellectual property & open source</h2>
          <p className="mb-md">
            you retain ownership of content you create. by sharing content publicly, you grant
            letsfindsanity a license to display and distribute that content within the platform.
          </p>
          <p className="mb-md">
            this project is open source under the MIT license. the codebase is available at{' '}
            <a href="https://github.com/tejassudsfp/letsfindsanity" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              github.com/tejassudsfp/letsfindsanity
            </a>.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">ai-generated analysis</h2>
          <p className="mb-md">
            ai analysis is provided for reflection purposes only. it is not:
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>professional mental health advice</li>
            <li>a substitute for therapy or medical care</li>
            <li>guaranteed to be accurate or appropriate for your situation</li>
          </ul>
          <p className="mb-md">
            if you're experiencing a mental health crisis, please contact appropriate
            professional services.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">disclaimer of warranties</h2>
          <p className="mb-md">
            letsfindsanity is provided "as is" without warranties of any kind. this is a hobby
            project and may:
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>experience downtime or interruptions</li>
            <li>contain bugs or errors</li>
            <li>change features without notice</li>
            <li>be discontinued at any time</li>
          </ul>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">limitation of liability</h2>
          <p className="mb-md">
            to the maximum extent permitted by law, letsfindsanity and its creator shall not be
            liable for any damages arising from your use of the platform.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">future commercialization</h2>
          <p className="mb-md">
            while currently free, letsfindsanity may:
          </p>
          <ul className="mb-md" style={{ paddingLeft: '20px' }}>
            <li>introduce paid features</li>
            <li>become a commercial product</li>
            <li>implement subscription models</li>
          </ul>
          <p className="mb-md">
            users will be notified of any significant changes to pricing or business model.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">termination</h2>
          <p className="mb-md">
            we reserve the right to terminate or suspend access to the platform for violations
            of these terms or for any other reason at our discretion.
          </p>
          <p className="mb-md">
            you may delete your account at any time.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">changes to terms</h2>
          <p className="mb-md">
            we may update these terms from time to time. continued use of the platform after
            changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="mb-xl">
          <h2 className="mb-md">contact</h2>
          <p className="mb-md">
            questions about these terms? email us at{' '}
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
