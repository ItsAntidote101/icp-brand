import type { ReactNode } from 'react'

// The guides: one page per question a Kenyan business owner actually types
// into a search box. Each opens with the direct answer, then explains it.
// No statistics are quoted here: the advice is how the platforms work and
// arithmetic the reader can check with their own numbers.

export type Guide = {
  slug: string
  question: string            // the page heading, as someone would ask it
  title: string               // browser and search title
  description: string
  updated: string             // ISO date
  answer: string              // the direct answer, shown first
  body: ReactNode
  cta: string
}

export const GUIDES: Guide[] = [
  {
    slug: 'why-facebook-leads-dont-buy',
    question: 'Why are my Facebook leads not buying?',
    title: 'Why your Facebook leads are not buying, and what to fix | Ideal ICP',
    description: 'Facebook leads that never buy are usually a targeting and follow-up problem, not a budget problem. Five causes and what to change this week.',
    updated: '2026-11-20',
    answer: 'Most Facebook leads do not buy because the ad reached people who were curious, not people who were ready, and nothing between the ad and the sale sorted one from the other. It is usually a targeting and follow-up problem, not a budget problem.',
    cta: 'Find out which of these is costing you the most.',
    body: (
      <>
        <h2>The form is too easy to fill in</h2>
        <p>Facebook lead forms fill in a person&apos;s name and number for them. Two taps and they are a &quot;lead&quot;, often without remembering your ad an hour later. A tap is not interest.</p>
        <p><strong>What to change:</strong> add one or two questions the person has to answer themselves, such as their budget range or when they want to buy. Fewer people will finish the form. The ones who do are worth calling.</p>

        <h2>You asked for cheap leads, so you got cheap leads</h2>
        <p>The platform finds whoever is most likely to do the thing you asked for. Ask it for leads at the lowest cost and it will find people who fill in forms easily, which is not the same as people who buy.</p>
        <p><strong>What to change:</strong> stop judging a campaign by cost per lead. Judge it by cost per sale. A campaign with dearer leads that produces customers beats one with cheap leads that produces none.</p>

        <h2>The ad and the follow-up say different things</h2>
        <p>The ad says &quot;pay in instalments&quot;. The first WhatsApp message asks for the full deposit. The buyer feels misled and goes quiet.</p>
        <p><strong>What to change:</strong> read your ad, then read your first reply and your page as if you were the customer. The promise in the ad should be the first thing they see next.</p>

        <h2>You reply too slowly</h2>
        <p>Someone who inquires is interested now. By tomorrow they have asked three other businesses, or forgotten.</p>
        <p><strong>What to change:</strong> reply within minutes during working hours, and set an automatic first reply for the rest.</p>

        <h2>Your ad does not put anyone off</h2>
        <p>An ad that appeals to everybody attracts everybody, including people who could never afford you.</p>
        <p><strong>What to change:</strong> say who it is for and give a price range in the ad itself. Some people will scroll past. That is the ad doing its job.</p>

        <div className="hp-note"><p><strong>Check this week:</strong> count last month&apos;s leads and last month&apos;s sales from ads. If you cannot say how many leads became customers, fix that first. If you can and the number is small, start with the first two changes above.</p></div>
      </>
    ),
  },
  {
    slug: 'cost-per-lead-kenya',
    question: 'What should a lead cost in Kenya?',
    title: 'What should a lead cost in Kenya? How to work out your own number | Ideal ICP',
    description: 'There is no single right cost per lead in Kenya. Here is a two minute way to work out the most you can afford to pay for a lead, in shillings.',
    updated: '2026-11-20',
    answer: 'There is no single right cost per lead in Kenya, and most published figures come from other countries. The number that matters is the most you can afford to pay for a lead, and you can work it out in two minutes from your own sales.',
    cta: 'Get your real cost per customer worked out for you.',
    body: (
      <>
        <h2>The two minute sum</h2>
        <p>You need three numbers from your own business:</p>
        <ol>
          <li><strong>Profit per sale.</strong> What you keep from one customer after your costs, not the selling price.</li>
          <li><strong>How many leads become customers.</strong> Count last month&apos;s leads and last month&apos;s sales.</li>
          <li><strong>How much of that profit you are willing to spend on getting the customer.</strong> That is your decision. If you are unsure, start at a third and adjust.</li>
        </ol>
        <p>Multiply them together. That is the most a lead is worth to you.</p>

        <div className="hp-note"><p><strong>A worked example.</strong> You keep KES 40,000 from each sale. One lead in twenty buys, so each lead is worth KES 2,000 of profit on average. If you will spend up to 30% of that to win the customer, the most you should pay for a lead is <strong>KES 600</strong>.</p></div>

        <h2>Why a cheap lead can be the expensive one</h2>
        <p>A campaign that brings leads at KES 150 each looks better than one at KES 500. But if one in fifty of the cheap leads buys and one in ten of the dearer leads buys, the cheap campaign costs KES 7,500 per customer and the dearer one costs KES 5,000.</p>
        <p>Always carry the sum through to cost per customer before you decide which campaign is working.</p>

        <h2>If you do not know your numbers</h2>
        <p>Most owners do not, and that is the real problem. Start a simple weekly habit: write down what you spent on ads, how many leads came in and how many sales closed. After four weeks you will know more about your ads than most agencies report.</p>

        <h2>When your cost per lead goes up</h2>
        <p>Check three things before you panic: whether you changed the audience, whether the same ad has been running for weeks and people are tired of it, and whether the leads got better. A dearer lead that buys more often is good news.</p>
      </>
    ),
  },
  {
    slug: 'qualify-leads-on-whatsapp',
    question: 'How do I qualify leads on WhatsApp?',
    title: 'How to qualify leads on WhatsApp before you quote | Ideal ICP',
    description: 'Three questions to ask every WhatsApp inquiry before you send a price, plus how to sort and follow up leads so serious buyers do not get lost.',
    updated: '2026-11-20',
    answer: 'Ask three things before you quote: what they need, when they need it, and what budget they have in mind. Serious buyers answer. Browsers go quiet, and you find out in two minutes instead of two weeks.',
    cta: 'See where else serious buyers are slipping away.',
    body: (
      <>
        <h2>The three questions</h2>
        <ol>
          <li><strong>What exactly are you looking for?</strong> &quot;Is it the 2 bedroom or the 3 bedroom you are interested in?&quot;</li>
          <li><strong>When do you need it?</strong> &quot;Are you looking to move this month, or just planning ahead?&quot;</li>
          <li><strong>What budget are you working with?</strong> &quot;So I show you the right options, what range did you have in mind?&quot;</li>
        </ol>
        <p>Ask them one at a time, in a friendly way, before you send a price list. You are not being difficult. You are making sure you do not waste their time either.</p>

        <h2>Reply fast, then sort</h2>
        <p>The WhatsApp Business app lets you set a greeting that goes out automatically, save your common answers as quick replies, and tag chats with labels. Use all three.</p>
        <p>Sort every new chat into one of three labels after the questions:</p>
        <ul>
          <li><strong>Ready now.</strong> Knows what they want, has the budget, wants it soon. Call them today.</li>
          <li><strong>Later.</strong> Interested but not this month. Follow up on a date you agree.</li>
          <li><strong>Not a fit.</strong> Thank them and move on.</li>
        </ul>

        <h2>Give a price range early</h2>
        <p>Hiding the price until the end does not make people more likely to buy. It makes the wrong people stay in the chat longer. A range such as &quot;from KES 4.5M, with a payment plan&quot; lets people sort themselves.</p>

        <h2>Follow up three times, then stop</h2>
        <p>Most &quot;let me get back to you&quot; leads need a nudge. A simple pattern: the next day, three days later and a week later, each time with something useful such as a new photo, a date that is filling up or an answer to a question they asked. After the third, label them Later and let them go.</p>

        <div className="hp-note"><p><strong>What to stop doing:</strong> sending the full price list or brochure to everyone as your first reply. It ends the conversation before you have learned anything about the buyer.</p></div>
      </>
    ),
  },
]

export const guideBySlug = (slug: string) => GUIDES.find(g => g.slug === slug)
