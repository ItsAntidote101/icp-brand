'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Questions that are stable across re-diagnoses and can be pre-filled.
// Excluded (always fresh): Q9 ad channels, Q12 targeting, Q13 spend, Q14 leads, Q15 lead quality, Q18 mobile, Q20 differentiation, Q21 close rate
const STABLE_QUESTION_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 16, 17, 19, 22, 23, 24, 25, 26])

type QuestionType = 'text' | 'url' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'slider' | 'yesno'

type Answers = Record<number, string | string[] | number>

interface Question {
  id: number
  layer: 1 | 2 | 3
  layerName: string
  question: string
  type: QuestionType
  options?: string[]
  placeholder?: string
  showIf?: (answers: Answers) => boolean
}

const QUESTIONS: Question[] = [
  // Layer 1 - ICP Foundation
  {
    id: 1, layer: 1, layerName: 'ICP Foundation',
    question: 'What does your business do? Describe your core product or service offering.',
    type: 'text',
    placeholder: 'e.g. We help SaaS companies reduce churn through AI-powered customer success...',
  },
  {
    id: 2, layer: 1, layerName: 'ICP Foundation',
    question: 'What industry or vertical do you operate in?',
    type: 'select',
    options: ['SaaS / Software', 'E-commerce / Retail', 'Professional Services', 'Healthcare', 'Finance / Fintech', 'Real Estate', 'Education / EdTech', 'Manufacturing', 'Marketing / Advertising', 'Consumer Goods / FMCG', 'Other'],
  },
  {
    id: 23, layer: 1, layerName: 'ICP Foundation',
    question: 'How does your business primarily make sales?',
    type: 'radio',
    options: [
      'B2B - We sell to other businesses',
      'E-commerce / DTC - We sell products directly to consumers online',
      'B2C Services - We sell services directly to individual consumers',
      'SaaS / Subscription - We sell software or recurring digital access',
      'Local / In-person - Customers visit us or we visit them',
      'Marketplace / Platform - We connect buyers and sellers',
    ],
  },
  // B2B only: company size
  {
    id: 3, layer: 1, layerName: 'ICP Foundation',
    question: 'What is the typical company size of your best customers?',
    type: 'radio',
    options: ['Solopreneur / Freelancer', 'Small (2-20 employees)', 'Mid-market (21-200 employees)', 'Enterprise (201-1,000)', 'Large Enterprise (1,000+)'],
    showIf: isB2B,
  },
  // B2C only: customer demographics
  {
    id: 24, layer: 1, layerName: 'ICP Foundation',
    question: 'Describe your ideal customer. Who are they as a person?',
    type: 'textarea',
    placeholder: 'e.g. Women aged 28-45, household income KES 150k+/month, interested in wellness, primarily shop on mobile...',
    showIf: isB2C,
  },
  {
    id: 4, layer: 1, layerName: 'ICP Foundation',
    question: 'What core problem or desire did your best customers have before working with you?',
    type: 'textarea',
    placeholder: 'Describe it in their words, not yours...',
  },
  {
    id: 5, layer: 1, layerName: 'ICP Foundation',
    question: 'How did your best customers typically discover you?',
    type: 'radio',
    options: ['Paid ads', 'Organic search / SEO', 'Referral / word of mouth', 'Social media (organic)', 'Cold outreach', 'Events / conferences', 'Partnership or agency'],
  },
  // B2B only: deal size
  {
    id: 6, layer: 1, layerName: 'ICP Foundation',
    question: 'What is your average deal size per client?',
    type: 'radio',
    options: ['Under $1,000', '$1,000-$5,000', '$5,000-$25,000', '$25,000-$100,000', '$100,000+'],
    showIf: isB2B,
  },
  // B2C only: average order/transaction value
  {
    id: 25, layer: 1, layerName: 'ICP Foundation',
    question: 'What is your average order or transaction value per customer?',
    type: 'radio',
    options: ['Under KES 1,000', 'KES 1,000-5,000', 'KES 5,000-20,000', 'KES 20,000-100,000', 'KES 100,000+'],
    showIf: isB2C,
  },
  // B2B only: job titles
  {
    id: 7, layer: 1, layerName: 'ICP Foundation',
    question: 'What job titles hold the final buying decision at your best customer accounts?',
    type: 'text',
    placeholder: 'e.g. VP of Marketing, Founder / CEO, Head of Operations...',
    showIf: isB2B,
  },
  // B2C only: purchase triggers
  {
    id: 26, layer: 1, layerName: 'ICP Foundation',
    question: 'What typically triggers a purchase decision for your best customers?',
    type: 'textarea',
    placeholder: 'e.g. Seasonal events, a specific life milestone, price drop, seeing a review, influencer recommendation...',
    showIf: isB2C,
  },

  // Layer 2 - Targeting Mismatch
  {
    id: 8, layer: 2, layerName: 'Targeting Mismatch',
    question: 'Describe who you currently believe your ideal customer is.',
    type: 'textarea',
    placeholder: 'Be specific: demographics, goals, pain points, where they spend time online...',
  },
  {
    id: 9, layer: 2, layerName: 'Targeting Mismatch',
    question: 'Which ad channels are you currently running?',
    type: 'checkbox',
    options: ['Meta (Facebook / Instagram)', 'Google Search', 'Google Display', 'YouTube', 'LinkedIn', 'TikTok', 'Twitter / X', 'Programmatic / Display', 'Retargeting only', 'None, all organic'],
  },
  {
    id: 10, layer: 2, layerName: 'Targeting Mismatch',
    question: 'What is the URL of your main landing page or primary traffic destination?',
    type: 'url',
    placeholder: 'https://yoursite.com/landing-page',
  },
  {
    id: 11, layer: 2, layerName: 'Targeting Mismatch',
    question: 'What is the primary geographic region you are targeting with ads?',
    type: 'select',
    options: [
      'North America (US/Canada)',
      'East Africa (Kenya, Tanzania, Uganda)',
      'West Africa (Nigeria, Ghana)',
      'South Africa',
      'UK & Ireland',
      'Europe (non-UK)',
      'Middle East',
      'Southeast Asia',
      'South Asia (India/Pakistan)',
      'Latin America',
      'Australia & New Zealand',
      'Global/Multiple Regions',
    ],
  },
  {
    id: 12, layer: 2, layerName: 'Targeting Mismatch',
    question: 'Describe your current ad targeting setup. What audiences, interests, or keywords are you using?',
    type: 'textarea',
    placeholder: 'e.g. Lookalike of buyers, interest "fitness", keyword "accounting software", retargeting past visitors...',
  },
  {
    id: 13, layer: 2, layerName: 'Targeting Mismatch',
    question: 'What is your total monthly ad spend across all channels?',
    type: 'radio',
    options: ['Under $1,000', '$1,000-$5,000', '$5,000-$20,000', '$20,000-$100,000', '$100,000+'],
  },
  {
    id: 14, layer: 2, layerName: 'Targeting Mismatch',
    question: 'How many new paying customers or qualified leads did you acquire in the last 3 months?',
    type: 'number',
    placeholder: 'Total across all channels',
  },
  {
    id: 15, layer: 2, layerName: 'Targeting Mismatch',
    question: 'Do the people responding to your ads match the profile of your best customers?',
    type: 'yesno',
  },
  {
    id: 21, layer: 2, layerName: 'Targeting Mismatch',
    question: 'What percentage of interested prospects or visitors convert into paying customers?',
    type: 'number',
    placeholder: 'e.g. 3 (for 3%)',
  },
  {
    id: 22, layer: 2, layerName: 'Targeting Mismatch',
    question: 'What is the average lifetime value of a paying customer to your business?',
    type: 'radio',
    options: ['Under KES 10,000', 'KES 10,000-50,000', 'KES 50,000-200,000', 'KES 200,000-1,000,000', 'Over KES 1,000,000'],
  },

  // Layer 3 - Funnel Friction
  {
    id: 16, layer: 3, layerName: 'Funnel Friction',
    question: 'What is the primary call-to-action on your main landing or product page?',
    type: 'text',
    placeholder: 'e.g. "Book a Free Call", "Add to Cart", "Start Free Trial", "Get a Quote"...',
  },
  {
    id: 17, layer: 3, layerName: 'Funnel Friction',
    question: 'What must a customer do or provide before completing a purchase or booking?',
    type: 'textarea',
    placeholder: 'e.g. Fill a 5-field form, create an account, call for pricing, 3-step checkout, upload documents...',
  },
  {
    id: 18, layer: 3, layerName: 'Funnel Friction',
    question: 'How easy is your landing or product page to use on a mobile device?',
    type: 'slider',
  },
  {
    id: 19, layer: 3, layerName: 'Funnel Friction',
    question: 'What trust signals do you currently show on your landing or product page?',
    type: 'textarea',
    placeholder: 'e.g. Customer reviews, client logos, testimonials, case study results, money-back guarantee, certifications...',
  },
  {
    id: 20, layer: 3, layerName: 'Funnel Friction',
    question: 'How clearly does your page communicate why you are different from every alternative?',
    type: 'slider',
  },
]

