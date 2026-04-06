TITLE: Draw Together
TAGLINE: A real-time collaborative drawing app where multiple people sketch on a shared canvas over WebSocket.

DESCRIPTION:
Draw Together lets two or more people draw on the same canvas at the same time. You share a link, your friend opens it, and every stroke appears on both screens in near real-time. When you're done, you can save the drawing to a public gallery or download it as a PNG.

The product premise is simple — shared creative space with zero friction. No accounts, no rooms to configure, no setup. The interesting engineering is underneath: keeping canvas state consistent across clients without a central source of truth, handling concurrent input from multiple users, and persisting finished drawings as binary image data in a way that scales.

The app was originally built on Pusher for real-time communication, then migrated to Socket.IO to reduce dependency on a paid service and gain more control over the WebSocket layer. That migration is visible in the commit history and shaped several architectural decisions.

TECHNICAL NOTE:
The real-time architecture uses a broadcast model rather than operational transformation or CRDTs. Each mouse/touch move emits a stroke event — a segment defined by start point, end point, color, and line width — via Socket.IO. The server relays it to every other connected client using `socket.broadcast.emit()`. There is no server-side canvas state and no conflict resolution. This works because the domain allows it: overlapping strokes from different users don't conflict the way concurrent text edits would. Two people drawing in different areas of the canvas produces a correct result without coordination, and two people drawing over the same area produces a visually merged result, which is the expected behavior for a shared drawing surface.

Coordinates are normalized to a 0–1 scale before transmission (`x / canvas.width`), so strokes render correctly regardless of each client's viewport size. On the receiving end, coordinates are denormalized against the local canvas dimensions. This means a stroke drawn on a 1920px-wide screen appears in the correct relative position on a 375px mobile screen.

Client-side input is throttled to one event per 10ms (100 events/sec max) to limit socket traffic without visible degradation in stroke fidelity. The drawing implementation layers five offset strokes per segment (at ±0, ±2, and ±4 pixel offsets) to produce smoother, denser lines than a single canvas stroke would.

Undo is implemented locally only — each client stores canvas `ImageData` snapshots on `mousedown` and restores them on undo. This was a deliberate choice: broadcasting undo would mean one user's undo could erase another user's concurrent work. Local-only undo gives each person a private safety net without disrupting the shared canvas.

The save flow converts the canvas to a PNG data URL, decodes it to a buffer, and streams it into MongoDB GridFS via `bucket.openUploadStream()` with 1MB chunk sizing. GridFS was chosen over storing base64 strings in a document because it handles large binary payloads without hitting MongoDB's 16MB document limit, and supports streaming retrieval — the gallery serves images by piping a GridFS download stream directly into the HTTP response, avoiding loading full images into memory.

The Socket.IO server runs as a separate Express process from the Next.js app. This separation means the real-time relay can be deployed and scaled independently from the frontend and API layer. The Next.js app handles the UI, gallery, and all MongoDB interactions; the socket server is stateless and only relays events.

STACK: Next.js, React, TypeScript, Socket.IO, MongoDB, GridFS, Canvas API, SCSS, Vercel, Heroku

LIVE URL: https://draw-together-app.vercel.app
GITHUB URL: https://github.com/ashaw315/draw-together-app
SECTION: project
