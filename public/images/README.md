# Image Assets

## Folder Structure
- /hero/ — Hero section images
- /features/ — Feature block images (3 total)
  - feature-1.jpg — ICP Alignment section
  - feature-2.jpg — Funnel Scoring section
  - feature-3.jpg — Budget Analysis section
- /team/ — Team member photos
  - founder.jpg — Eugene Kwata photo
- /logos/ — Client/partner logos

## How to replace placeholders
Once you add an image to the correct folder,
update the placeholder div in page.tsx with:

<img 
  src="/images/features/feature-1.jpg"
  alt="ICP Alignment"
  style={{width:'100%', borderRadius:'24px',
  objectFit:'cover'}}
/>