function isB2B(answers: Answers): boolean {
  const m = answers[23] as string | undefined
  return !!m && m.startsWith('B2B')
}
function isB2C(answers: Answers): boolean {
  const m = answers[23] as string | undefined
  return !!m && !m.startsWith('B2B')
}
function getVisibleQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter(q => !q.showIf || q.showIf(answers))
}

const XP_PER_Q = 10

const LAYER_UNLOCK: Record<1 | 2, { next: string; description: string }> = {
  1: {
    next: 'Targeting Mismatch',
    description: 'We will now compare your ideal customer against who you are actually targeting with ads.',
  },
  2: {
    next: 'Funnel Friction',
    description: 'Final layer. We will audit your landing page and conversion funnel for friction points.',
  },
}

const LOADING_STEPS = [
  { label: 'Saving your answers...',               sublabel: 'Storing your responses securely',        duration: 2000     },
  { label: 'Visiting your landing page...',         sublabel: 'Analysing your funnel and offer',        duration: 5000     },
  { label: 'Researching industry benchmarks...',    sublabel: 'Finding CPC/CPA data for your region',   duration: 10000    },
  { label: 'Analysing your competitors...',         sublabel: 'Mapping the competitive landscape',      duration: 10000    },
  { label: 'Generating your diagnostic report...',  sublabel: 'Compiling findings and recommendations', duration: Infinity },
]

// ── Input components ──────────────────────────────────────────────────────────

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus
      className="w-full bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] focus:border-[#e8330a] rounded px-4 py-3.5 text-[#201515] placeholder-[#939084] text-base outline-none transition-colors" />
  )
}

function UrlInput({ value, onChange, onBlur, placeholder }: { value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder?: string }) {
  return (
    <input type="url" value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} autoFocus
      className="w-full bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] focus:border-[#e8330a] rounded px-4 py-3.5 text-[#201515] placeholder-[#939084] text-base outline-none transition-colors" />
  )
}

function TextareaInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} autoFocus
      className="w-full bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] focus:border-[#e8330a] rounded px-4 py-3.5 text-[#201515] placeholder-[#939084] text-base outline-none resize-none transition-colors leading-relaxed" />
  )
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-[#fff] border border-[#c5c0b1] focus:border-[#e8330a] rounded px-4 py-3.5 text-[#201515] text-base outline-none transition-colors cursor-pointer appearance-none">
      <option value="" disabled>Select an option...</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function RadioInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`flex items-center gap-3 w-full px-5 py-3.5 rounded border text-left text-sm font-medium transition-all ${value === o ? 'border-[#e8330a] bg-[#e8330a]/20 text-[#201515]' : 'border-[#c5c0b1] bg-white text-[#605d52] hover:border-white/25 hover:bg-[rgba(201,192,177,0.18)]'}`}>
          <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${value === o ? 'border-[#e8330a]' : 'border-[#c5c0b1]'}`}>
            {value === o && <span className="w-2 h-2 rounded-full bg-[#e8330a] block" />}
          </span>
          {o}
        </button>
      ))}
    </div>
  )
}

function CheckboxInput({ value, onChange, options }: { value: string[]; onChange: (v: string[]) => void; options: string[] }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o])
  return (
    <div className="flex flex-col gap-3">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={`flex items-center gap-3 w-full px-5 py-3.5 rounded border text-left text-sm font-medium transition-all ${value.includes(o) ? 'border-[#e8330a] bg-[#e8330a]/20 text-[#201515]' : 'border-[#c5c0b1] bg-white text-[#605d52] hover:border-white/25 hover:bg-[rgba(201,192,177,0.18)]'}`}>
          <span className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${value.includes(o) ? 'border-[#e8330a] bg-[#e8330a]' : 'border-[#c5c0b1]'}`}>
            {value.includes(o) && (
              <svg className="w-2.5 h-2.5 text-[#201515]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          {o}
        </button>
      ))}
    </div>
  )
}

function NumberInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={0} autoFocus
      className="w-full bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] focus:border-[#e8330a] rounded px-4 py-3.5 text-[#201515] placeholder-[#939084] text-base outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
  )
}

function SliderInput({ value, onChange, question }: { value: number; onChange: (v: number) => void; question: string }) {
  const labels = question.toLowerCase().includes('mobile')
    ? ['Very difficult', 'Perfectly smooth']
    : ['Not at all clear', 'Crystal clear']
  return (
    <div className="py-4">
      <div className="flex justify-between text-xs text-[#939084] mb-3">
        <span>{labels[0]}</span><span>{labels[1]}</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full"
        style={{ background: `linear-gradient(to right,#e8330a 0%,#e8330a ${(value - 1) / 9 * 100}%,#c5c0b1 ${(value - 1) / 9 * 100}%,#1e1e2e 100%)` }} />
      <div className="flex justify-between mt-3">
        <div className="text-xs text-[#939084] flex gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={`w-5 text-center ${i + 1 === value ? 'text-[#e8330a] font-bold' : 'text-[#939084]'}`}>{i + 1}</span>
          ))}
        </div>
      </div>
      <p className="text-center mt-3 text-2xl font-bold text-[#e8330a]">{value}<span className="text-sm text-[#939084] font-normal"> / 10</span></p>
    </div>
  )
}

function YesNoInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-4">
      {['Yes', 'No'].map(opt => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`flex-1 py-5 rounded border text-base font-semibold transition-all ${
            value === opt
              ? opt === 'Yes' ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300' : 'border-red-500 bg-red-600/20 text-red-300'
              : 'border-[#c5c0b1] bg-white text-[#605d52] hover:border-white/25 hover:bg-[rgba(201,192,177,0.18)]'
          }`}>
          {opt === 'Yes' ? '✓  Yes' : '✕  No'}
        </button>
      ))}
    </div>
  )
}

// ── XP Badge ─────────────────────────────────────────────────────────────────

function XpBadge({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8330a]/20 border border-[#e8330a]/30">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5" fill="#818cf8" />
      </svg>
      <span className="text-[11px] font-bold text-[#e8330a] tabular-nums">{xp} XP</span>
    </div>
  )
}

// ── Score arc gauge ───────────────────────────────────────────────────────────

