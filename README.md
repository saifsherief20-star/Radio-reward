# RADIO REWARDS — PWA package

## 1) Publish (HTTPS is required)
Upload this whole folder to Netlify (Drop), Cloudflare Pages, Vercel or GitHub Pages.
- Customer app:  https://YOUR-DOMAIN/            (index.html)
- Cashier:       https://YOUR-DOMAIN/cashier.html
- Admin:         https://YOUR-DOMAIN/admin.html   (protect with login before going live)

## 2) Install on phones
- Android (Chrome): the "Install the app" button appears in Profile.
- iPhone (Safari): Share > Add to Home Screen, then open the app from the home screen.
  iOS 16.4+ is required, and push only works for the installed app.

## 3) Turn on real push notifications
1. Generate keys:  npx web-push generate-vapid-keys
2. Paste the PUBLIC key into `const VAPID=''` near the end of index.html.
3. Run server/push-example.js (or port it to your backend) with the PUBLIC + PRIVATE keys.
4. Send a test:  POST /api/push/send  {"title":"RADIO CAFÉ","body":"One drink to go!","url":"./#card"}

## Notes
- Push is triggered by YOUR server (reward ready, new offer, we miss you). It cannot be triggered by location in the background.
- The demo data is static. Real customers, QR tokens and cashier scanning need the backend.
- The "Nearby alert" card only works while the app is open.
