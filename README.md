# Lumina School

Full online school: courses, video lessons, live classes, quizzes, certificates, and instructor earnings.

Internship project **FS-03** — Learning Management System with Live Classes.

## Tech stack

MERN · WebRTC · FFmpeg · AWS CloudFront (URL contract) · BullMQ · Redux Toolkit

## Quick start

Needs **Node 20+** and **MongoDB** on `mongodb://127.0.0.1:27017`. Redis and FFmpeg are optional but recommended.

```bash
# optional local data plane
docker compose up -d mongo redis

npm install
npm run seed
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:5000/api/health  

Optional transcode worker (when Redis is up):

```bash
npm run worker
```

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | student@lumina.test | Password123! |
| Instructor | instructor@lumina.test | Password123! |
| Admin | admin@lumina.test | Password123! |

## CloudFront

Set `CLOUDFRONT_DOMAIN` in `server/.env` to your distribution host. Playback URLs become `https://<distribution>/<object-key>`. Locally, Express serves the same keys at `/cdn` with cache headers so the player code does not change.

## Stripe test mode

Put `sk_test_...` in `STRIPE_SECRET_KEY` to open Checkout. Without keys, enrollments still record a **test_local** payment so the instructor revenue dashboard works.

## Repository map

```
client/   React + Vite + Redux Toolkit
server/   Express, Mongo, Socket.IO, BullMQ worker
docs/     Architecture, presentation, tests, reflection
```

## Deliverables

- Working demo: `npm run dev`
- Architecture: `docs/ARCHITECTURE.md`
- Tests: `npm test` and `docs/TEST_RESULTS.md`
- Presentation outline: `docs/PRESENTATION.md`
- Reflection: `docs/REFLECTION.md`
