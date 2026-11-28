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

## Sending a file

1. **Open or join a room.** On the landing page click **Open a room**, or open a room link / scan its QR code. If the room is private, enter the password.
2. **Wait for the other person.** Everyone in the room appears as an avatar on the radar. You can also use the in-room chat to coordinate.
3. **Click the person's avatar.** This starts the peer-to-peer connection and opens the file picker. If the connection is still being negotiated, the file is queued automatically ("Waiting for the peer connection…") — you don't need to click again.
4. **Pick a file.** Progress appears in the **Sending files** panel (click its expand button to see it). The receiver sees the same file in **Receiving files** with a progress bar, plus a **Download** button once it reaches 100%.
5. **Send more files.** Click the same avatar and pick another file; transfers are queued one at a time over the same connection.

The status chip next to the room name shows the connection state:

- **Connected** — the data channel is open; transfers can start.
- **Connecting…** — ICE negotiation is in progress. If it stays this way for 20 seconds, the UI switches to **Connection failed**, retries once, and shows an error. Configure a TURN relay (below) if this happens between different networks.
- **Disconnected / Connection closed / Connection failed** — click the person's avatar again to establish a fresh connection.

Keep both browser tabs open until the transfer completes. Files go directly between browsers — nothing is uploaded to the server.

### VPN / proxy alert

The app compares the public IP used for HTTP (`/api/ip`) with the public IP WebRTC reveals via STUN. If they differ, a banner warns that a VPN or proxy is likely active and asks the user to disable it and reload — VPNs commonly break the direct peer-to-peer connection. The check is a heuristic: it only compares public IPv4 addresses and cannot detect a VPN that also routes WebRTC traffic, so it may not fire in every case.

## Deploy to Vercel

`app.js` is the single server: Vercel builds it as one Express Function that serves the built client, the REST API and Socket.IO. `client/dist/**` is bundled into that Function via `vercel.json`'s `includeFiles`.

```bash
vercel            # preview deployment
vercel --prod     # production deployment
```

No environment variables are required for basic operation: the client uses the same origin in production. Optional overrides (including TURN credentials for reliable cross-network transfers) live in `client/.env.example` and `.env.example`.

Socket.IO is configured for the WebSocket transport only (Vercel Functions cannot use sticky long-polling sessions) and uses `/socket.io`. The server and client re-announce presence and rejoin rooms after a reconnect, which matters because Vercel closes sockets when a Function reaches its max duration.

## TURN relay (required for reliable cross-network transfers)

File transfers use a direct WebRTC data channel. STUN alone only works when both peers are reachable directly; peers behind symmetric NATs or restrictive firewalls otherwise stay in "Connecting…" forever. Configure a TURN relay with Vercel environment variables (see `client/.env.example`):

- `VITE_TURN_CREDENTIALS_URL` — a provider endpoint returning an `iceServers` array (e.g. Metered's publishable credential API key). Recommended because credentials can be rotated.
- Or `VITE_TURN_URLS`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` for static credentials.
- `VITE_STUN_URLS` optionally overrides the default Google STUN server.

The client fails visibly after 20 seconds without a connection instead of showing "Connecting…" indefinitely.

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
