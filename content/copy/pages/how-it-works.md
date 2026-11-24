---
path: /how-it-works
title: How it works, first question to month three | Ideal ICP
description: Ten questions, a report, three fixes, your numbers each week, files to upload and a monthly note from a media buyer. No ad account login needed.
question: How does Ideal ICP work?
status: ready
links_to: /questionnaire, /services/ready-to-upload, /services/done-with-you, /services/campaign-setup, /about
---

## hero
eyebrow: From the first question to month three
# Ten questions first. Then the work, week by week.
No login to Google or Meta is needed. Your ad account shows the click; the WhatsApp chat that went quiet afterwards is something only you can tell me.
[BUTTON: Start my free diagnosis -> /questionnaire]
[IMAGE: An owner at a shop counter answering a question on a phone between customers | 4:3]

## split
### Why answers beat account access
An ad account records everything up to the click. What comes after sits in your phone and your head: who replied, how fast, whether anyone wrote again. That is the part the diagnosis checks, so it asks you. Rough numbers from memory are enough.
[IMAGE: Two phones side by side, one showing ad results full of clicks, the other an unanswered WhatsApp inquiry | 4:3]

## steps
### Day one, free
#### The conversation
It opens with the questions I ask every new client: what goes into ads, how many inquiries come, how many buy. Ten questions, about three minutes.
#### Your own numbers
From the figures you give, you see your cost per inquiry, your cost per sale, and what one more buyer in every ten inquiries would be worth.
#### The report
A score out of 100 and your top problems, in plain language. If you have not started ads you get a launch plan, and if your numbers are healthy the report says so.
#### Three fixes for this week
Most important first, with the words to use for the first one.
#### A call, if you ask
One free 20 minute call with me to go through the report. Nobody calls you otherwise.

## split
eyebrow: Week one, on a plan
### The files and the words
- Google keywords and words to block, as a file for Google Ads Editor
- Your customer and sales spreadsheets turned into Meta files, on your own device
- The words to paste for every fix in your plan
Clinics, lenders and insurers: ask me before using the customer list file. Meta does not allow lists based on health or financial information.
[LINK: What is in the files -> /services/ready-to-upload]
[IMAGE: A laptop with a keyword file open in Google Ads Editor and a customer spreadsheet in the next window | 4:3]

## split
eyebrow: Every Monday
### Two numbers on your dashboard
Log last week's ad spend and inquiries. The dashboard works out your cost per inquiry, which ad people call cost per lead, and shows it against the week before. Add your sales and you see cost per sale as well. A briefing on your market also arrives each week, with its sources.
[IMAGE: A phone showing a dashboard with last week's cost per inquiry beside the week before | 3:4]

## split
eyebrow: Every month
### A written note from me
I read the weeks you logged and write what I would change next, and why. On Pro the note can include a voice or video walk-through. Between notes, message me from the dashboard. I reply within a working day.
[LINK: Who Eugene is -> /about]
[IMAGE: Eugene writing a note with a client's weekly numbers printed beside the keyboard | 4:3]

## split
eyebrow: On Pro and Agency
### One thing set up together
Ask for a hands-on session from your dashboard and pick the job: connect your CRM or inquiry sheet, fix conversion tracking, or set up campaigns. We do it together in your own accounts. One session a month on Pro, up to four on Agency.
[LINK: How hands-on sessions work -> /services/done-with-you]
[IMAGE: An owner at her laptop with her ad account open, Eugene on a call on the phone propped beside it | 4:3]

## steps
### Three months, if you do the work
#### Month one
You put in the first three fixes and upload the files. You log your first Mondays.
#### Month two
You work down the rest of the fix plan, using the wording for each fix. My note says what I would change next.
#### Month three
Three months of spend, inquiries and buyers sit side by side, with dates. That is the time to decide about the ad budget.
[LINK: The campaign setup plan on Pro -> /services/campaign-setup]

## faq
### Questions about how it works
#### Who writes the report, you or a computer?
The questions and the report run on software I built. It is AI, and it is labelled as AI. The call, the monthly note, the setup review and the replies to your messages are me.
#### Do I have to pay to see my report?
No. The score, your top problems and three fixes are free. The full report, with every problem and the whole fix plan, comes with Starter.
#### Can I stop after one month?
Yes. You pay one month at a time by M-Pesa or card, and nothing renews on its own.

## band
### Day one costs nothing.
Ten questions, about three minutes, and nobody calls unless you ask.
[BUTTON: Start my free diagnosis -> /questionnaire]

## notes
"The questions I ask every new client" matches the line under Eugene's name in src/app/new/opener.tsx.
The three figures under "Your own numbers" are the ones the opener works out from the owner's answers. There is no loss estimate.
"Every Monday": the dashboard asks for last week's ad spend and inquiries, with sales optional, and compares with the week before (src/app/dashboard/overview.tsx). "Cost per lead" is mentioned once so the page matches the plan cards.
"I reply within a working day" comes from the live About page (src/app/about/page.tsx). Remove it here if Eugene no longer wants to state it.
"Who writes the report": the split between software and Eugene follows the "Who does what" block on the About page. The word software describes what sits behind the business, as the brief allows. The product itself is never called software.
The hands-on jobs are the four in src/lib/hands-on.ts. The image assumes a session happens on a call. Confirm the format before choosing the photo.
"Three months, if you do the work" describes what the owner does and what is on the dashboard by then. It promises no result.
Humanize skill was not run on this file.
Sources:
- Meta does not allow customer lists based on health or financial information: https://www.facebook.com/business/help/170456843145568 and https://www.facebook.com/business/help/606443329504150 (read 24 Nov 2026, per research/kenya-and-demand.md)
