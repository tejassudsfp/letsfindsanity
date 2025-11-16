'use client'

export default function TechPage() {
  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="mb-lg">technical transparency</h1>

      <div className="card" style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
          when you're sharing vulnerable thoughts, you deserve to know exactly how your data is handled.
          here's a complete breakdown of how letsfindsanity works under the hood.
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          this project is fully open source. you can audit every line of code at{' '}
          <a href="https://github.com/tejassudsfp/letsfindsanity" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
            github.com/tejassudsfp/letsfindsanity
          </a>
        </p>
      </div>

      {/* Encryption */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="mb-sm">encryption & privacy</h2>
        <div style={{ fontSize: '15px', lineHeight: '1.7' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            how your private journals are protected
          </h3>
          <p style={{ marginBottom: '12px' }}>
            when you save a journal entry privately (without sharing), it's encrypted using <strong>fernet symmetric encryption</strong> before being stored in the database.
          </p>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
            what this means:
          </h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li>your journal content is scrambled into an unreadable format</li>
            <li>only you can read it when logged in (we decrypt it for you)</li>
            <li>admins cannot read your private journals—they only see encrypted gibberish</li>
            <li>even with database access, your entries are protected</li>
          </ul>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
            technical details:
          </h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li>encryption: fernet (AES 128-bit in CBC mode with PKCS7 padding)</li>
            <li>key storage: server environment variable (not in database)</li>
            <li>implementation: python cryptography library</li>
            <li>code location: <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>backend/services/encryption_service.py</code></li>
          </ul>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
            what's NOT encrypted:
          </h4>
          <ul style={{ paddingLeft: '20px' }}>
            <li>public posts (shared anonymously—visible to community)</li>
            <li>your email address (needed for login)</li>
            <li>your three-word identity (public)</li>
            <li>metadata (timestamps, session counts)</li>
          </ul>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="mb-sm">ai analysis transparency</h2>
        <div style={{ fontSize: '15px', lineHeight: '1.7' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            what happens when you click "analyze"
          </h3>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
            1. your content is sent to anthropic's claude api
          </h4>
          <p style={{ marginBottom: '12px' }}>
            when you click analyze, your journal content is sent to anthropic's servers.
            per their policy, data is retained for 30 days for trust & safety, then deleted.
          </p>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
            2. claude analyzes based on your chosen intent
          </h4>
          <p style={{ marginBottom: '8px' }}>
            we have 7 different prompt modes:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li><strong>processing</strong> - helps you see what you might not be seeing</li>
            <li><strong>agreeing</strong> - validates your perspective while adding depth</li>
            <li><strong>challenging</strong> - offers respectful alternative perspectives</li>
            <li><strong>solution</strong> - helps you understand what made it work</li>
            <li><strong>venting</strong> - validates without agreeing with every thought</li>
            <li><strong>advice</strong> - helps clarify the actual question</li>
            <li><strong>reflecting</strong> - helps you see progress you might miss</li>
          </ul>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
            3. safety check runs automatically
          </h4>
          <p style={{ marginBottom: '8px' }}>
            claude checks if your content is safe to share publicly. it rejects if:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li>contains identifying information (names, company names, locations)</li>
            <li>contains harmful content (threats, self-harm, abuse)</li>
            <li>shows signs of mental health crisis (suggests professional help)</li>
            <li>is purely rage without insight</li>
            <li>would violate someone else's privacy</li>
          </ul>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
            4. suggested post is always created
          </h4>
          <p style={{ marginBottom: '12px' }}>
            even if safety check fails, claude creates an anonymized version you can edit and share.
            this removes identifying details while preserving emotional truth.
          </p>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
            what claude does NOT see:
          </h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li>your email address</li>
            <li>your user id</li>
            <li>your three-word identity</li>
            <li>any other journal entries you've written</li>
          </ul>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
            prompt caching for cost efficiency:
          </h4>
          <p style={{ marginBottom: '12px' }}>
            we use anthropic's prompt caching to cache our master system prompt. this reduces api costs by 90% on repeated requests.
            the master prompt defines claude's personality and values—it never changes between analyses.
          </p>

          <p style={{ marginBottom: '8px', fontWeight: 600 }}>
            view all prompts in the codebase:
          </p>
          <code style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '4px', display: 'block', marginBottom: '8px' }}>
            backend/services/claude_service.py
          </code>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="mb-sm">semantic search</h2>
        <div style={{ fontSize: '15px', lineHeight: '1.7' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            how we find similar posts
          </h3>

          <p style={{ marginBottom: '12px' }}>
            when you search or view a post, we use <strong>vector embeddings</strong> to find similar content.
          </p>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
            how it works:
          </h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li>when a post is published, we send it to openai's embedding api</li>
            <li>openai returns a 1536-dimensional vector (array of numbers)</li>
            <li>this vector represents the semantic meaning of the post</li>
            <li>we store it using postgresql's pgvector extension</li>
            <li>when you search, we compare vectors using cosine similarity</li>
            <li>posts with similar meanings appear in results</li>
          </ul>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
            what openai sees:
          </h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li>only the PUBLIC post content (not private journals)</li>
            <li>data retained for 30 days per openai policy</li>
            <li>no user information, just text</li>
          </ul>
        </div>
      </div>

      {/* Admin Access */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="mb-sm">what admins can and cannot see</h2>
        <div style={{ fontSize: '15px', lineHeight: '1.7' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px', color: 'var(--success)' }}>
            ✓ admins CAN see:
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li>public posts (same as any user)</li>
            <li>application submissions (email, what you're building, why you want to join)</li>
            <li>flagged posts and comments</li>
            <li>aggregate analytics (total builders, sessions, posts)</li>
            <li>your email address (needed for approvals)</li>
            <li>your three-word identity (public)</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px', color: 'var(--error)' }}>
            ✗ admins CANNOT see:
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li><strong>your private journal entries</strong> (encrypted—even with database access)</li>
            <li>your otp login codes</li>
            <li>individual reading or browsing behavior</li>
            <li>which posts you've reacted to or commented on (unless they check each post)</li>
            <li>your ai analysis content (private reflection)</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            admin capabilities:
          </h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>approve/reject applications</li>
            <li>delete public posts that violate community guidelines</li>
            <li>view platform analytics</li>
            <li>search users by email or identity (for moderation)</li>
          </ul>
        </div>
      </div>

      {/* Analytics */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="mb-sm">analytics & tracking</h2>
        <div style={{ fontSize: '15px', lineHeight: '1.7' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            what we track (aggregate only)
          </h3>

          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li><strong>api token usage</strong> - daily input/output tokens, cache hits, costs</li>
            <li><strong>builder growth</strong> - new signups per day, total builders</li>
            <li><strong>session activity</strong> - writing sessions completed per day</li>
            <li><strong>post creation</strong> - public posts shared per day</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            what we do NOT track
          </h3>

          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li>individual user behavior (no per-user analytics)</li>
            <li>reading patterns (which posts you view)</li>
            <li>ip addresses (not stored)</li>
            <li>device fingerprints</li>
            <li>time spent on pages</li>
            <li>click patterns</li>
          </ul>

          <p style={{ marginBottom: '8px', fontWeight: 600 }}>
            view analytics code:
          </p>
          <code style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '4px', display: 'block', marginBottom: '8px' }}>
            backend/routes/admin.py (lines 227-371)
          </code>
        </div>
      </div>

      {/* Data Storage */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="mb-sm">data storage & retention</h2>
        <div style={{ fontSize: '15px', lineHeight: '1.7' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            where your data lives
          </h3>

          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li><strong>database</strong> - postgresql on neon.tech (encrypted at rest)</li>
            <li><strong>anthropic</strong> - journal content sent for analysis (30 day retention)</li>
            <li><strong>openai</strong> - post content for embeddings (30 day retention)</li>
            <li><strong>sendgrid</strong> - email delivery for otp codes (not stored)</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            retention policy
          </h3>

          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li>encrypted journals: stored until you delete them</li>
            <li>public posts: stored indefinitely (you can delete anytime)</li>
            <li>applications: stored for admin review</li>
            <li>analytics: aggregate metrics stored indefinitely</li>
            <li>otp codes: deleted after 10 minutes or use</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            your rights
          </h3>

          <ul style={{ paddingLeft: '20px' }}>
            <li>delete your account anytime (contact us)</li>
            <li>export your data (contact us)</li>
            <li>delete individual journal entries or posts</li>
            <li>reset your three-word identity once</li>
          </ul>
        </div>
      </div>

      {/* Open Source */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="mb-sm">open source commitment</h2>
        <div style={{ fontSize: '15px', lineHeight: '1.7' }}>
          <p style={{ marginBottom: '16px' }}>
            the entire letsfindsanity codebase is open source under the MIT license.
            this means you can:
          </p>

          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li>audit every line of code</li>
            <li>verify encryption implementation</li>
            <li>review ai prompts</li>
            <li>fork and customize for your own use</li>
            <li>contribute improvements</li>
            <li>use commercially</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            repository
          </h3>

          <p style={{ marginBottom: '8px' }}>
            <a href="https://github.com/tejassudsfp/letsfindsanity" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '16px', fontWeight: 600 }}>
              github.com/tejassudsfp/letsfindsanity
            </a>
          </p>

          <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            built with <a href="https://code.claude.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>claude code 1.0</a>
          </p>
        </div>
      </div>

      {/* Questions */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="mb-sm">questions?</h2>
        <div style={{ fontSize: '15px', lineHeight: '1.7' }}>
          <p style={{ marginBottom: '12px' }}>
            if something isn't clear or you want more technical details, we're here to help.
          </p>

          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li>email: <a href="mailto:hello@letsfindsanity.com" style={{ color: 'var(--accent)' }}>hello@letsfindsanity.com</a></li>
            <li>github issues: <a href="https://github.com/tejassudsfp/letsfindsanity/issues" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>report issue</a></li>
            <li>github discussions: <a href="https://github.com/tejassudsfp/letsfindsanity/discussions" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>ask questions</a></li>
          </ul>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '24px', fontStyle: 'italic' }}>
            transparency isn't optional—it's foundational to trust.
          </p>
        </div>
      </div>
    </div>
  )
}
