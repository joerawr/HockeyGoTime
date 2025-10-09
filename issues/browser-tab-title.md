## Problem
Browser tab still showed the default "Create Next App" title and generic description, which hurt our branding and made QA think they hit the wrong site.

## Solution
Update Next.js `app/layout.tsx` metadata so the title reads "Hockey Go Time" and the description says "Your AI hockey schedule sidekick for Socal families." This keeps the tab consistent across routes.

## Rabbit holes
- Reworking the entire head tag pipeline (metadata is sufficient).

## No gos
- Swapping out Next.js or introducing third-party head managers.
