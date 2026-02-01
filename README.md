# Contractor Vision (Hackathon)

Modern Next.js interface for generating renovation concepts from a listing URL and a selected design direction.

## What’s included
- Next.js App Router UI
- Tailwind-styled landing page
- 3 preset design directions (Modern Coastal, Japandi Minimal, Industrial Loft)
- Railway-ready deployment configuration

## Local development
1. Install dependencies.
2. Run the dev server.

## Railway deployment
1. Push this repo to GitHub.
2. Create a new Railway project and connect the repo.
3. Railway will detect the Next.js app and build with Nixpacks.
4. Ensure the start command is `npm run start` (already set in railway.json).

## Notes
- The UI is a frontend prototype only; wire it to your backend when ready.
- The legacy Python CLI still exists in contractor_vision for reference.
