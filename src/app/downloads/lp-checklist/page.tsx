'use client'

import Link from 'next/link'
import { ArrowRight, Download } from 'lucide-react'

const Warm   = '#faf6ef'
const Dark   = '#18110a'
const Orange = '#e8330a'
const Muted  = 'rgba(24,17,10,0.5)'
const Border = 'rgba(24,17,10,0.12)'
const font   = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB  = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

const SECTIONS = [
  {
    title: 'Above the Fold',
    items: [
      { label: 'Value proposition clear in 5 seconds',       why: 'Visitors decide within 5 seconds whether to stay. If your headline doesn\'t tell them exactly what you do and for whom, they leave.' },
      { label: 'Primary CTA visible without scrolling',       why: 'The action you want visitors to take should never require effort to find. Scrolling is a friction point.' },
      { label: 'Headline matches the ad that brought them',   why: 'Message match between ad and landing page is one of the strongest predictors of conversion rate.' },
      { label: 'No navigation menu to distract visitors',     why: 'Every navigation link is an exit. Dedicated landing pages consistently outperform pages with full site navigation.' },
      { label: 'Hero image supports the message',             why: 'Imagery should reinforce your value proposition, not just look nice. Relevant visuals increase comprehension speed.' },
    ],
  },
  {
    title: 'Form Friction',
    items: [
      { label: 'Fewer than 5 form fields',                   why: 'Every additional field reduces conversion rate by approximately 11%. Only ask for what you genuinely need.' },
      { label: 'No required fields that aren\'t essential',   why: 'Requiring a phone number on a content download form can cut conversion by 30%.' },
      { label: 'No account creation required to convert',     why: 'Forcing account creation before the user has seen value is one of the highest-impact friction points.' },
      { label: 'Payment information not required upfront',    why: 'Collecting payment details before demonstrating value creates anxiety and abandonment.' },
      { label: 'Progress indicator if multi-step',           why: 'Progress indicators reduce drop-off on multi-step forms by showing users they\'re close to the end.' },
      { label: 'Error messages are helpful not generic',      why: '"Invalid input" tells users nothing. Specific error messages recover 20-30% of failed form submissions.' },
    ],
  },
  {
    title: 'Trust Signals',
    items: [
      { label: 'Testimonials visible above fold',             why: 'Social proof shown early reduces the cognitive effort required to trust your offer.' },
      { label: 'Company logos or client names shown',         why: 'Recognizable logos borrow trust from established brands. Even small client names add credibility.' },
      { label: 'Security badges if collecting payment',       why: 'Visible security indicators reduce anxiety at the point of transaction.' },
      { label: 'Phone number or live chat visible',           why: 'Contact visibility signals that a real business is behind the page, increasing trust.' },
      { label: 'Privacy policy linked near form',            why: 'GDPR and data sensitivity concerns are real. Linking your policy near the form reduces hesitation.' },
    ],
  },
  {
    title: 'Mobile Experience',
    items: [
      { label: 'Page loads in under 3 seconds on mobile',    why: '53% of mobile users abandon pages that take longer than 3 seconds to load. Speed is conversion.' },
      { label: 'CTA button thumb-friendly size (44px+)',      why: 'Small tap targets cause mis-taps and frustration. Apple\'s HIG recommends a minimum of 44x44px.' },
      { label: 'Text readable without zooming',              why: 'Text smaller than 16px forces users to zoom, breaking the reading flow.' },
      { label: 'Form fields large enough to tap easily',     why: 'Tiny form fields on mobile cause input errors and reduce completion rates significantly.' },
      { label: 'No horizontal scrolling required',           why: 'Horizontal scrolling on mobile almost always indicates a layout that wasn\'t tested on device.' },
    ],
  },
  {
    title: 'Messaging Clarity',
    items: [
      { label: 'One clear offer, not multiple options',       why: 'The paradox of choice applies to landing pages. More than one primary CTA dilutes conversion.' },
      { label: 'Benefits stated, not just features',          why: '"Get more leads" converts better than "Advanced targeting algorithm." Outcomes matter more than mechanics.' },
      { label: 'Specific outcomes promised, not vague claims', why: '"Reduce CPA by 30%" is more compelling than "Improve your results." Specificity builds belief.' },
      { label: 'Objections addressed on the page',           why: 'Common objections left unaddressed become silent reasons not to convert. Answer them proactively.' },
      { label: 'Urgency or scarcity if genuine',             why: 'If you have a real deadline or limited availability, stating it increases action. Don\'t fabricate it.' },
      { label: 'Next step crystal clear after conversion',   why: 'What happens after they click? Telling users what to expect next reduces post-form anxiety.' },
    ],
  },
]

