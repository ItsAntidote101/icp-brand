'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

type QuestionType = 'text' | 'url' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'slider' | 'yesno'

interface Question {
  id: number
  layer: 1 | 2 | 3
  layerName: string
  question: string
  type: QuestionType
  options?: string[]
  placeholder?: string
}

const QUESTIONS: Question[] = [
  // ── Layer 1 · ICP Foundation ──────────────────────────────────────────
  {
    id: 1, layer: 1, layerName: 'ICP Foundation',
    question: 'What does your business do? Describe your core service or product offering.',
    type: 'text',
    placeholder: 'e.g. We help SaaS companies reduce churn through AI-powered customer success…',
  },
  {
    id: 2, layer: 1, layerName: 'ICP Foundation',
    question: 'What industry or vertical do you operate in?',
    type: 'select',
    options: ['SaaS / Software', 'E-commerce / Retail', 'Professional Services', 'Healthcare', 'Finance / Fintech', 'Real Estate', 'Education / EdTech', 'Manufacturing', 'Marketing / Advertising', 'Other'],
  },
  {
    id: 3, layer: 1, layerName: 'ICP Foundation',
    question: 'What is your company\'s annual revenue range?',
    type: 'radio',
    options: ['Under $500K', '$500K – $2M', '$2M – $10M', '$10M – $50M', '$50M+'],
  },
  {
    id: 4, layer: 1, layerName: 'ICP Foundation',
    question: 'How many employees does your company have?',
    type: 'radio',
    options: ['1 – 10', '11 – 50', '51 – 200', '201 – 1,000', '1,000+'],
  },
  {
    id: 5, layer: 1, layerName: 'ICP Foundation',
    question: 'Which geographic regions do you currently serve?',
    type: 'text',
    placeholder: 'e.g. North America, EMEA, Global…',
  },
  {
    id: 6, layer: 1, layerName: 'ICP Foundation',
    question: 'What is the typical company size of your best customers?',
    type: 'radio',
    options: ['Solopreneur / Freelancer', 'Small (2 – 20 employees)', 'Mid-market (21 – 200 employees)', 'Enterprise (201 – 1,000)', 'Large Enterprise (1,000+)'],
  },
  {
    id: 7, layer: 1, layerName: 'ICP Foundation',
    question: 'What industry or vertical do your best customers come from?',
    type: 'text',
    placeholder: 'e.g. B2B SaaS startups, regional law firms, independent e-commerce brands…',
  },
  {
    id: 8, layer: 1, layerName: 'ICP Foundation',
    question: 'What was the core problem your best customers had before working with you?',
    type: 'textarea',
    placeholder: 'Describe the pain in their words, not yours…',
  },
  {
    id: 9, layer: 1, layerName: 'ICP Foundation',
    question: 'How did your best customers typically discover you?',
    type: 'radio',
    options: ['Paid ads', 'Organic search / SEO', 'Referral / word of mouth', 'Social media (organic)', 'Cold outreach', 'Events / conferences', 'Partnership or agency'],
  },
  {
    id: 10, layer: 1, layerName: 'ICP Foundation',
    question: 'What keeps your best customers loyal? What makes them stay and not leave?',
    type: 'textarea',
    placeholder: 'Think about the last 3 customers who renewed or expanded their contract…',
  },
  {
    id: 11, layer: 1, layerName: 'ICP Foundation',
    question: 'What is your average deal size?',
    type: 'radio',
    options: ['Under $1,000', '$1,000 – $5,000', '$5,000 – $25,000', '$25,000 – $100,000', '$100,000+'],
  },
  {
    id: 12, layer: 1, layerName: 'ICP Foundation',
    question: 'How long is your typical sales cycle from first contact to closed deal?',
    type: 'radio',
    options: ['Same day', '1 – 7 days', '1 – 4 weeks', '1 – 3 months', '3+ months'],
  },
  {
    id: 13, layer: 1, layerName: 'ICP Foundation',
    question: 'What job titles hold the final buying decision at your best customer accounts?',
    type: 'text',
    placeholder: 'e.g. VP of Marketing, Founder / CEO, Head of Operations…',
  },

  // ── Layer 2 · Targeting Mismatch ──────────────────────────────────────
  {
    id: 14, layer: 2, layerName: 'Targeting Mismatch',
    question: 'Describe who you currently believe your ideal customer is.',
    type: 'textarea',
    placeholder: 'Be specific — company size, role, industry, annual budget, primary goal…',
  },
  {
    id: 15, layer: 2, layerName: 'Targeting Mismatch',
    question: 'Which ad channels are you currently running?',
    type: 'checkbox',
    options: ['Meta (Facebook / Instagram)', 'Google Search', 'Google Display', 'YouTube', 'LinkedIn', 'TikTok', 'Twitter / X', 'Programmatic / Display', 'Retargeting only', 'None — all organic'],
  },
  {
    id: 16, layer: 2, layerName: 'Targeting Mismatch',
    question: 'What is the URL of your main landing page or primary traffic destination?',
    type: 'url',
    placeholder: 'https://yoursite.com/landing-page',
  },
  {
    id: 17, layer: 2, layerName: 'Targeting Mismatch',
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
    id: 18, layer: 2, layerName: 'Targeting Mismatch',
    question: 'Describe your current ad targeting parameters — audiences, keywords, job titles, etc.',
    type: 'textarea',
    placeholder: 'e.g. Lookalike of buyers, keyword "CRM software", job title "Marketing Manager", retargeting visitors…',
  },
  {
    id: 19, layer: 2, layerName: 'Targeting Mismatch',
    question: 'What is your total monthly ad spend across all channels?',
    type: 'radio',
    options: ['Under $1,000', '$1,000 – $5,000', '$5,000 – $20,000', '$20,000 – $100,000', '$100,000+'],
  },
  {
    id: 20, layer: 2, layerName: 'Targeting Mismatch',
    question: 'How is your budget currently allocated across channels?',
    type: 'textarea',
    placeholder: 'e.g. 60% Meta, 30% Google Search, 10% LinkedIn…',
  },
  {
    id: 21, layer: 2, layerName: 'Targeting Mismatch',
    question: 'How many leads did you generate in the last 3 months?',
    type: 'number',
    placeholder: 'Total leads across all channels',
  },
  {
    id: 22, layer: 2, layerName: 'Targeting Mismatch',
    question: 'Of those leads, how many converted to paying customers?',
    type: 'number',
    placeholder: 'Total new customers in the same period',
  },
  {
    id: 23, layer: 2, layerName: 'Targeting Mismatch',
    question: 'What is your current cost per acquisition (CPA)?',
    type: 'text',
    placeholder: 'e.g. $340 per customer, or "not tracked"',
  },
  {
    id: 24, layer: 2, layerName: 'Targeting Mismatch',
    question: 'Do the leads you\'re currently generating match the profile of your best customers?',
    type: 'yesno',
  },

  // ── Layer 3 · Funnel Friction ─────────────────────────────────────────
  {
    id: 25, layer: 3, layerName: 'Funnel Friction',
    question: 'What is the primary CTA (call-to-action) on your main landing page?',
    type: 'text',
    placeholder: 'e.g. "Book a Free Call", "Start Free Trial", "Get a Quote"…',
  },
  {
    id: 26, layer: 3, layerName: 'Funnel Friction',
    question: 'How many steps does a visitor go through before becoming a lead or customer?',
    type: 'number',
    placeholder: 'e.g. 3',
  },
  {
    id: 27, layer: 3, layerName: 'Funnel Friction',
    question: 'What form fields do you currently require from leads?',
    type: 'textarea',
    placeholder: 'e.g. First name, Email, Phone, Company name, Monthly budget, Message…',
  },
  {
    id: 28, layer: 3, layerName: 'Funnel Friction',
    question: 'How easy is your landing page to use on a mobile device?',
    type: 'slider',
  },
  {
    id: 29, layer: 3, layerName: 'Funnel Friction',
    question: 'What percentage of visitors who reach your form actually complete and submit it?',
    type: 'number',
    placeholder: 'Enter as a whole number, e.g. 12 for 12%',
  },
  {
    id: 30, layer: 3, layerName: 'Funnel Friction',
    question: 'Have you ever tested reducing the number of form fields to improve completion rates?',
    type: 'yesno',
  },
  {
    id: 31, layer: 3, layerName: 'Funnel Friction',
    question: 'What trust signals do you currently show on your landing page?',
    type: 'textarea',
    placeholder: 'e.g. Client logos, testimonials, case study results, money-back guarantee, certifications…',
  },
  {
    id: 32, layer: 3, layerName: 'Funnel Friction',
    question: 'How clearly does your landing page communicate why you\'re different from every alternative?',
    type: 'slider',
  },
]

