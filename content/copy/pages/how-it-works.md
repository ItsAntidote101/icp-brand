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
The diagnosis needs no login to Google or Meta. Your ad account shows the click, but only you know which WhatsApp chat went quiet afterwards.
[BUTTON: Start my free diagnosis -> /questionnaire]
[IMAGE: An owner at a shop counter answering a question on a phone between customers | 4:3]

## split
eyebrow: Watch it first
### Half a minute, no sound needed
Coins go in and chats come out, but only a few chats turn into buyers. Then come the questions, the report, your media buyer and the files.
[VIDEO: /media/idealicp-explainer.mp4 | 4:3 | Animation with no sound: ad spend becomes inquiries, most go quiet, a few questions find why, and a media buyer hands over files and wording]

## split
### Why answers beat account access
An ad account records everything up to the click. The rest is on your phone and in your head: who replied, how fast, and whether anyone wrote again. So the diagnosis asks you. Rough numbers from memory are enough.
[IMAGE: Two phones side by side, one showing ad results full of clicks, the other an unanswered WhatsApp inquiry | 4:3]

## steps
### Day one, free
#### The conversation
It opens with what a media buyer asks every new client: what you spend on ads, how many inquiries come, how many buy. Ten questions, about three minutes.
#### Your own numbers
You see your cost per inquiry, your cost per sale, and what one more buyer in every ten inquiries would be worth.
#### The report
A score out of 100 and your top problems, in plain language, or a launch plan if you have not started ads. If your numbers are healthy, the report says so.
#### Three fixes for this week
Most important first, and that one comes with the words to use.
#### A call, if you ask
One free 20 minute call with a media buyer to go through the report. Nobody calls you otherwise.

## split
eyebrow: Week one, on a plan
### The files and the words
- Google keywords and words to block, as a file for Google Ads Editor
- Your customer and sales spreadsheets turned into Meta files, on your own device
- The words to paste for every fix
Clinics, lenders and insurers: ask your media buyer before using the customer list file. Meta does not allow lists based on health or financial information.
[LINK: What is in the files -> /services/ready-to-upload]
[IMAGE: A laptop with a keyword file open in Google Ads Editor and a customer spreadsheet in the next window | 4:3]

## split
eyebrow: Every Monday
### Two numbers on your dashboard
Log last week's ad spend and inquiries. The dashboard works out your cost per inquiry, which ad people call cost per lead, and shows it against the week before. Add your sales and you see cost per sale. A market briefing arrives each week, with sources.
[IMAGE: A phone showing a dashboard with last week's cost per inquiry beside the week before | 3:4]

## split
eyebrow: Every month
### A written note from your media buyer
Your media buyer reads the weeks you logged and writes what to change next, and why. On Pro the note can include a voice or video walk-through. Between notes, message them from the dashboard. They reply within a working day. Ideal ICP is new, built on campaigns our founder ran in the United States, the United Kingdom and South Africa.
[LINK: Who is behind Ideal ICP -> /about]
[IMAGE: A media buyer writing a note, a client's weekly numbers printed beside the keyboard | 4:3]

## split
eyebrow: On Pro and Agency
### One thing set up together
Ask for a hands-on session from your dashboard and pick the job: connect your CRM or inquiry sheet, fix conversion tracking, or set up campaigns. Your media buyer does it with you, in your accounts. One session a month on Pro, up to four on Agency.
[LINK: How hands-on sessions work -> /services/done-with-you]
[IMAGE: An owner at her laptop with her ad account open, a media buyer on a call on the phone beside it | 4:3]

## steps
### Three months, if you do the work
#### Month one
You put in the first three fixes, upload the files and log your first Mondays.
#### Month two
You work down the rest of the fix plan, with the words for each ready to paste. The monthly note says what to change next.
#### Month three
Three months of spend, inquiries and buyers sit side by side, with dates. Then you decide about the ad budget.
[LINK: The campaign setup plan on Pro -> /services/campaign-setup]

## faq
### Questions about how it works
#### Who writes the report, you or a computer?
Our software puts the report together from your answers. Everything after that comes from your media buyer: the call, the monthly note, the setup review and the replies to your messages.
#### Do I have to pay to see my report?
No. The score, your top problems and three fixes are free. The full report comes with Starter: every problem and the whole fix plan.
#### Can I stop after one month?
Yes. You pay one month at a time by M-Pesa or card, and nothing renews on its own.

## band
### Day one costs nothing.
Ten questions take about three minutes, and nobody calls unless you ask.
[BUTTON: Start my free diagnosis -> /questionnaire]

## notes
"What a media buyer asks every new client" restates the line under the name in src/app/new/opener.tsx. The opener itself still speaks as one named person and needs the same voice change.
The three figures under "Your own numbers" are the ones the opener works out from the owner's answers. There is no loss estimate.
"Every Monday": the dashboard asks for last week's ad spend and inquiries, with sales optional, and compares with the week before (src/app/dashboard/overview.tsx). "Cost per lead" is mentioned once so the page matches the plan cards.
"They reply within a working day" restates "I reply within a working day" from the live About page (src/app/about/page.tsx). The promise is unchanged: a person replies, within a working day. Remove it here if the owner no longer wants to state it.
"Who writes the report": the split between software and the media buyer follows the "Who does what" block on the About page. The word software describes what sits behind the business, as the brief allows. The product itself is never called software.
The hands-on jobs are the four in src/lib/hands-on.ts. The image assumes a session happens on a call. Confirm the format before choosing the photo.
"Three months, if you do the work" describes what the owner does and what is on the dashboard by then. It promises no result.
Humanize skill run on 24 Nov 2026, and again after the voice change.
Voice changed to company and role on 25 Nov 2026.
The international experience sentence sits in the "A written note from your media buyer" section, beside the About link. It follows the brief: the campaigns are the founder's, the company is new, no company is named. It appears once on this page.
Several sentences elsewhere on the page were tightened on 25 Nov 2026 so the page is no longer than before the experience sentence was added. No fact, number or link was removed.
Sources:
- Meta does not allow customer lists based on health or financial information: https://www.facebook.com/business/help/170456843145568 and https://www.facebook.com/business/help/606443329504150 (read 24 Nov 2026, per research/kenya-and-demand.md)
