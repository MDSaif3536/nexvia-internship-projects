# Test results

Automated (Node test runner):

| Suite | What it proves |
| --- | --- |
| `server/tests/grade.test.js` | Auto-grading and progress percent |
| `server/tests/payments.test.js` | Platform fee split |

Run: `npm test` from the repo root.

Manual demo checklist:

- [ ] Register / login for student, instructor, admin
- [ ] Instructor creates course, lesson, uploads video
- [ ] Lesson status moves queued → processing → ready
- [ ] Student playback through `/cdn` (or CloudFront domain)
- [ ] Quiz auto-grade pass/fail
- [ ] Certificate PDF after 100%
- [ ] Two-browser WebRTC + chat
- [ ] Instructor revenue shows test payment
