# 10-minute final presentation

1. **Problem (1 min)** — Online schools need VOD, live rooms, assessment, and payouts in one product, not five tools.
2. **Roles & schema (1 min)** — Student / instructor / admin; course → lesson → enrollment.
3. **Demo catalog (1 min)** — Sign in as `student@lumina.test`, open Realtime Systems, show progress.
4. **Video pipeline (2 min)** — Studio upload → BullMQ → FFmpeg HLS → `/cdn` or CloudFront URL → hls.js.
5. **Quiz + certificate (1 min)** — Auto-grade, progress to 100%, download PDF.
6. **Live class (2 min)** — Two browsers, camera, chat.
7. **Revenue (1 min)** — Instructor dashboard, 15% fee, Stripe test mode.
8. **Challenges (1 min)** — Redis/FFmpeg on Windows, WebRTC mesh limits, CloudFront as URL contract.
9. **Next steps** — LiveKit SFU, signed CloudFront cookies, webhook-complete Stripe, adaptive HLS ladders.