// Layer 1: Q1–13 (13q), Layer 2: Q14–24 (11q), Layer 3: Q25–32 (8q)
const LAYER_STARTS = [0, 13, 24]
const LAYER_LENGTHS = [13, 11, 8]

const LOADING_STEPS = [
  { label: 'Saving your answers...',                   sublabel: 'Storing your responses securely',              duration: 2000  },
  { label: 'Visiting your landing page...',            sublabel: 'Analysing your funnel and offer',              duration: 5000  },
  { label: 'Researching your industry benchmarks...', sublabel: 'Finding CPC/CPA data for your region',         duration: 10000 },
  { label: 'Analysing your competitors...',           sublabel: 'Mapping the competitive landscape',            duration: 10000 },
  { label: 'Generating your diagnostic report...',    sublabel: 'Compiling findings and recommendations',       duration: Infinity },
]

type Answers = Record<number, string | string[] | number>

// ── Input Components ──────────────────────────────────────────────────────────

function TextInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus
      className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-base outline-none transition-colors"
    />
  )
}

function UrlInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm select-none pointer-events-none">
        🔗
      </span>
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
        className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-slate-500 text-base outline-none transition-colors"
      />
    </div>
  )
}

function TextareaInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      autoFocus
      className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-base outline-none resize-none transition-colors leading-relaxed"
    />
  )
}

