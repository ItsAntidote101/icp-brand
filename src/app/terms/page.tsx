import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms and Conditions | ICP Diagnostic',
  description: 'Terms and conditions governing your use of ICP Diagnostic and idealicp.com.',
  alternates: { canonical: '/terms' },
}

export const dynamic = 'force-static'

const P       = '#18110a'
const Pmuted  = 'rgba(24,17,10,0.5)'
const Pborder = 'rgba(24,17,10,0.12)'
const font    = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB   = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

const LAST_UPDATED = '22 May 2025'

export default function TermsPage() {
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
          <Link href="/privacy" style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Privacy Policy</Link>
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
          Terms and Conditions
        </h1>
        <p style={{ fontFamily: fontB, fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: 560, margin: '0 auto' }}>
          Last updated: {LAST_UPDATED}. Please read these terms carefully before using ICP Diagnostic.
        </p>
      </section>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,24px) clamp(64px,8vw,120px)' }}>

        <Section title="1. Agreement to These Terms">
          <Para>By accessing or using idealicp.com, creating an account, or purchasing a subscription, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the platform.</Para>
          <Para>These terms apply to all users, whether on the free tier or a paid subscription plan.</Para>
        </Section>

        <Section title="2. About ICP Diagnostic">
          <Para>ICP Diagnostic is a software-as-a-service platform that helps marketing teams identify their ideal customer profile, audit their targeting, and reduce wasted ad spend. The platform is operated by ICP Diagnostic, based in Nairobi, Kenya.</Para>
          <Para>You can reach us at <a href="mailto:info@idealicp.com" style={{ color: P, fontWeight: 600 }}>info@idealicp.com</a>.</Para>
        </Section>

        <Section title="3. Eligibility">
          <Para>You must be at least 18 years old and capable of forming a binding contract to use this platform. By creating an account, you confirm that the information you provide is accurate and that you have the authority to enter into these terms on behalf of any organisation you represent.</Para>
        </Section>

        <Section title="4. Accounts and Authentication">
          <Para>You may create an account using your Google account or a verified email address. You are responsible for maintaining the security of your account and for all activity that occurs under it.</Para>
          <Para>We reserve the right to suspend or terminate accounts that we reasonably believe have been used fraudulently, in violation of these terms, or in a way that harms other users or the platform.</Para>
        </Section>

        <Section title="5. Subscription Plans and Billing">
          <Para>ICP Diagnostic offers a free plan and paid subscription plans (Starter, Pro, and Agency). Paid plans are billed monthly or annually in Kenyan Shillings (KES) unless otherwise stated at checkout.</Para>
          <Para>All payments are processed securely via Paystack. By subscribing, you authorise Paystack to charge your chosen payment method on a recurring basis at the rate displayed at the time of purchase.</Para>
          <Para>Prices may change at any time. We will give you at least 30 days notice before any price change applies to your existing subscription.</Para>
          <Para>Your subscription renews automatically at the end of each billing period. You may cancel at any time from your dashboard, and your access will continue until the end of the current paid period.</Para>
        </Section>

        <Section title="6. Refunds">
          <Para>All payments are non-refundable except where required by applicable law. If you believe a charge was made in error, contact us within 7 days of the charge at <a href="mailto:finance@idealicp.com" style={{ color: P, fontWeight: 600 }}>finance@idealicp.com</a> and we will investigate promptly.</Para>
          <Para>Cancelling a subscription does not entitle you to a refund for any unused portion of the current billing period.</Para>
        </Section>

        <Section title="7. Free Plan Limitations">
          <Para>The free plan provides access to a one-time ICP diagnostic report. Free plan users do not receive ongoing monitoring, competitor research, live landing page assessment, or the subscriber-only intelligence briefings.</Para>
          <Para>We reserve the right to modify or discontinue the free plan at any time with reasonable notice.</Para>
        </Section>

        <Section title="8. Acceptable Use">
          <Para>You agree not to:</Para>
          <ul style={{ margin: '8px 0 0 20px', padding: 0, lineHeight: 1.9, color: Pmuted, fontSize: 15 }}>
            <li>Use the platform for any unlawful purpose or in violation of any applicable regulation</li>
            <li>Reverse engineer, decompile, or attempt to extract the source code of the platform</li>
            <li>Resell, sublicense, or redistribute access to the platform without written permission</li>
            <li>Upload data that you do not have the right to share</li>
            <li>Attempt to gain unauthorised access to any part of the platform or its infrastructure</li>
            <li>Use automated scraping tools, bots, or scripts to extract data from the platform</li>
          </ul>
        </Section>

        <Section title="9. Your Data and Content">
          <Para>You retain ownership of any data, files, or content you upload to the platform (for example, CSV campaign exports). By uploading content, you grant ICP Diagnostic a limited licence to process that content solely for the purpose of generating your diagnostic reports and providing the service.</Para>
          <Para>We do not sell your data to third parties. See our <Link href="/privacy" style={{ color: P, fontWeight: 600 }}>Privacy Policy</Link> for full details on how we handle your information.</Para>
        </Section>

        <Section title="10. Intellectual Property">
          <Para>All content, software, algorithms, report templates, and design elements on the platform are the property of ICP Diagnostic or its licensors. Nothing in these terms grants you any ownership of platform IP.</Para>
          <Para>Reports generated for you are yours to use for your own business purposes. You may not reproduce or redistribute them commercially without permission.</Para>
        </Section>

        <Section title="11. AI-Generated Content">
          <Para>Diagnostic reports and recommendations on the platform are generated using AI and are intended for informational purposes. They do not constitute professional marketing, legal, or financial advice. You are responsible for verifying findings and making your own business decisions.</Para>
          <Para>AI outputs may occasionally contain errors or inaccuracies. We recommend using the reports as a starting point for analysis rather than a definitive conclusion.</Para>
        </Section>

        <Section title="12. Disclaimer of Warranties">
          <Para>ICP Diagnostic is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the platform will be uninterrupted, error-free, or that specific results will be achieved from using it.</Para>
        </Section>

        <Section title="13. Limitation of Liability">
          <Para>To the maximum extent permitted by law, ICP Diagnostic and its directors, employees, and contractors shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the platform, including loss of revenue, data, or business opportunities.</Para>
          <Para>Our total liability to you for any claim arising out of these terms shall not exceed the total fees you paid to us in the 3 months preceding the claim.</Para>
        </Section>

        <Section title="14. Third-Party Services">
          <Para>The platform integrates with third-party services including Google (for authentication), Paystack (for payments), and Resend (for email delivery). Your use of these services is subject to their respective terms and privacy policies. We are not responsible for the practices of any third-party service.</Para>
        </Section>

        <Section title="15. Changes to These Terms">
          <Para>We may update these terms from time to time. When we make material changes, we will notify you by email or via a notice on the platform at least 14 days before the changes take effect. Continued use of the platform after that date constitutes acceptance of the revised terms.</Para>
        </Section>

        <Section title="16. Termination">
          <Para>You may stop using the platform and cancel your account at any time from your dashboard settings.</Para>
          <Para>We may terminate or suspend your account immediately if you breach these terms, fail to pay fees when due, or if we are required to do so by law. On termination, your access to paid features ends immediately, and we may delete your data in accordance with our Privacy Policy.</Para>
        </Section>

        <Section title="17. Governing Law">
          <Para>These terms are governed by the laws of Kenya. Any disputes arising from or relating to these terms shall be subject to the exclusive jurisdiction of the courts of Nairobi, Kenya.</Para>
        </Section>

        <Section title="18. Contact">
          <Para>If you have any questions about these terms, please contact us:</Para>
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
            <a href="mailto:info@idealicp.com" style={{ color: P, fontWeight: 600 }}>info@idealicp.com</a><br />
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
          <Link href="/privacy" style={{ color: Pmuted, textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: P, textDecoration: 'none', fontWeight: 600 }}>Terms</Link>
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
