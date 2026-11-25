// The four plans as shown on the new pages. Keep in step with
// src/app/pricing/page.tsx: every line describes something a plan includes today.
export const PLANS = [
  {
    name: 'Free', price: 'KES 0', per: '', pick: false, cta: 'Start free',
    forWho: 'See what is wrong before you spend anything.',
    items: ['One diagnosis: 10 questions, about 3 minutes', 'Your score out of 100, or a launch plan', 'Your top problems', '3 fixes for this week, with the words for the first', 'One free 20 minute call with Eugene'],
  },
  {
    name: 'Starter', price: 'KES 6,500', per: 'a month', pick: true, cta: 'Start free',
    forWho: 'For a business running its own ads that wants them watched.',
    items: ['The full report and the whole fix plan', 'The words to paste for every fix', 'Google keywords and words to block, ready to upload', 'Your spreadsheets turned into Meta files', 'Your cost per inquiry tracked every week', 'A written note from Eugene every month', 'Message Eugene from your dashboard'],
  },
  {
    name: 'Pro', price: 'KES 13,000', per: 'a month', pick: false, cta: 'Start free',
    forWho: 'For a business spending more, that wants Eugene closer.',
    items: ['Everything in Starter', 'A campaign setup plan, reviewed by Eugene', 'One hands-on session a month', 'An onboarding call with Eugene', 'Up to 20 diagnoses a month'],
  },
  {
    name: 'Agency', price: 'KES 26,000', per: 'a month', pick: false, cta: 'Start free',
    forWho: 'For agencies and consultants running ads for several clients.',
    items: ['Everything in Pro', 'Unlimited diagnoses, one for each client', 'Up to 4 hands-on sessions a month', 'A strategy call with Eugene every month'],
  },
]