function ScoreArc({ progress }: { progress: number }) {
  const r   = 72
  const cx  = 100
  const cy  = 92
  const arc = Math.PI * r        // half-circle circumference ~226
  const pct = Math.min(1, Math.max(0, progress))
  const offset = arc * (1 - pct)

  return (
    <svg viewBox="0 0 200 110" className="w-full max-w-[200px] mx-auto">
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#e8330a" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      {/* background arc */}
      <path
        d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" strokeLinecap="round"
      />
      {/* progress arc */}
      <path
        d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none" stroke="url(#arcGrad)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={arc} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* centre label */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="26" fontWeight="700" fontFamily="system-ui">
        {pct === 0 ? '-' : `${Math.round(pct * 100)}`}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="10" fontFamily="system-ui">
        {pct === 0 ? 'answer to begin' : pct < 1 ? '% complete' : 'analysing...'}
      </text>
    </svg>
  )
}

// ── Right panel: welcome screen ───────────────────────────────────────────────

function WelcomePanel({ diagCount }: { diagCount: number }) {
  const items = [
    { label: 'ICP Health Score', sub: 'A 0-100 score showing targeting precision' },
    { label: 'Critical findings', sub: 'Ranked by revenue impact, each with a fix' },
    { label: 'Monthly waste estimate', sub: 'KES value of budget going to wrong audience' },
    { label: 'CAC before and after', sub: 'Projected cost-per-customer after top fixes' },
    { label: 'Quick wins', sub: '3 actions you can take this week' },
  ]
  return (
    <div className="flex flex-col gap-6 py-8 px-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#e8330a] mb-3">What you will receive</p>
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#e8330a]/25 border border-[#e8330a]/40 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-[#e8330a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#201515] leading-snug">{item.label}</p>
                <p className="text-xs text-[#939084] leading-snug mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample report preview (stylised) */}
      <div className="rounded border border-[#c5c0b1] bg-white p-4 overflow-hidden relative">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#939084] mb-3">Sample report</p>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#e8330a]/20 border border-[#e8330a]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-black text-[#e8330a]">74</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#201515]">ICP Health Score</p>
            <p className="text-[10px] text-amber-400">3 critical findings</p>
          </div>
        </div>
        <div className="space-y-2">
          {['Audience mismatch costing KES 41,000/mo', 'Landing page CTA misaligned with ICP intent', 'Targeting too broad, 63% budget wasted'].map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/60 flex-shrink-0" />
              <p className="text-[11px] text-[#605d52] leading-snug">{line}</p>
            </div>
          ))}
        </div>
        {/* subtle blur overlay to suggest "preview" */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#201515] to-transparent" />
      </div>

      {/* Social proof */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#c5c0b1]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-[#605d52]">
            <span className="font-bold text-[#201515] tabular-nums">{diagCount.toLocaleString()}+</span> diagnoses run
          </span>
        </div>
        <p className="text-xs text-[#939084]">Average waste found: <span className="text-[#201515] font-semibold">KES 47,000/mo</span></p>
        <p className="text-xs text-[#939084]">Takes 5 minutes. Free. No credit card.</p>
      </div>
    </div>
  )
}

// ── Right panel: question screen ──────────────────────────────────────────────

function QuestionPanel({
  answers,
  current,
  diagCount,
  layer1Count,
  layer2Count,
  layer3Count,
  layer1Done,
  layer2Done,
}: {
  answers: Answers
  current: number
  diagCount: number
  layer1Count: number
  layer2Count: number
  layer3Count: number
  layer1Done: boolean
  layer2Done: boolean
}) {
  const totalQ      = layer1Count + layer2Count + layer3Count
  const answered    = Object.keys(answers).length
  const progress    = answered / totalQ

  const layer2Start = layer1Count
  const layer3Start = layer1Count + layer2Count

  const layer1Pct   = Math.min(1, Math.max(0, current < layer2Start ? (current - 0) / layer1Count : 1))
  const layer2Pct   = Math.min(1, Math.max(0, current < layer2Start ? 0 : current < layer3Start ? (current - layer2Start) / layer2Count : 1))
  const layer3Pct   = Math.min(1, Math.max(0, current < layer3Start ? 0 : (current - layer3Start) / layer3Count))

  const metrics = [
    {
      label: 'ICP Health Score',
      unit: '/ 100',
      state: !answered ? 'locked' : layer1Done ? 'ready' : 'scanning',
      stateLabel: !answered ? '-' : layer1Done ? 'Foundation mapped' : 'Mapping profile...',
      color: 'text-[#e8330a]',
    },
    {
      label: 'Monthly Waste Estimate',
      unit: 'KES',
      state: !layer1Done ? 'locked' : layer2Done ? 'ready' : 'scanning',
      stateLabel: !layer1Done ? '-' : layer2Done ? 'Spend data captured' : 'Estimating waste...',
      color: 'text-[#e8330a]',
    },
    {
      label: 'CAC Projection',
      unit: 'KES',
      state: !layer2Done ? 'locked' : layer3Pct > 0 ? 'ready' : 'scanning',
      stateLabel: !layer2Done ? '-' : layer3Pct > 0 ? 'Funnel data captured' : 'Calculating CAC...',
      color: 'text-[#e8330a]',
    },
  ]

  const layers = [
    { num: 1, name: 'ICP Foundation',     pct: layer1Pct, done: layer1Done },
    { num: 2, name: 'Targeting Mismatch', pct: layer2Pct, done: layer2Done },
    { num: 3, name: 'Funnel Friction',    pct: layer3Pct, done: layer3Pct >= 1 },
  ]

  return (
    <div className="flex flex-col gap-5 py-8 px-6">

      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8330a] opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e8330a]" />
        </span>
        <span className="text-xs font-semibold text-[#e8330a]">Report in progress</span>
      </div>

      {/* Score arc */}
      <div className="text-center">
        <ScoreArc progress={progress} />
        <p className="text-[10px] text-[#939084] mt-1">Score unlocks on submission</p>
      </div>

      {/* Metric preview cards */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#939084] mb-3">Report metrics</p>
        <div className="flex flex-col gap-2">
          {metrics.map((m, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-500 ${m.state === 'locked' ? 'border-white/[0.05] bg-transparent' : m.state === 'scanning' ? 'border-[rgba(232,51,10,0.2)] bg-[#e8330a]/[0.06]' : 'border-emerald-500/25 bg-emerald-600/[0.06]'}`}>
              <div>
                <p className={`text-[11px] font-semibold leading-snug ${m.state === 'locked' ? 'text-[#939084]' : 'text-[#201515]'}`}>{m.label}</p>
                <p className={`text-[10px] mt-0.5 ${m.state === 'locked' ? 'text-[#939084]' : m.state === 'scanning' ? m.color : 'text-emerald-400'}`}>{m.stateLabel}</p>
              </div>
              <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${m.state === 'locked' ? 'border-[#c5c0b1] bg-transparent' : m.state === 'scanning' ? 'border-[#e8330a]/40 bg-[#e8330a]/20' : 'border-emerald-500/40 bg-emerald-600/20'}`}>
                {m.state === 'locked' && <span className="text-slate-700 text-[8px]">•</span>}
                {m.state === 'scanning' && (
                  <svg className="animate-spin w-2.5 h-2.5 text-[#e8330a]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {m.state === 'ready' && (
                  <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Layer progress */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#939084] mb-3">Analysis layers</p>
        <div className="flex flex-col gap-2.5">
          {layers.map(l => (
            <div key={l.num}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-medium ${l.pct > 0 ? 'text-[#605d52]' : 'text-[#939084]'}`}>
                  {l.done ? '✓ ' : ''}{l.name}
                </span>
                <span className={`text-[10px] tabular-nums ${l.pct > 0 ? 'text-[#605d52]' : 'text-[#939084]'}`}>
                  {Math.round(l.pct * 100)}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-[rgba(201,192,177,0.18)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${l.num === 1 ? 'bg-[#e8330a]' : l.num === 2 ? 'bg-[#e8330a]' : 'bg-[#e8330a]'}`}
                  style={{ width: `${l.pct * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-[#c5c0b1]">
        <p className="text-xs text-[#939084]">
          <span className="text-[#201515] font-semibold tabular-nums">{diagCount.toLocaleString()}+</span> businesses diagnosed
        </p>
        <p className="text-xs text-[#939084]">Average waste found: <span className="text-[#201515] font-semibold">KES 47,000/mo</span></p>
      </div>
    </div>
  )
}

// ── Layer completion screen ───────────────────────────────────────────────────

function LayerCompleteScreen({
  layer,
  xpEarned,
  onContinue,
}: {
  layer: 1 | 2
  xpEarned: number
  onContinue: () => void
}) {
  const [countedXp, setCountedXp] = useState(0)
  const [ready, setReady] = useState(false)
  const info = LAYER_UNLOCK[layer]

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!ready) return
    const target = xpEarned
    const step = Math.ceil(target / 30)
    let current = 0
    const interval = setInterval(() => {
      current = Math.min(current + step, target)
      setCountedXp(current)
      if (current >= target) clearInterval(interval)
    }, 40)
    return () => clearInterval(interval)
  }, [ready, xpEarned])

  const layerColors: Record<number, { ring: string; bg: string; text: string; badge: string }> = {
    1: { ring: 'border-[#e8330a]/60', bg: 'bg-[#e8330a]/15', text: 'text-[#e8330a]', badge: 'bg-[#e8330a]/20 border-[#e8330a]/40' },
    2: { ring: 'border-[#e8330a]/60', bg: 'bg-[rgba(201,192,177,0.25)]', text: 'text-[#605d52]', badge: 'bg-[rgba(232,51,10,0.08)] border-[#e8330a]/40' },
  }
  const c = layerColors[layer]

  return (
    <div className="min-h-screen bg-[#fffefb] text-[#201515] flex flex-col">
      <style>{`
        @keyframes scaleIn { from { transform: scale(0.7); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse-ring { 0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3) } 50% { box-shadow: 0 0 0 16px rgba(99,102,241,0) } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      <header className="border-b border-[#c5c0b1] px-6 py-4 flex items-center justify-between max-w-3xl mx-auto w-full">
        <a href="/" className="text-sm font-bold tracking-tight text-[#201515]">ICP<span className="text-[#e8330a]">Diagnostic</span></a>
        <XpBadge xp={xpEarned} />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16 text-center">
        <div style={{ animation: ready ? 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' : 'none' }}>

          <div className={`mx-auto mb-6 w-20 h-20 rounded-full border-2 ${c.ring} ${c.bg} flex items-center justify-center`}
            style={{ animation: ready ? 'pulse-ring 2s ease-in-out infinite' : 'none' }}>
            <svg className={`w-9 h-9 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div style={{ animation: ready ? 'fadeUp 0.4s 0.1s ease both' : 'none' }}>
            <span className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full border ${c.badge} ${c.text} mb-4`}>
              Layer {layer} Complete
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#201515] mb-2">
              {info.next === 'Targeting Mismatch' ? 'ICP Foundation' : 'Targeting Mismatch'} locked in.
            </h2>
            <p className="text-[#605d52] text-sm max-w-xs mx-auto leading-relaxed">
              Your foundation answers are saved. Your score is building.
            </p>
          </div>

          <div style={{ animation: ready ? 'fadeUp 0.4s 0.2s ease both' : 'none' }}
            className="mt-8 mb-8 inline-flex flex-col items-center gap-1 px-8 py-5 rounded border border-[#c5c0b1] bg-white">
            <span className="text-xs text-[#939084] uppercase tracking-widest font-semibold">XP Earned</span>
            <span className="text-4xl font-black text-[#e8330a] tabular-nums">+{countedXp}</span>
            <span className="text-xs text-[#939084]">Keep going, diagnosis unlocks at 200 XP</span>
          </div>

          <div style={{ animation: ready ? 'fadeUp 0.4s 0.3s ease both' : 'none' }}
            className="mb-8 max-w-sm mx-auto px-5 py-4 rounded border border-[#c5c0b1] bg-white text-left">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#939084] mb-1">Unlocking next</p>
            <p className="text-sm font-bold text-[#201515] mb-1">{info.next}</p>
            <p className="text-xs text-[#605d52] leading-relaxed">{info.description}</p>
          </div>

          <div style={{ animation: ready ? 'fadeUp 0.4s 0.4s ease both' : 'none' }}>
            <button type="button" onClick={onContinue}
              className="px-10 py-3.5 rounded bg-[#e8330a] hover:bg-[#e8330a] text-[#201515] font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-[#e8330a]/25">
              Unlock Layer {layer + 1} →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface Profile { name: string; email: string; company: string }

type PrefillPayload = {
  prefill: {
    profile: Profile
    answers: Record<string, unknown>
  } | null
}

export default function QuestionnairePage() {
  const router = useRouter()
  const [step,          setStep]          = useState<'welcome' | 'questions'>('welcome')
  const [profile,       setProfile]       = useState<Profile>({ name: '', email: '', company: '' })
  const [current,       setCurrent]       = useState(0)
  const [answers,       setAnswers]       = useState<Answers>({})
  const [prefillIds,    setPrefillIds]    = useState<Set<number>>(new Set())
  const [prefillBanner, setPrefillBanner] = useState(false)
  const [prefillReady,  setPrefillReady]  = useState(false)
  const [visible,       setVisible]       = useState(false)
  const [submitting,    setSubmitting]    = useState(false)
  const [apiError,      setApiError]      = useState('')
  const [loadingStep,   setLoadingStep]   = useState(0)
  const [layerDone,     setLayerDone]     = useState<null | 1 | 2>(null)
  const [urlPreviewBanner, setUrlPreviewBanner] = useState(false)
  const [diagCount,     setDiagCount]     = useState(9400)
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([])

  const xp = Object.keys(answers).length * XP_PER_Q

  // Fetch live diagnosis count
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then((d: { count?: number } | null) => { if (d?.count) setDiagCount(d.count) })
      .catch(() => {})
  }, [])

  // Pre-fill from last diagnosis for returning authenticated users
  useEffect(() => {
    fetch('/api/questionnaire/last-answers')
      .then(r => r.ok ? r.json() : null)
      .then((d: PrefillPayload | null) => {
        if (!d?.prefill) return
        const { profile: p, answers: a } = d.prefill
        // Pre-fill profile if we have the data
        if (p.name || p.email || p.company) {
          setProfile({ name: p.name, email: p.email, company: p.company })
        }
        // If they have previous answers, skip welcome and pre-fill stable questions
        if (Object.keys(a).length > 0 && p.name && p.email && p.company) {
          setAnswers(a as Answers)
          setPrefillIds(new Set(Object.keys(a).map(Number)))
          setPrefillBanner(true)
          setStep('questions')
        } else if (p.name && p.email && p.company) {
          // Has account but no previous answers -- skip welcome (profile is known)
          setStep('questions')
        }
      })
      .catch(() => {})
      .finally(() => setPrefillReady(true))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [current])

  const visible_qs = getVisibleQuestions(answers)
  const q          = visible_qs[current]
  const totalQ     = visible_qs.length
  const isLast     = current === visible_qs.length - 1

  const layer1Vis  = visible_qs.filter(vq => vq.layer === 1)
  const layer2Vis  = visible_qs.filter(vq => vq.layer === 2)
  const layer3Vis  = visible_qs.filter(vq => vq.layer === 3)
  const layer1Start = 0
  const layer2Start = layer1Vis.length
  const layer3Start = layer1Vis.length + layer2Vis.length
  const layerStarts  = [layer1Start, layer2Start, layer3Start]
  const layerLengths = [layer1Vis.length, layer2Vis.length, layer3Vis.length]

  const layerIdx   = q ? q.layer - 1 : 0
  const layerStart = layerStarts[layerIdx]
  const layerLen   = layerLengths[layerIdx]
  const posInLayer = current - layerStart + 1
  const overallPct = Math.round(((current + 1) / totalQ) * 100)

  const rawAnswer = q ? answers[q.id] : undefined
  const textVal   = (rawAnswer as string)   ?? ''
  const arrVal    = (rawAnswer as string[]) ?? []
  const numVal    = typeof rawAnswer === 'number' ? rawAnswer : 5

  const canProceed = (): boolean => {
    if (!q) return false
    const a = answers[q.id]
    if (q.type === 'checkbox') return Array.isArray(a) && a.length > 0
    if (q.type === 'slider')   return true
    if (q.type === 'yesno' || q.type === 'radio' || q.type === 'select') return typeof a === 'string' && a.length > 0
    if (q.type === 'number')   return typeof a === 'string' && a.length > 0
    return typeof a === 'string' && a.trim().length > 0
  }

  const setAnswer = useCallback((val: string | string[] | number) => {
    setAnswers(prev => {
      const updated = { ...prev, [q.id]: val }
      if (q.id === 23) {
        const nowB2B = (val as string).startsWith('B2B')
        const b2bOnly = [3, 6, 7]
        const b2cOnly = [24, 25, 26]
        ;(nowB2B ? b2cOnly : b2bOnly).forEach(id => delete updated[id])
      }
      return updated
    })
  }, [q?.id])

  const handleUrlBlur = useCallback(async () => {
    const url = (answers[10] as string) ?? ''
    if (!url || !url.startsWith('http')) return
    try {
      const res  = await fetch(`/api/fetch-url-preview?url=${encodeURIComponent(url)}`)
      if (!res.ok) return
      const data = await res.json() as { title?: string; description?: string; h1?: string }
      const prefill = data.description || data.h1 || data.title || ''
      if (prefill && !answers[1]) {
        setAnswers(prev => ({ ...prev, [1]: prefill }))
        setUrlPreviewBanner(true)
      }
    } catch { /* non-fatal */ }
  }, [answers])

  useEffect(() => {
    if (q && q.type === 'slider' && answers[q.id] === undefined) {
      setAnswers(prev => ({ ...prev, [q.id]: 5 }))
    }
  }, [q?.id, q?.type, answers])

  const navigate = (dir: 'next' | 'back') => {
    setVisible(false)
    setTimeout(() => {
      if (dir === 'next') {
        const nextIdx = current + 1
        if (nextIdx < visible_qs.length) {
          const nextLayer = visible_qs[nextIdx].layer
          if (nextLayer !== q.layer && (q.layer === 1 || q.layer === 2)) {
            setLayerDone(q.layer as 1 | 2)
            return
          }
        }
        setCurrent(c => c + 1)
      } else {
        setCurrent(c => c - 1)
      }
    }, 160)
  }

  const handleLayerContinue = () => {
    setLayerDone(null)
    setVisible(false)
    setTimeout(() => setCurrent(c => c + 1), 80)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setApiError('')
    setLoadingStep(1)

    let elapsed = 0
    LOADING_STEPS.slice(0, -1).forEach((s, i) => {
      elapsed += s.duration as number
      const t = setTimeout(() => setLoadingStep(i + 2), elapsed)
      timerRefs.current.push(t)
    })

    try {
      const qRes  = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, profile }),
      })
      const qData = await qRes.json()
      if (!qRes.ok) throw new Error(qData.error || 'Failed to save questionnaire')

      const dRes  = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaireId: qData.id, responses: answers, profile }),
      })
      const dData = await dRes.json()
      if (!dRes.ok) throw new Error(dData.error || 'Failed to generate diagnostic')

      localStorage.setItem('dashboard_email', profile.email)
      if (profile.name) localStorage.setItem('dashboard_name', profile.name)
      router.push(`/report/${dData.id}`)
    } catch (err) {
      timerRefs.current.forEach(clearTimeout)
      timerRefs.current = []
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
      setLoadingStep(0)
    }
  }

  const layerColors = {
    bar:    { 1: 'bg-[#e8330a]',        2: 'bg-[#e8330a]',        3: 'bg-[#e8330a]'        },
    text:   { 1: 'text-[#e8330a]',      2: 'text-[#e8330a]',      3: 'text-[#e8330a]'      },
    border: { 1: 'border-[#e8330a]/40', 2: 'border-[#e8330a]/40', 3: 'border-[#e8330a]/40' },
  }

  const welcomeValid =
    profile.name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) &&
    profile.company.trim().length > 0

  // ── Prefill loading (prevents flash of welcome screen for returning users) ──
  if (!prefillReady) {
    return (
      <div className="min-h-screen bg-[#fffefb] flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-[#e8330a]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  // ── Layer completion screen ──────────────────────────────────────────────
  if (layerDone !== null) {
    const xpEarned = Object.keys(answers).length * XP_PER_Q
    return <LayerCompleteScreen layer={layerDone} xpEarned={xpEarned} onContinue={handleLayerContinue} />
  }

  // ── Welcome screen ───────────────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-[#fffefb] text-[#201515] flex flex-col">
        <style>{`@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`}</style>

        <header className="border-b border-[#c5c0b1] px-6 py-4 flex items-center justify-between max-w-[1100px] mx-auto w-full">
          <a href="/" className="text-sm font-bold tracking-tight text-[#201515]">ICP<span className="text-[#e8330a]">Diagnostic</span></a>
          <span className="text-xs text-[#939084] font-medium">Step 1 of 4</span>
        </header>

        <div className="flex flex-1 max-w-[1100px] mx-auto w-full">

          {/* Left: form */}
          <div className="flex-1 flex flex-col justify-start px-6 pt-10 pb-16 lg:max-w-[580px]">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest mb-4 px-2.5 py-1 rounded-full border border-[#e8330a]/40 text-[#e8330a] bg-white w-fit">
              Welcome
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#201515] mb-4 leading-snug">
              Let&apos;s get started, tell us about yourself
            </h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {['3 layers', '22 questions', '5 minutes', 'Instant results'].map(chip => (
                <span key={chip} className="inline-block text-xs font-semibold text-[#e8330a] bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] rounded-full px-3 py-1">{chip}</span>
              ))}
            </div>
            <p className="text-[#605d52] text-sm mb-8">
              Your answers are used only to personalise your diagnostic report.
            </p>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#939084] mb-2">Full Name</label>
                <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="Jane Smith" autoFocus
                  className="w-full bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] focus:border-[#e8330a] rounded px-4 py-3.5 text-[#201515] placeholder-[#939084] text-base outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#939084] mb-2">Email Address</label>
                <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  placeholder="jane@company.com"
                  className="w-full bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] focus:border-[#e8330a] rounded px-4 py-3.5 text-[#201515] placeholder-[#939084] text-base outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#939084] mb-2">Company Name</label>
                <input type="text" value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
                  placeholder="Acme Inc." onKeyDown={e => { if (e.key === 'Enter' && welcomeValid) setStep('questions') }}
                  className="w-full bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] focus:border-[#e8330a] rounded px-4 py-3.5 text-[#201515] placeholder-[#939084] text-base outline-none transition-colors" />
              </div>
            </div>

            <button type="button" onClick={() => setStep('questions')} disabled={!welcomeValid}
              className={`sm:w-fit px-8 py-3 rounded text-sm font-semibold transition-all ${welcomeValid ? 'bg-[#e8330a] hover:bg-[#e8330a] text-[#201515] shadow-lg shadow-[#e8330a]/25 active:scale-95' : 'bg-[rgba(201,192,177,0.18)] text-[#939084] cursor-not-allowed border border-[rgba(201,192,177,0.25)]'}`}>
              Get Started →
            </button>
            {!welcomeValid && (profile.name || profile.email || profile.company) && (
              <p className="mt-3 text-xs text-[#939084]">Fill in all three fields to continue.</p>
            )}
          </div>

          {/* Right: what you will get panel */}
          <aside className="hidden lg:flex flex-col w-[340px] flex-shrink-0 border-l border-[#c5c0b1] overflow-y-auto">
            <WelcomePanel diagCount={diagCount} />
          </aside>
        </div>
      </div>
    )
  }

  // ── Loading / analysis screen ────────────────────────────────────────────
  if (submitting) {
    return (
      <div className="min-h-screen bg-[#fffefb] text-[#201515] flex flex-col">
        <header className="border-b border-[#c5c0b1] px-6 py-4 flex items-center max-w-3xl mx-auto w-full">
          <a href="/" className="text-sm font-bold tracking-tight text-[#201515]">ICP<span className="text-[#e8330a]">Diagnostic</span></a>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center">
              <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full border border-[#e8330a]/40 text-[#e8330a] bg-white">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8330a] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e8330a]" />
                </span>
                Running Deep Diagnostic
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#201515] mb-2">Analysing your ICP&hellip;</h2>
              <p className="text-[#939084] text-sm">We are doing real research, this takes about 30 seconds</p>
            </div>

            <div className="space-y-2.5">
              {LOADING_STEPS.map((s, i) => {
                const num       = i + 1
                const isDone    = loadingStep > num
                const isCurrent = loadingStep === num
                const isPending = loadingStep < num
                return (
                  <div key={i} className={`flex items-center gap-4 px-4 py-3.5 rounded border transition-all duration-500 ${isCurrent ? 'border-[#e8330a]/40 bg-[#e8330a]/10' : isDone ? 'border-[#c5c0b1] bg-[rgba(201,192,177,0.12)]' : 'border-white/[0.04] bg-transparent'}`}>
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                      {isDone && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {isCurrent && (
                        <svg className="animate-spin w-5 h-5 text-[#e8330a]" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      )}
                      {isPending && <div className="w-5 h-5 rounded-full border border-[#c5c0b1] bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-tight ${isCurrent ? 'text-[#201515]' : isDone ? 'text-[#939084]' : 'text-[#939084]'}`}>{s.label}</p>
                      {isCurrent && <p className="text-xs text-[#e8330a]/70 mt-0.5">{s.sublabel}</p>}
                      {isDone    && <p className="text-xs text-emerald-600/80 mt-0.5">Complete</p>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8">
              <div className="h-0.5 bg-[rgba(201,192,177,0.25)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#e8330a] to-[#e8330a] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(4, ((loadingStep - 1) / LOADING_STEPS.length) * 100)}%` }} />
              </div>
              <p className="text-xs text-slate-700 mt-2 text-center tabular-nums">
                Step {Math.min(loadingStep, LOADING_STEPS.length)} of {LOADING_STEPS.length}
              </p>
            </div>

            {apiError && (
              <p className="mt-6 text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">{apiError}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Question screen ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fffefb] text-[#201515] flex flex-col">
      <style>{`@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`}</style>

      <header className="border-b border-[#c5c0b1] px-6 py-4 flex items-center justify-between max-w-[1100px] mx-auto w-full">
        <a href="/" className="text-sm font-bold tracking-tight text-[#201515]">ICP<span className="text-[#e8330a]">Diagnostic</span></a>
        <div className="flex items-center gap-3">
          <XpBadge xp={xp} />
          <span className="text-xs text-[#939084] font-medium tabular-nums">Q{current + 1}/{totalQ}</span>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1100px] mx-auto w-full">

        {/* Left: progress + question */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Progress */}
          <div className="px-6 pt-6">
            <div className="flex gap-2 mb-4">
              {([1, 2, 3] as const).map(l => (
                <div key={l} className={`flex-1 flex flex-col gap-1.5 px-3 py-2 rounded-lg border transition-all ${l === q.layer ? `border ${layerColors.border[l]} bg-[rgba(201,192,177,0.18)]` : l < q.layer ? 'border-[#c5c0b1] bg-[rgba(201,192,177,0.12)]' : 'border-[rgba(201,192,177,0.25)] bg-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${l === q.layer ? layerColors.text[l] : l < q.layer ? 'text-[#939084]' : 'text-[#939084]'}`}>
                      {l < q.layer ? '✓ ' : ''}Layer {l}
                    </span>
                    {l === q.layer && (
                      <span className={`text-[10px] font-medium ${layerColors.text[l]}`}>{posInLayer}/{layerLen}</span>
                    )}
                  </div>
                  <div className="h-1 rounded-full bg-[rgba(201,192,177,0.25)] overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${layerColors.bar[l]}`}
                      style={{ width: l < q.layer ? '100%' : l === q.layer ? `${(posInLayer / layerLen) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-1">
              <div className="flex-1 h-1 bg-[rgba(201,192,177,0.25)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#e8330a] to-[#e8330a] rounded-full transition-all duration-500"
                  style={{ width: `${overallPct}%` }} />
              </div>
              <span className="text-xs text-[#939084] tabular-nums w-8 text-right">{overallPct}%</span>
            </div>
            <p className="text-xs text-[#939084] mb-6">Layer {q.layer} of 3, {q.layerName}</p>
          </div>

          {/* Question card */}
          <div className="flex-1 px-6 pb-16">
            <div className="transition-all duration-150" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}>

              {prefillBanner && (
                <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded border border-[#c5c0b1] bg-[rgba(201,192,177,0.18)] text-sm text-[#605d52]">
                  <svg className="flex-shrink-0 mt-0.5 w-3.5 h-3.5 text-[#939084]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <p className="flex-1 leading-snug text-xs">Some answers are pre-filled from your last diagnosis. Review each one and update anything that has changed.</p>
                  <button type="button" onClick={() => setPrefillBanner(false)} className="flex-shrink-0 text-[#939084] hover:text-[#605d52] transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border ${layerColors.border[q.layer]} ${layerColors.text[q.layer]} bg-white`}>
                  <span>Q{q.id}</span>
                  <span className="text-[#201515]/20">·</span>
                  <span>{q.layerName}</span>
                </div>
                {prefillIds.has(q.id) && answers[q.id] !== undefined && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#c5c0b1] text-[#939084] bg-white">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Pre-filled
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#201515] mb-6 leading-snug">{q.question}</h2>

              <div className="mb-8">
                {q.type === 'text'     && <TextInput     value={textVal} onChange={setAnswer} placeholder={q.placeholder} />}
                {q.type === 'url'      && <UrlInput      value={textVal} onChange={setAnswer} onBlur={q.id === 10 ? handleUrlBlur : undefined} placeholder={q.placeholder} />}
                {q.type === 'textarea' && <TextareaInput value={textVal} onChange={setAnswer} placeholder={q.placeholder} />}
                {q.type === 'select'   && <SelectInput   value={textVal} onChange={setAnswer} options={q.options!} />}
                {q.type === 'radio'    && <RadioInput    value={textVal} onChange={setAnswer} options={q.options!} />}
                {q.type === 'checkbox' && <CheckboxInput value={arrVal}  onChange={setAnswer} options={q.options!} />}
                {q.type === 'number'   && <NumberInput   value={textVal} onChange={setAnswer} placeholder={q.placeholder} />}
                {q.type === 'slider'   && <SliderInput   value={numVal}  onChange={setAnswer} question={q.question} />}
                {q.type === 'yesno'    && <YesNoInput    value={textVal} onChange={setAnswer} />}
              </div>

              {urlPreviewBanner && (
                <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded border border-[#e8330a]/30 bg-[#e8330a]/10 text-sm text-[#e8330a]">
                  <span className="flex-shrink-0 mt-0.5 text-[#e8330a]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  </span>
                  <p className="flex-1 leading-snug">We found your site, some answers have been pre-filled. Review and edit if needed.</p>
                  <button type="button" onClick={() => setUrlPreviewBanner(false)} className="flex-shrink-0 text-[#e8330a] hover:text-[#e8330a] transition-colors text-base leading-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                {current > 0 && (
                  <button type="button" onClick={() => navigate('back')}
                    className="px-5 py-3 rounded border border-[#c5c0b1] text-[#605d52] text-sm font-medium hover:border-white/20 hover:text-[#201515] transition-all">
                    Back
                  </button>
                )}
                {!isLast ? (
                  <button type="button" onClick={() => navigate('next')} disabled={!canProceed()}
                    className={`flex-1 sm:flex-none sm:min-w-[160px] py-3 px-6 rounded text-sm font-semibold transition-all ${canProceed() ? 'bg-[#e8330a] hover:bg-[#e8330a] text-[#201515] shadow-lg shadow-[#e8330a]/25 active:scale-95' : 'bg-[rgba(201,192,177,0.18)] text-[#939084] cursor-not-allowed border border-[rgba(201,192,177,0.25)]'}`}>
                    Next →
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={!canProceed()}
                    className={`flex-1 sm:flex-none sm:min-w-[200px] py-3 px-8 rounded text-sm font-semibold transition-all ${canProceed() ? 'bg-[#e8330a] hover:bg-[#e8330a] text-[#201515] shadow-lg shadow-[#e8330a]/30 active:scale-95' : 'bg-[rgba(201,192,177,0.18)] text-[#939084] cursor-not-allowed border border-[rgba(201,192,177,0.25)]'}`}>
                    Get My Diagnosis →
                  </button>
                )}
              </div>

              {apiError && (
                <p className="mt-4 text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">{apiError}</p>
              )}
              {isLast && (
                <p className="mt-4 text-xs text-[#939084] text-center">
                  By submitting you agree to our{' '}
                  <a href="/terms" className="underline hover:text-[#605d52] transition-colors">Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" className="underline hover:text-[#605d52] transition-colors">Privacy Policy</a>.
                </p>
              )}
              {!isLast && !canProceed() && (
                <p className="mt-3 text-xs text-[#939084]">Answer to continue, all questions help improve your diagnosis.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: live report preview panel */}
        <aside className="hidden lg:flex flex-col w-[320px] flex-shrink-0 border-l border-[#c5c0b1] overflow-y-auto">
          <QuestionPanel
            answers={answers}
            current={current}
            diagCount={diagCount}
            layer1Count={layer1Vis.length}
            layer2Count={layer2Vis.length}
            layer3Count={layer3Vis.length}
            layer1Done={current >= layer2Start}
            layer2Done={current >= layer3Start}
          />
        </aside>
      </div>
    </div>
  )
}
