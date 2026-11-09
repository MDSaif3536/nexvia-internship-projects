# Individual reflection — MD Saifuddin

I owned the full-stack LMS: data model, auth roles, course studio, video ingest, live classroom, quizzes, certificates, and instructor revenue.

What I learned:

- Background work (BullMQ + FFmpeg) has to be decoupled from HTTP or uploads freeze the API.
- CDN delivery is a URL and cache-header contract. CloudFront can sit in front without rewriting the app if keys stay stable.
- WebRTC needs a signaling channel; Socket.IO was enough for a classroom demo, but a mesh will not scale — an SFU (LiveKit) is the production step.
- Progress is a derived number from completed lessons plus passing quiz attempts, not a separate “percent” the UI invents.
- Test-mode payments still need a ledger so instructors can see gross, fee, and net.

I would next add signed cookies on CloudFront, webhook-driven Stripe, and an SFU for rooms larger than a handful of peers.
