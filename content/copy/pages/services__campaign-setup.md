---
path: /services/campaign-setup
title: Campaign setup plan for Google and Meta ads | Ideal ICP
description: A starting plan for Google bidding and Meta budgets, matched to your stage and reviewed by a media buyer against your real numbers. Included on Pro.
question: How should I set up my Google and Meta campaigns?
status: ready
links_to: /questionnaire, /pricing, /services/done-with-you, /for/schools
---

## hero
eyebrow: Campaign setup plan, on Pro and Agency
# A starting plan for your stage, checked against your numbers.
It says how to set Google bidding and Meta budgets for where you are today. I review it against your real figures before you build anything.
[BUTTON: Start my free diagnosis -> /questionnaire]
[IMAGE: A dashboard screen showing a campaign stage marked Testing, with three Google bidding steps listed below it | 4:3]

## ladder
### In short
#### Who it suits
An owner about to launch, still testing or ready to spend more, who wants the setup checked by someone who buys media for a living.
#### Plan
Pro and Agency.
#### Price
KES 13,000 a month on Pro, by M-Pesa or card, one month at a time.
#### What it needs
Your answers and the weekly numbers you log, with no login to your ad account.

## steps
### How the plan is made
#### Your stage is worked out
Launch, Testing or Scaling, from your answers and the weeks you have logged.
#### You get a starting point
Google bidding and Meta budgets for that stage, with the reason beside each.
#### I review it
Ask from your dashboard and I check it against your real numbers.
#### It moves with your numbers
As more weeks are logged and your cost per inquiry settles, the plan steps up.
[LINK: Planning ads for a school intake -> /for/schools]

## split
eyebrow: Google
### Bidding moves in three steps
- Manual CPC while Google has few or no counted inquiries. You set the most you pay for a click.
- Maximize conversions once inquiries are counted as conversions and arrive regularly.
- Target CPA once enough are counted each month and the cost has held steady. Start at your real cost per inquiry, no lower.
[IMAGE: The Google Ads bidding setting open on a laptop, with Manual CPC selected | 4:3]

## split
eyebrow: Meta
### Ad set budgets or Advantage+ campaign budget
While you are still finding out who responds, ad set budgets give each audience a fair run before you judge it. Once results hold steady, Advantage+ campaign budget shares one budget across your ad sets and Meta moves it between them. Raise it in small steps.
[IMAGE: Meta Ads Manager on a phone showing the budget choice between campaign budget and ad set budgets | 3:4]

## split
eyebrow: Why I review it
### Setup is a judgement, not a formula
The plan is worked out from your numbers by rule. Rules miss things: a seasonal intake, a price change, a month when the phone was off. So I read it against your real figures and tell you where I agree and where I would do it differently.
[LINK: See the Pro plan -> /pricing]
[IMAGE: Eugene comparing a client's weekly numbers with a campaign plan on a second screen | 4:3]

## cards
### Not a fit if
#### You want the campaigns built for you
The plan says what to set up. Building it together is a hands-on session, and running your ads is a separate conversation.
[LINK: Hands-on sessions -> /services/done-with-you]
#### Google is not counting your inquiries
The bidding steps depend on counted inquiries. If you are not sure they are counted, that is the first thing to fix.
#### You will not log your weeks
The plan moves with your numbers. With no numbers it stays where it started.

## faq
### Questions about the setup plan
#### Is the campaign setup plan in Starter?
No. It comes with Pro and Agency. Starter has the full report, the files and the wording.
#### I have not started ads. Do I get a plan?
Yes. You begin at the Launch stage: Manual CPC on Google and ad set budgets on Meta, then my review.
#### My account says "Maximize conversions with a Target CPA". Is that different?
No. Some accounts still show that label. It behaves the same as Target CPA.
#### Do you need my login to review it?
No. I review against your answers and the weekly numbers you log.

## band
### Before the setup, find what is broken.
The plan builds on your diagnosis, so the ten questions come first.
[BUTTON: Start my free diagnosis -> /questionnaire]

## notes
The Google and Meta names are the exact ones confirmed in research/kenya-and-demand.md: Manual CPC, Maximize conversions, Target CPA, ad set budgets, Advantage+ campaign budget (with the plus sign, as the Meta Help Center writes it). The dashboard code still says CBO and ABO. The page uses the Help Center names.
How the plan works was checked against src/lib/setup-plan.ts and src/app/dashboard/setup.tsx: three stages (Launch, Testing, Scaling) worked out from the owner's answers and logged weeks; Google steps in the order shown; ad set budgets while testing and one shared campaign budget once results are steady; "raise the budget in small steps"; start Target CPA at the real cost per inquiry, not lower.
The code moves an owner to Target CPA at about 30 counted inquiries a month with three steady weeks. Those thresholds are left off the page on purpose. They would read as a benchmark, and the page says setup is a judgement.
The review is asked for by the owner with a button on the dashboard ("Ask Eugene to review my setup"). The hero says "I review it before you build anything". If a review should happen without being asked, the product needs to change, or this line does.
The examples in "Setup is a judgement" (seasonal intake, price change, phone off) are illustrations, not findings.
"A judgement, not a formula" is the one contrast of that kind on this page.
Humanize skill was not run on this file.
Sources:
- Google bid strategies and names: https://support.google.com/google-ads/answer/2472725?hl=en
- Target CPA label, including "Maximize conversions with a Target CPA": https://support.google.com/google-ads/answer/10353027?hl=en
- Meta campaign and ad set budgets, Advantage+ campaign budget: https://www.facebook.com/business/help/458847204894307
All read 24 Nov 2026, per research/kenya-and-demand.md.