function SelectInput({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[#12121c] border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-white text-base outline-none transition-colors cursor-pointer appearance-none"
    >
      <option value="" disabled>Select an option…</option>
      {options.map(o => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function RadioInput({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`flex items-center gap-3 w-full px-5 py-3.5 rounded-xl border text-left text-sm font-medium transition-all ${
            value === o
              ? 'border-indigo-500 bg-indigo-600/20 text-white'
              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:bg-white/[0.06]'
          }`}
        >
          <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            value === o ? 'border-indigo-400' : 'border-slate-600'
          }`}>
            {value === o && <span className="w-2 h-2 rounded-full bg-indigo-400 block" />}
          </span>
          {o}
        </button>
      ))}
    </div>
  )
}

function CheckboxInput({ value, onChange, options }: {
  value: string[]
  onChange: (v: string[]) => void
  options: string[]
}) {
  const toggle = (o: string) => {
    onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o])
  }
  return (
    <div className="flex flex-col gap-3">
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={`flex items-center gap-3 w-full px-5 py-3.5 rounded-xl border text-left text-sm font-medium transition-all ${
            value.includes(o)
              ? 'border-indigo-500 bg-indigo-600/20 text-white'
              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:bg-white/[0.06]'
          }`}
        >
          <span className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
            value.includes(o) ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'
          }`}>
            {value.includes(o) && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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

function NumberInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={0}
      autoFocus
      className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-base outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
}

function SliderInput({ value, onChange, question }: {
  value: number
  onChange: (v: number) => void
  question: string
}) {
  const labels =
    question.includes('mobile') || question.includes('Mobile')
      ? ['Very difficult', 'Perfectly smooth']
      : ['Not at all clear', 'Crystal clear']

  return (
    <div className="py-4">
      <div className="flex justify-between text-xs text-slate-500 mb-3">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(value - 1) / 9 * 100}%, #1e1e2e ${(value - 1) / 9 * 100}%, #1e1e2e 100%)`,
        }}
      />
      <div className="flex justify-between mt-3">
        <div className="text-xs text-slate-500 flex gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className={`w-5 text-center ${i + 1 === value ? 'text-indigo-400 font-bold' : 'text-slate-600'}`}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>
      <p className="text-center mt-3 text-2xl font-bold text-indigo-400">{value}<span className="text-sm text-slate-500 font-normal"> / 10</span></p>
    </div>
  )
}

function YesNoInput({ value, onChange }: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-4">
      {['Yes', 'No'].map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-5 rounded-xl border text-base font-semibold transition-all ${
            value === opt
              ? opt === 'Yes'
                ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300'
                : 'border-red-500 bg-red-600/20 text-red-300'
              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:bg-white/[0.06]'
          }`}
        >
          {opt === 'Yes' ? '✓  Yes' : '✕  No'}
        </button>
      ))}
    </div>
  )
}

// ── Welcome step email input ──────────────────────────────────────────────────

function EmailFieldInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="email"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-base outline-none transition-colors"
    />
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface Profile {
  name: string
  email: string
  company: string
}

export default function QuestionnairePage() {
  const router = useRouter()
  const [step, setStep] = useState<'welcome' | 'questions'>('welcome')
  const [profile, setProfile] = useState<Profile>({ name: '', email: '', company: '' })
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [visible, setVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([])

  // Fade in on mount and on each question change
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [current])

  const q = QUESTIONS[current]
  const totalQ = QUESTIONS.length
  const layerIdx = q.layer - 1
  const layerStart = LAYER_STARTS[layerIdx]
  const layerLen = LAYER_LENGTHS[layerIdx]
  const posInLayer = current - layerStart + 1
  const overallPct = Math.round(((current + 1) / totalQ) * 100)

  const rawAnswer = answers[q.id]
  const textVal = (rawAnswer as string) ?? ''
  const arrVal = (rawAnswer as string[]) ?? []
  const numVal = typeof rawAnswer === 'number' ? rawAnswer : 5

  const canProceed = (): boolean => {
    const a = answers[q.id]
    if (q.type === 'checkbox') return Array.isArray(a) && a.length > 0
    if (q.type === 'slider') return true // always has default
    if (q.type === 'yesno' || q.type === 'radio' || q.type === 'select') return typeof a === 'string' && a.length > 0
    if (q.type === 'number') return typeof a === 'string' && a.length > 0
    return typeof a === 'string' && a.trim().length > 0
  }

  const setAnswer = useCallback((val: string | string[] | number) => {
    setAnswers(prev => ({ ...prev, [q.id]: val }))
  }, [q.id])

  // Initialize slider default
  useEffect(() => {
    if (q.type === 'slider' && answers[q.id] === undefined) {
      setAnswers(prev => ({ ...prev, [q.id]: 5 }))
    }
  }, [q.id, q.type, answers])

  const navigate = (dir: 'next' | 'back') => {
    setVisible(false)
    setTimeout(() => {
      setCurrent(c => dir === 'next' ? c + 1 : c - 1)
    }, 160)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setApiError('')
    setLoadingStep(1)

    // Advance steps on a schedule matching expected server timing
    let elapsed = 0
    LOADING_STEPS.slice(0, -1).forEach((step, i) => {
      elapsed += step.duration as number
      const t = setTimeout(() => setLoadingStep(i + 2), elapsed)
      timerRefs.current.push(t)
    })

    try {
      const qRes = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, profile }),
      })
      const qData = await qRes.json()
      if (!qRes.ok) throw new Error(qData.error || 'Failed to save questionnaire')

      const dRes = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaireId: qData.id, responses: answers, profile }),
      })
      const dData = await dRes.json()
      if (!dRes.ok) throw new Error(dData.error || 'Failed to generate diagnostic')

      router.push(`/report/${dData.id}`)
    } catch (err) {
      timerRefs.current.forEach(clearTimeout)
      timerRefs.current = []
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
      setLoadingStep(0)
    }
  }

  const isLast = current === totalQ - 1

  const layerColors: Record<number, string> = {
    1: 'bg-indigo-500',
    2: 'bg-violet-500',
    3: 'bg-purple-500',
  }
  const layerTextColors: Record<number, string> = {
    1: 'text-indigo-400',
    2: 'text-violet-400',
    3: 'text-purple-400',
  }
  const layerBorderColors: Record<number, string> = {
    1: 'border-indigo-500/40',
    2: 'border-violet-500/40',
    3: 'border-purple-500/40',
  }

  const welcomeValid =
    profile.name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) &&
    profile.company.trim().length > 0

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-3xl mx-auto w-full">
          <a href="/" className="text-sm font-bold tracking-tight text-white">
            ICP<span className="text-indigo-400">Diagnostic</span>
          </a>
          <span className="text-xs text-slate-500 font-medium">Step 1 of 4</span>
        </header>

        <div className="flex-1 flex flex-col justify-start max-w-3xl mx-auto w-full px-6 pt-10 pb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest mb-4 px-2.5 py-1 rounded-full border border-indigo-500/40 text-indigo-400 bg-white/[0.03] w-fit">
            Welcome
          </span>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
            Let&apos;s get started — tell us about yourself
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            This takes 5 minutes. Your answers are used only to personalise your diagnostic report.
          </p>

          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Jane Smith"
                autoFocus
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-base outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Email Address
              </label>
              <EmailFieldInput
                value={profile.email}
                onChange={v => setProfile(p => ({ ...p, email: v }))}
                placeholder="jane@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={profile.company}
                onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
                placeholder="Acme Inc."
                onKeyDown={e => { if (e.key === 'Enter' && welcomeValid) setStep('questions') }}
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-base outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep('questions')}
            disabled={!welcomeValid}
            className={`sm:w-fit px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
              welcomeValid
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-95'
                : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
            }`}
          >
            Get Started →
          </button>

          {!welcomeValid && (profile.name || profile.email || profile.company) && (
            <p className="mt-3 text-xs text-slate-600">
              Fill in all three fields to continue.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <header className="border-b border-white/10 px-6 py-4 flex items-center max-w-3xl mx-auto w-full">
          <a href="/" className="text-sm font-bold tracking-tight text-white">
            ICP<span className="text-indigo-400">Diagnostic</span>
          </a>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
          <div className="w-full max-w-md">

            {/* Heading */}
            <div className="mb-10 text-center">
              <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full border border-indigo-500/40 text-indigo-400 bg-white/[0.03]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                Running Deep Diagnostic
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Analysing your ICP&hellip;
              </h2>
              <p className="text-slate-500 text-sm">
                We&apos;re doing real research — this takes about 30 seconds
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-2.5">
              {LOADING_STEPS.map((step, i) => {
                const stepNum = i + 1
                const isDone    = loadingStep > stepNum
                const isCurrent = loadingStep === stepNum
                const isPending = loadingStep < stepNum
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-500 ${
                      isCurrent
                        ? 'border-indigo-500/40 bg-indigo-600/10'
                        : isDone
                        ? 'border-white/[0.06] bg-white/[0.02]'
                        : 'border-white/[0.04] bg-transparent'
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                      {isDone && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {isCurrent && (
                        <svg className="animate-spin w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      )}
                      {isPending && (
                        <div className="w-5 h-5 rounded-full border border-white/10 bg-white/[0.03]" />
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-tight ${
                        isCurrent ? 'text-white' : isDone ? 'text-slate-500' : 'text-slate-700'
                      }`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-indigo-400/70 mt-0.5">{step.sublabel}</p>
                      )}
                      {isDone && (
                        <p className="text-xs text-emerald-600/80 mt-0.5">Complete</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Overall progress bar */}
            <div className="mt-8">
              <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(4, ((loadingStep - 1) / LOADING_STEPS.length) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-700 mt-2 text-center tabular-nums">
                Step {Math.min(loadingStep, LOADING_STEPS.length)} of {LOADING_STEPS.length}
              </p>
            </div>

            {apiError && (
              <p className="mt-6 text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
                {apiError}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">

      {/* Top bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-3xl mx-auto w-full">
        <a href="/" className="text-sm font-bold tracking-tight text-white">
          ICP<span className="text-indigo-400">Diagnostic</span>
        </a>
        <span className="text-xs text-slate-500 font-medium">
          Question {current + 1} of {totalQ}
        </span>
      </header>

      {/* Progress */}
      <div className="max-w-3xl mx-auto w-full px-6 pt-6">
        {/* Layer tabs */}
        <div className="flex gap-2 mb-4">
          {([1, 2, 3] as const).map(l => (
            <div
              key={l}
              className={`flex-1 flex flex-col gap-1.5 px-3 py-2 rounded-lg border transition-all ${
                l === q.layer
                  ? `border ${layerBorderColors[l]} bg-white/[0.04]`
                  : l < q.layer
                  ? 'border-white/10 bg-white/[0.02]'
                  : 'border-white/5 bg-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${
                  l === q.layer ? layerTextColors[l] : l < q.layer ? 'text-slate-500' : 'text-slate-700'
                }`}>
                  {l < q.layer ? '✓ ' : ''}Layer {l}
                </span>
                {l === q.layer && (
                  <span className={`text-[10px] font-medium ${layerTextColors[l]}`}>
                    {posInLayer}/{layerLen}
                  </span>
                )}
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${layerColors[l]}`}
                  style={{
                    width: l < q.layer
                      ? '100%'
                      : l === q.layer
                      ? `${(posInLayer / layerLen) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Overall progress */}
        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{overallPct}%</span>
        </div>
        <p className="text-xs text-slate-600 mb-6">
          Layer {q.layer} of 3 — {q.layerName}
        </p>
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col justify-start max-w-3xl mx-auto w-full px-6 pb-16">
        <div
          className="transition-all duration-150"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          {/* Question number badge */}
          <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest mb-4 px-2.5 py-1 rounded-full border ${layerBorderColors[q.layer]} ${layerTextColors[q.layer]} bg-white/[0.03]`}>
            <span>Q{q.id}</span>
            <span className="text-white/20">·</span>
            <span>{q.layerName}</span>
          </div>

          {/* Question text */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 leading-snug">
            {q.question}
          </h2>

          {/* Input */}
          <div className="mb-8">
            {q.type === 'text' && (
              <TextInput value={textVal} onChange={setAnswer} placeholder={q.placeholder} />
            )}
            {q.type === 'url' && (
              <UrlInput value={textVal} onChange={setAnswer} placeholder={q.placeholder} />
            )}
            {q.type === 'textarea' && (
              <TextareaInput value={textVal} onChange={setAnswer} placeholder={q.placeholder} />
            )}
            {q.type === 'select' && (
              <SelectInput value={textVal} onChange={setAnswer} options={q.options!} />
            )}
            {q.type === 'radio' && (
              <RadioInput value={textVal} onChange={setAnswer} options={q.options!} />
            )}
            {q.type === 'checkbox' && (
              <CheckboxInput value={arrVal} onChange={setAnswer} options={q.options!} />
            )}
            {q.type === 'number' && (
              <NumberInput value={textVal} onChange={setAnswer} placeholder={q.placeholder} />
            )}
            {q.type === 'slider' && (
              <SliderInput value={numVal} onChange={setAnswer} question={q.question} />
            )}
            {q.type === 'yesno' && (
              <YesNoInput value={textVal} onChange={setAnswer} />
            )}
          </div>

          {/* Nav */}
          <div className="flex items-center gap-3">
            {current > 0 && (
              <button
                type="button"
                onClick={() => navigate('back')}
                className="px-5 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-medium hover:border-white/20 hover:text-white transition-all"
              >
                ← Back
              </button>
            )}

            {!isLast ? (
              <button
                type="button"
                onClick={() => navigate('next')}
                disabled={!canProceed()}
                className={`flex-1 sm:flex-none sm:min-w-[160px] py-3 px-6 rounded-xl text-sm font-semibold transition-all ${
                  canProceed()
                    ? `bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-95`
                    : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                }`}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed()}
                className={`flex-1 sm:flex-none sm:min-w-[200px] py-3 px-8 rounded-xl text-sm font-semibold transition-all ${
                  canProceed()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95'
                    : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                }`}
              >
                Get My Diagnosis →
              </button>
            )}
          </div>

          {apiError && (
            <p className="mt-4 text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
              {apiError}
            </p>
          )}

          {/* Skip hint for non-required */}
          {!isLast && !canProceed() && (
            <p className="mt-3 text-xs text-slate-600">
              Answer to continue — all questions help improve your diagnosis.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
