---
path: /pricing
title: Pricing in shillings, paid by M-Pesa or card | Ideal ICP
description: Free diagnosis and one free call. Plans from KES 6,500 a month, paid by M-Pesa or card, one month at a time. Nothing renews on its own. No contract.
question: How much does Ideal ICP cost?
status: ready
links_to: /questionnaire, /services/diagnosis, /services/done-with-you, /contact
---

## hero
eyebrow: Pricing
# From KES 6,500 a month by M-Pesa. Nothing renews on its own.
The diagnosis and one 20 minute call are free, with no card. A plan adds the files, the wording, your weekly numbers and me.
[BUTTON: Start my free diagnosis -> /questionnaire]
[IMAGE: A phone showing an M-Pesa payment confirmation beside a laptop with the dashboard open | 4:3]

## plans

## cards
### How paying works
#### M-Pesa or card
Checkout runs through Paystack. Prices are in Kenya shillings.
#### One month at a time
Nothing renews on its own. A reminder comes a week before your month ends, and you decide whether to pay again.
#### Renew early and the days are added
Pay before your month is up and the new 30 days go on the end of what you already have.
#### Stop any time
There is no contract. If you do not renew, you keep everything until the end of the month you paid for.
#### Start free, choose later
The free diagnosis sets up your account. You pick a plan from your dashboard, or stay free.
[LINK: What the diagnosis covers -> /services/diagnosis]

## cards
### What is not included
#### Running your ads
Ideal ICP does not manage campaigns. If you want full management, message me.
[LINK: Write to Eugene -> /contact]
#### Your ad spend
A plan pays for my work. What you pay Google and Meta is a separate bill, and it stays yours.
#### Artwork, video and websites
You get the words for ads and pages. The pictures and the pages themselves are yours to make.
#### Extra hands-on sessions
One a month on Pro, up to four on Agency, and none on Free or Starter.
[LINK: How sessions work -> /services/done-with-you]
#### A promised number of sales
No plan comes with a guarantee. You get what is listed, as often as it is listed.

## faq
### Questions about plans
#### Why do I start with the free diagnosis?
Because the plans build on it. The diagnosis creates your account and your first report. From there you choose a plan or stay free.
#### Which plan should I pick?
Starter if you run your own ads and want them watched. Pro if you want me to review your campaign setup plan and set one thing up with you each month. Agency if you run ads for several clients.
#### What does the full report add to the free one?
About 10 more questions on your best customer and your follow up, and a check of your landing page if your ads use one. You see every problem and the whole fix plan. It comes with Starter.
#### Can I change plans?
Yes, from your dashboard. If you move up partway through a month you pay only the difference for the days left.
#### Do I pay for the call?
No. One 20 minute call comes with the free diagnosis, if you ask for it.

## band
### Decide after you have seen your report.
Run the diagnosis and talk it through with me if you like. Pay only if you want a plan.
[BUTTON: Start my free diagnosis -> /questionnaire]

## notes
The plans section pulls the four plans from src/app/new/plans.ts. Its Starter line says "cost per lead". The brief asks the copy to say inquiries, so consider "cost per inquiry" there.
"How paying works" restates src/app/pricing/page.tsx: Paystack, shillings, the reminder a week before the month ends, the new 30 days added to the end, keeping everything until the paid month ends, choosing a plan from the dashboard. The owner's brief lists M-Pesa or card, month by month, nothing renews on its own, renew early and the days are added, stop any time.
"What is not included" borrows the out of scope list idea from research/competitors.md (Designjoy) and the fee apart from media spend idea (Nairobi Marketing). No competitor is named on the page.
"Artwork, video and websites" is not in any plan list, which is why it is under not included. Eugene is a designer, so check he is happy to say this.
"Can I change plans?" and the pay the difference rule come from src/app/pricing/page.tsx.
The Agency line "Re-run market research up to 3 times a day" is on the old pricing page but not in the brief or in plans.ts, so it is not mentioned.
No market facts are used on this page.
Humanize skill run on 24 Nov 2026.
