# zDrop

Peer-to-peer file sharing (WebRTC) with chat rooms, built with React + Vite and an Express + Socket.IO server.

## Run locally

```bash
npm install
npm start          # API + Socket.IO on http://localhost:4000
npm --prefix client install
npm --prefix client run dev   # Vite on http://localhost:5173
```

Or build the client and let Express serve it:

```bash
npm run build
npm start          # http://localhost:4000
```

## Deploy to Vercel

`app.js` is the single server: Vercel builds it as one Express Function that serves the built client, the REST API and Socket.IO. `client/dist/**` is bundled into that Function via `vercel.json`'s `includeFiles`.

```bash
vercel            # preview deployment
vercel --prod     # production deployment
```

No environment variables are required: the client uses the same origin in production. Optional overrides live in `client/.env.example` and `.env.example`.

Socket.IO is configured for the WebSocket transport only (Vercel Functions cannot use sticky long-polling sessions) and uses `/socket.io`. The server and client re-announce presence and rejoin rooms after a reconnect, which matters because Vercel closes sockets when a Function reaches its max duration.

## State: no Redis, no external store

All state is **in-memory and per-process**: rooms, chat history (capped at 500 messages per room), the file counter, known users, and time-limited room password grants. See `store.js`.

Trade-offs to be aware of:

- State is lost on cold start, restart, or redeploy. Rooms self-heal when someone joins: the client sends its saved copy of the room (kept in `localStorage`), and the server recreates it if needed. A public room link with no saved copy is recreated as an empty public room; a private room link asks for the password and recreates the room with it.
- Different function instances do not share state, so keep the app to a single instance if you need people in the same room to see each other. Vercel pins each WebSocket connection to the instance that accepted it.
- Chat history is not restored with a room — only the room metadata (name/password/owner).
- Analytics counters are best-effort and reset with the process.

If durable or cross-instance state becomes a requirement, add a shared store — but that reintroduces the external dependency this version intentionally removed.

## Security note

An old Redis connection URL with embedded credentials was previously hardcoded in `app.js`. It has been removed from the code, but it still exists in git history. **Rotate/revoke those credentials**, and consider purging the history if the repository is public.
