---
path: /services/ready-to-upload
title: Keyword and Meta files, ready to upload | Ideal ICP
description: A Google Ads Editor keyword file, your spreadsheets turned into Meta files on your device, and the words to paste for every fix. From KES 6,500 a month.
question: Which keywords and negative keywords should I add to my Google Ads?
status: ready
links_to: /questionnaire, /pricing, /services/done-with-you, /for/clinics
---

## hero
eyebrow: Ready to upload, from Starter
# A score fixes nothing. You get the files and the words.
A Google keyword file, your spreadsheets turned into Meta files, and the wording for every fix. Upload or paste them the same day.
[BUTTON: Start my free diagnosis -> /questionnaire]
[IMAGE: A laptop with Google Ads Editor open and a keyword file being imported | 4:3]

## ladder
### In short
#### Who it suits
An owner who runs their own Google or Meta ads, or has someone in the office who does.
#### Plan
Starter, Pro and Agency.
#### Price
From KES 6,500 a month, by M-Pesa or card, one month at a time.
#### What you need
Your customer or sales records in Excel or CSV, and someone who can open the ad account.

## split
eyebrow: Google
### Keywords and words to block, in one file
A starter list for Google Search, built from what you sell and who buys it. Import the CSV in Google Ads Editor under Account, Import, From file. The rows arrive as proposed changes to keep or reject, and the words to block go in as negative keywords. The list has no search volumes, because we have no honest source for them.
[IMAGE: Google Ads Editor showing imported keywords and negative keywords as proposed changes | 4:3]

## split
eyebrow: Meta
### Your customer list, converted on your own device
Choose the spreadsheet you already keep. It becomes the CSV Meta accepts for a customer list custom audience, with country codes added to the phone numbers. The file is read on your device and never sent to us. Clinics, lenders and insurers: ask your media buyer before using it. Meta does not allow lists based on health or financial information.
[IMAGE: A customer spreadsheet on a laptop with names and Kenyan phone numbers, a download button beside it | 4:3]

## split
eyebrow: Meta
### Your sales, so Meta knows who paid
Your sales spreadsheet becomes a CSV for your dataset in Events Manager. Each sale needs a date, an amount and a phone number or email. That is how a sale paid by M-Pesa or in person gets reported back to Meta. This file is converted on your device too, and the same caution applies to clinics, lenders and insurers.
[IMAGE: A phone showing an M-Pesa payment message next to a sales spreadsheet with dates and amounts | 4:3]

## split
eyebrow: Words
### The words to paste for every fix
Each fix in your plan comes with the thing itself: a first WhatsApp reply, ad text, the questions for an Instant form, or the exact values for a setting. Anything only you know, such as a price, stays in square brackets for you to fill in. We invent nothing.
[LINK: See what Starter includes -> /pricing]
[IMAGE: A phone with a drafted first WhatsApp reply being pasted into a chat, the price still in square brackets | 3:4]

## cards
### Not a fit if
#### Nobody on your side opens the ad account
A file needs someone to upload it. If you want it done together, that is a hands-on session on Pro.
[LINK: Hands-on sessions -> /services/done-with-you]
#### You want search volumes and cost forecasts
The keyword list has none. It is a starting list, and your own search terms after a week tell you more.
#### You keep no record of customers or sales
The Meta files come from your spreadsheets. With no list there is no file, though the keywords and the wording still apply.
#### Your list holds health or financial details
Meta does not allow customer lists based on that. Clinics, lenders and insurers should ask their media buyer first.
[LINK: Ads for clinics and beauty -> /for/clinics]

## faq
### Questions about the files
#### Is my customer list sent to Ideal ICP?
No. The spreadsheet is read and converted on your device. It is not sent to us or stored anywhere.
#### Will the keyword file change my campaigns by itself?
No. In Google Ads Editor the rows arrive as proposed changes, and you keep or reject them. Put your campaign's exact name in the Campaign column first, or Editor creates a new campaign.
#### If I block "job", is "jobs" blocked too?
No. Google's negative keywords do not cover close variants, so the plural needs its own line.
#### I do not use Google Ads Editor. Can I still use the keywords?
Yes. The same keywords come as plain lines to paste into Google Ads on the web.
#### Whose details can I upload to Meta?
Only people who gave you their details themselves. Meta scrambles the list before matching it.

## band
### The diagnosis comes first. The files follow.
We build the keyword list from your answers, so it starts with the ten questions.
[BUTTON: Start my free diagnosis -> /questionnaire]

## notes
The Google and Meta names are the exact ones confirmed in research/kenya-and-demand.md: Google Ads Editor, Account > Import > From file (written with commas because the page may not use symbols), negative keywords, customer list custom audience, dataset, Events Manager, Instant form.
Product details checked against the code, not only the brief:
- Keyword list is a starter list for Google Search with no search volume figures, and the file is for Google Ads Editor (src/app/dashboard/ready.tsx, src/lib/ready-files.ts).
- The Campaign column warning and the "plain lines to paste into Google Ads on the web" option are in src/app/dashboard/ready.tsx.
- Customer and sales spreadsheets are read in the browser and never sent to the server (src/lib/customer-list.ts). Phone numbers get the country code added. A sale needs a date, an amount and a phone number or email.
- "Only people who gave you their details themselves" is the dashboard's own instruction.
- Wording forms (WhatsApp reply, ad text, form questions, setting values, square brackets for facts only the owner knows) are in src/lib/fix-draft.ts.
The health and financial caution is repeated in the customer list split, the sales file split and the "not a fit" card on purpose. The owner asked for it wherever the customer list file is mentioned. Extending it to the sales file is my addition. Confirm with Eugene.
The dashboard also tells owners to upload sales every week or two "because Meta only uses recent sales". That reason has no source in the research file, so it is left out.
Humanize skill run on 24 Nov 2026, and again after the voice change.
Voice changed to company and role on 25 Nov 2026.
Sources:
- Google Ads Editor, import a CSV file, rows arrive as proposed changes: https://support.google.com/google-ads/editor/answer/30564?hl=en
- Google Ads Editor, add multiple keywords: https://support.google.com/google-ads/editor/answer/56501?hl=en
- Negative keywords do not cover close variants: https://support.google.com/google-ads/answer/2453972?hl=en
- Google Ads Editor, add negative keywords: https://support.google.com/google-ads/editor/answer/30553?hl=en
- Meta customer list custom audience, file type, country code, hashing, no health or financial information: https://www.facebook.com/business/help/170456843145568 and https://www.facebook.com/business/help/606443329504150
- Meta offline sales uploaded to a dataset in Events Manager: https://www.facebook.com/business/help/155437961572700
- Meta Instant forms: https://www.facebook.com/business/help/252352181957512
All read 24 Nov 2026, per research/kenya-and-demand.md.
