# CollabSpace — Real-time Collaborative Workspace MVP

A functional starter for the Nexvia FS-02 project. It provides account registration/login, workspace and page creation, collaborative rich-text editing powered by Yjs CRDT and a WebSocket server, live cursor presence, comments, role-aware basic access, and JSON snapshots.

## Stack
Next.js App Router + React + TypeScript, Prisma/PostgreSQL, Yjs + y-websocket, TipTap, JWT cookie sessions.

## Setup
1. Install Node.js 20+ and PostgreSQL (or use a managed PostgreSQL provider).
2. Copy `.env.example` to `.env`; set `DATABASE_URL` and a strong `JWT_SECRET`.
3. `npm install`
4. `npm run db:generate`
5. `npm run db:migrate`
6. `npm run dev`
7. Open http://localhost:3000 and create an account. `npm run dev` starts Next.js and the collaboration server together.

For a separate collab server deployment, run `npm run collab` and set `NEXT_PUBLIC_COLLAB_URL` to its `wss://` URL before building the frontend. Keep JWT_SECRET identical in both services.

## MVP scope / limitations
- Workspace creation and membership are supported. This MVP doesn't yet implement an invite UI or membership-management UI; users can be provisioned via Prisma.
- Roles are stored (OWNER/EDITOR/COMMENTER/VIEWER). The current UI and routes apply basic checks; granular view/comment/edit controls should be further hardened and tested before production.
- Yjs document state currently lives in the WebSocket server's memory. Configure persistent Yjs storage and Redis pub/sub for multi-instance scaling before production. Redis is not yet wired in this MVP.
- Snapshots store TipTap JSON exports. They can be downloaded; applying a snapshot as a restore action is not yet implemented.
- Cursor presence is provided by Yjs awareness when connected.
- Automated test suite, rate limiting, email verification, password reset, and production security review remain out of scope.
- Document content sync is not persisted to PostgreSQL yet; use a persistence provider (e.g. y-leveldb for single server or custom Postgres persistence) before deployment.
- API documentation: REST endpoints are summarized below.

## Endpoints
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET/POST /api/workspaces`
- `POST /api/documents`
- `GET/PATCH /api/documents/:id`
- `GET/POST /api/documents/:id/comments`
- `GET/POST /api/documents/:id/snapshots`
- `GET /api/collab-token`

## Presentation outline (10 minutes)
1. Problem and user scenario (1 min)
2. Architecture: Next.js UI/API, PostgreSQL/Prisma metadata, Yjs CRDT, WebSocket sync (2 min)
3. Live demo: sign up, open same page in two browsers, simultaneous editing, presence (3 min)
4. Comments, page title, snapshots and permission model (2 min)
5. Tradeoffs, Redis persistence/scaling next steps (2 min)

## Architecture
Browser (TipTap editor + Yjs) ⇄ WebSocket server (y-websocket) → membership check
Next.js API → Prisma → PostgreSQL (users, workspaces, memberships, page metadata, comments, snapshots)

## Note
This is a starter MVP codebase. Run build/migration and browser tests in your environment before submitting.