const SCORE_BANDS = [
  { range: '0-13',  label: 'Critical friction', desc: 'Your page is losing most visitors. Start with form fields and above-the-fold clarity.' },
  { range: '14-20', label: 'Moderate friction', desc: 'Significant improvement possible. Focus on trust signals and mobile experience.' },
  { range: '21-27', label: 'Low friction', desc: 'You\'re in optimisation phase. Small improvements compound into meaningful gains.' },
]

export default function LPChecklistPage() {
  return (
    <main style={{ fontFamily: fontB, color: Dark, background: Warm, minHeight: '100vh' }}>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        @media print {
          .no-print { display: none !important; }
          main { background: #fff !important; }
        }
      `}</style>

      {/* Nav */}
      <div className="no-print" style={{ borderBottom: `1.5px solid ${Border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(250,246,239,0.96)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <div style={{ width: 24, height: 24, background: Orange }} />
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: Dark }}>ICP Diagnostic</span>
        </Link>
        <button onClick={() => window.print()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: `1.5px solid ${Border}`, padding: '11px 18px', minHeight: 44, fontFamily: fontB, fontSize: 13, fontWeight: 600, color: Dark, cursor: 'pointer' }}>
          <Download size={14} /> Save PDF
        </button>
      </div>

      {/* Header */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(20px,4vw,40px) 0' }}>
        <span style={{ display: 'inline-block', background: Orange, color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 14px', marginBottom: 20 }}>Free Resource</span>
        <h1 style={{ fontFamily: font, fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: Dark, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 20px' }}>
          Landing Page Friction Checklist
        </h1>
        <p style={{ fontFamily: fontB, fontSize: 17, color: Muted, lineHeight: 1.7, margin: '0 0 8px' }}>
          27 checkpoints covering every major conversion killer. Work through each section and mark off items as you go. Most marketers find at least 8 problems on their first pass.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28, paddingTop: 28, borderTop: `1.5px solid ${Border}` }}>
          {[
            `${SECTIONS.reduce((acc, s) => acc + s.items.length, 0)} checkpoints`,
            '5 sections',
            '10 minutes to complete',
          ].map(stat => (
            <span key={stat} style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: Muted, background: '#fff', border: `1px solid ${Border}`, padding: '5px 14px' }}>{stat}</span>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(20px,4vw,40px)' }}>
        {SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, color: '#fff', background: Dark, padding: '3px 10px' }}>
                {String(si + 1).padStart(2, '0')}
              </span>
              <h2 style={{ fontFamily: font, fontSize: 19, fontWeight: 700, color: Dark, margin: 0, letterSpacing: '-0.01em' }}>{section.title}</h2>
              <span style={{ fontFamily: fontB, fontSize: 12, color: Muted }}>{section.items.length} checkpoints</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.items.map((item, ii) => (
                <div key={ii} style={{ background: '#fff', border: `1.5px solid ${Border}`, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 18, height: 18, border: `1.5px solid ${Border}`, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontFamily: fontB, fontSize: 14, fontWeight: 600, color: Dark, margin: '0 0 4px', lineHeight: 1.4 }}>{item.label}</p>
                    <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, margin: 0, lineHeight: 1.6 }}>
                      <span style={{ fontWeight: 600, color: 'rgba(24,17,10,0.65)' }}>Why it matters: </span>
                      {item.why}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Score guide */}
        <div style={{ background: '#fff', border: `1.5px solid ${Border}`, padding: '32px 36px', marginBottom: 48 }}>
          <h3 style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: Dark, margin: '0 0 20px', letterSpacing: '-0.02em' }}>How did you score?</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SCORE_BANDS.map(band => (
              <div key={band.range} style={{ border: `1.5px solid ${Border}`, padding: '14px 18px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: Orange, flexShrink: 0, minWidth: 44 }}>{band.range}</span>
                <div>
                  <p style={{ fontFamily: fontB, fontSize: 14, fontWeight: 700, color: Dark, margin: '0 0 2px' }}>{band.label}</p>
                  <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, margin: 0, lineHeight: 1.6 }}>{band.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="no-print" style={{ background: Dark, padding: 'clamp(32px,4vw,48px)', textAlign: 'center' }}>
          <p style={{ fontFamily: font, fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Want our AI to audit your landing page automatically?
          </p>
          <p style={{ fontFamily: fontB, fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: '0 0 28px', lineHeight: 1.6 }}>
            The ICP Diagnostic visits your landing page, scores it on 6 dimensions, and tells you exactly what to fix first.
          </p>
          <Link href="/questionnaire"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: Orange, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 700, fontSize: 15, padding: '14px 30px', borderRadius: 6 }}>
            Start Free Diagnosis <ArrowRight size={16} />
          </Link>
          <p style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 14 }}>Free. No ad account access needed.</p>
        </div>
      </div>
    </main>
  )
}
