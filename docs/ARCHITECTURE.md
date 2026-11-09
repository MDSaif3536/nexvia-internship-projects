# Lumina architecture

## Roles and schema

| Role | Owns |
| --- | --- |
| Student | Enrollments, quiz attempts, certificates, live join |
| Instructor | Courses, lessons, video uploads, live rooms, revenue |
| Admin | Users, catalog, payments overview |

Core collections: `User`, `Course`, `Lesson`, `Enrollment`, `Quiz`, `QuizAttempt`, `LiveSession`, `Payment`, `Certificate`.

A course contains ordered lessons (`video` | `quiz` | `article`). Enrollment tracks `completedLessonIds` and `progressPercent`. Course completion issues a PDF certificate.

## Video pipeline

```
Instructor upload (multipart)
        │
        ▼
  Disk object store (uploads/)
        │
        ▼
  BullMQ job `video-transcode`
        │
        ▼
  FFmpeg → HLS (index.m3u8 + .ts)
        │
        ▼
  CDN URL = CloudFront domain if set,
            else local /cdn edge with cache headers
        │
        ▼
  Student player (hls.js)
```

If Redis is down, the API transcodes inline so a laptop demo still works. If FFmpeg is missing, the original file is served and the lesson is marked ready with a warning.

Set `CLOUDFRONT_DOMAIN` when an AWS distribution points at the bucket/origin. `mediaUrl()` prefixes every playback path with that domain.

## Live classes

Socket.IO rooms carry signaling (`offer` / `answer` / ICE) plus chat. Browsers use `RTCPeerConnection` (STUN) in a small mesh. Instructors schedule `LiveSession` documents; only enrolled students may join.

## Payments (test mode)

Paid enrollments create a Stripe Checkout session when `STRIPE_SECRET_KEY` is real. Otherwise Lumina records a `test_local` payment, splits a 15% platform fee, and activates enrollment immediately so the revenue dashboard has numbers without Stripe credentials.

## Request flow

```
React (Vite) + Redux Toolkit
        │  REST /api  +  WebSocket
        ▼
Express + JWT roles
        │
   ┌────┼────┬──────────┐
 Mongo  Redis  FFmpeg   Stripe test
```
