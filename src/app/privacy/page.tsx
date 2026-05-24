import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | ICP Diagnostic',
  description: 'How ICP Diagnostic collects, uses, and protects your personal information.',
  alternates: { canonical: '/privacy' },
}

export const dynamic = 'force-static'

const P       = '#18110a'
const Pmuted  = 'rgba(24,17,10,0.5)'
const Pborder = 'rgba(24,17,10,0.12)'
const font    = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB   = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

const LAST_UPDATED = '22 May 2025'

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: fontB, color: P, backgroundColor: '#faf6ef', margin: 0, padding: 0 }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px clamp(16px,4vw,40px)',
        background: 'rgba(24,17,10,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: '#e8330a', flexShrink: 0 }} />
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: '#fff' }}>ICP Diagnostic</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/terms" style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Terms</Link>
          <Link href="/auth" style={{ fontFamily: fontB, fontSize: 13, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: '#18110a',
        padding: 'clamp(88px,12vw,140px) clamp(16px,4vw,24px) clamp(48px,6vw,80px)',
        textAlign: 'center',
      }}>
        <p style={{ fontFamily: fontB, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
          Legal
        </p>
        <h1 style={{ fontFamily: font, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: fontB, fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: 560, margin: '0 auto' }}>
          Last updated: {LAST_UPDATED}. This policy explains how we collect, use, and protect your personal information.
        </p>
      </section>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,24px) clamp(64px,8vw,120px)' }}>

        <Section title="1. Who We Are">
          <Para>ICP Diagnostic operates the website idealicp.com and the ICP Diagnostic platform. We are based in Nairobi, Kenya. For any privacy-related questions, contact us at <a href="mailto:support@idealicp.com" style={{ color: P, fontWeight: 600 }}>support@idealicp.com</a>.</Para>
        </Section>

        <Section title="2. Information We Collect">
          <Para><strong>Information you provide directly:</strong></Para>
          <ul style={{ margin: '4px 0 12px 20px', padding: 0, lineHeight: 1.9, color: Pmuted, fontSize: 15 }}>
            <li>Your email address, first name, and last name when you sign up</li>
            <li>Your company name and other business details you enter during onboarding or diagnostics</li>
            <li>Answers to the ICP diagnostic questionnaire</li>
            <li>CSV files or campaign data you optionally upload for deeper analysis</li>
          </ul>
          <Para><strong>Information collected automatically when you use Google sign-in:</strong></Para>
          <ul style={{ margin: '4px 0 12px 20px', padding: 0, lineHeight: 1.9, color: Pmuted, fontSize: 15 }}>
            <li>Your full name and profile picture from your Google account</li>
            <li>Your Google-verified email address</li>
          </ul>
          <Para><strong>Information collected automatically through use of the platform:</strong></Para>
          <ul style={{ margin: '4px 0 0 20px', padding: 0, lineHeight: 1.9, color: Pmuted, fontSize: 15 }}>
            <li>Your subscription tier and billing status</li>
            <li>Timestamps of when you view reports, intelligence briefings, and other content</li>
            <li>Quick wins you have marked as complete</li>
            <li>Your engagement streaks and usage milestones</li>
            <li>Standard server log data, including IP address and browser type</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <Para>We use your information to:</Para>
          <ul style={{ margin: '8px 0 0 20px', padding: 0, lineHeight: 1.9, color: Pmuted, fontSize: 15 }}>
            <li>Create and manage your account</li>
            <li>Generate your ICP diagnostic reports and recommendations</li>
            <li>Process your subscription payments via Paystack</li>
            <li>Send you transactional emails (account confirmation, report delivery, billing receipts) via Resend</li>
            <li>Send you intelligence briefings and product updates if you are a subscriber (you may opt out at any time)</li>
            <li>Improve the accuracy and quality of the platform</li>
            <li>Comply with legal obligations</li>
          </ul>
          <Para>We do not use your data for advertising, profiling for third parties, or any purpose not listed here.</Para>
        </Section>

        <Section title="4. Legal Basis for Processing">
          <Para>We process your personal data on the following bases:</Para>
          <ul style={{ margin: '8px 0 0 20px', padding: 0, lineHeight: 1.9, color: Pmuted, fontSize: 15 }}>
            <li><strong>Contract:</strong> Processing your account details, generating reports, and handling billing is necessary to provide the service you have subscribed to</li>
            <li><strong>Legitimate interest:</strong> Improving the platform and understanding how users interact with it</li>
            <li><strong>Consent:</strong> Sending marketing or non-essential communications, where we ask for your consent separately</li>
            <li><strong>Legal obligation:</strong> Retaining billing records and complying with applicable laws</li>
          </ul>
        </Section>

        <Section title="5. Cookies and Local Storage">
          <Para>We use the following cookies and browser storage mechanisms:</Para>
          <ul style={{ margin: '8px 0 0 20px', padding: 0, lineHeight: 1.9, color: Pmuted, fontSize: 15 }}>
            <li><strong>icp_session:</strong> An HttpOnly session cookie used to keep you signed in. It contains a signed token linking to your account. It expires after 30 days</li>
            <li><strong>Supabase auth cookies:</strong> Set during the OAuth login flow to manage the authentication handshake. These are short-lived and cleared after sign-in completes</li>
            <li><strong>localStorage:</strong> We store your email address, display preferences, and completed quick wins locally in your browser to reduce load times. This data stays on your device</li>
          </ul>
          <Para>We do not use advertising cookies or third-party tracking pixels.</Para>
        </Section>

        <Section title="6. How We Share Your Information">
          <Para>We share your information only with the following third parties, and only to the extent necessary to operate the platform:</Para>
          <ul style={{ margin: '8px 0 0 20px', padding: 0, lineHeight: 1.9, color: Pmuted, fontSize: 15 }}>
            <li><strong>Supabase:</strong> Our database and authentication provider. Your account data and reports are stored in Supabase's infrastructure (AWS, EU region)</li>
            <li><strong>Paystack:</strong> Our payment processor. Paystack handles your card details directly and we never store full card numbers</li>
            <li><strong>Resend:</strong> Our email delivery provider. Your email address is shared with Resend solely to send you transactional and subscription emails</li>
            <li><strong>Google:</strong> If you use Google sign-in, Google shares your profile data with us as described in section 2</li>
          </ul>
          <Para>We do not sell, rent, or trade your personal information with any other party.</Para>
        </Section>

        <Section title="7. Data Retention">
          <Para>We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or financial compliance reasons (for example, billing records, which we keep for 7 years as required under Kenyan tax law).</Para>
          <Para>Uploaded CSV files used for analysis are deleted from our servers within 90 days of upload.</Para>
        </Section>

        <Section title="8. Data Security">
          <Para>We take the security of your data seriously. Measures we have in place include:</Para>
          <ul style={{ margin: '8px 0 0 20px', padding: 0, lineHeight: 1.9, color: Pmuted, fontSize: 15 }}>
            <li>All data is transmitted over HTTPS (TLS)</li>
            <li>Session tokens are signed with HMAC-SHA256 and stored in HttpOnly cookies, inaccessible to JavaScript</li>
            <li>Database access uses row-level security and a service role key that is never exposed to the client</li>
            <li>Payment processing is handled entirely by Paystack, meaning card data never touches our servers</li>
          </ul>
          <Para>No system is completely immune to security risks. In the event of a data breach that affects your personal information, we will notify you as required by applicable law.</Para>
        </Section>

        <Section title="9. Your Rights">
          <Para>Depending on your location, you may have the following rights regarding your personal data:</Para>
          <ul style={{ margin: '8px 0 0 20px', padding: 0, lineHeight: 1.9, color: Pmuted, fontSize: 15 }}>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Correction:</strong> Ask us to correct inaccurate data</li>
            <li><strong>Deletion:</strong> Ask us to delete your account and personal data</li>
            <li><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interest</li>
            <li><strong>Withdrawal of consent:</strong> Where processing is based on consent, withdraw it at any time</li>
          </ul>
          <Para>To exercise any of these rights, email us at <a href="mailto:support@idealicp.com" style={{ color: P, fontWeight: 600 }}>support@idealicp.com</a>. We will respond within 30 days.</Para>
        </Section>

        <Section title="10. Children's Privacy">
          <Para>ICP Diagnostic is not directed at children under 18. We do not knowingly collect personal information from anyone under 18. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.</Para>
        </Section>

        <Section title="11. International Transfers">
          <Para>ICP Diagnostic is based in Kenya, but some of our service providers (Supabase, Resend, Paystack) store and process data in other countries, including the United States and the European Union. By using the platform, you acknowledge that your data may be transferred internationally. We ensure that such providers have appropriate data protection safeguards in place.</Para>
        </Section>

        <Section title="12. Links to Other Websites">
          <Para>Our platform may contain links to external websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies separately.</Para>
        </Section>

        <Section title="13. Changes to This Policy">
          <Para>We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or via a notice in the platform. The updated policy will take effect 14 days after notification. Continued use of the platform after that date constitutes acceptance.</Para>
        </Section>

        <Section title="14. Contact Us">
          <Para>For any privacy questions, data requests, or concerns, please contact:</Para>
          <div style={{
            marginTop: 16,
            padding: '20px 24px',
            background: '#faf6ef',
            border: `1.5px solid ${Pborder}`,
            fontSize: 14,
            lineHeight: 1.8,
            color: Pmuted,
          }}>
            <strong style={{ color: P, display: 'block', marginBottom: 4 }}>ICP Diagnostic</strong>
            Nairobi, Kenya<br />
            <a href="mailto:support@idealicp.com" style={{ color: P, fontWeight: 600 }}>support@idealicp.com</a><br />
            <a href="https://idealicp.com" style={{ color: P }}>idealicp.com</a>
          </div>
        </Section>

      </div>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${Pborder}`,
        padding: '32px 24px',
        textAlign: 'center',
        fontSize: 13,
        color: Pmuted,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
          <Link href="/" style={{ color: Pmuted, textDecoration: 'none' }}>Home</Link>
          <Link href="/privacy" style={{ color: P, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: Pmuted, textDecoration: 'none' }}>Terms</Link>
          <Link href="/about" style={{ color: Pmuted, textDecoration: 'none' }}>About</Link>
        </div>
        <p style={{ margin: 0 }}>Copyright {new Date().getFullYear()} ICP Diagnostic. All rights reserved.</p>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{
        fontFamily: "'PolySans Median', -apple-system, system-ui, sans-serif",
        fontSize: 18,
        fontWeight: 700,
        color: '#18110a',
        margin: '0 0 16px',
        paddingBottom: 10,
        borderBottom: '1.5px solid rgba(24,17,10,0.12)',
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </section>
  )
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: 0,
      fontSize: 15,
      lineHeight: 1.8,
      color: 'rgba(24,17,10,0.6)',
    }}>
      {children}
    </p>
  )
}
