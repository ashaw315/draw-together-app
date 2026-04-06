# Draw Together

A real-time collaborative drawing app. Multiple people can draw on the same canvas simultaneously by sharing a link. Finished drawings can be saved to a public gallery backed by MongoDB.

**Live:** [draw-together-app.vercel.app](https://draw-together-app.vercel.app)

## How it works

The app is split into two processes:

- **Next.js app** — serves the canvas UI, gallery pages, and API routes for saving/retrieving drawings. Deployed on Vercel.
- **Socket.IO server** — a lightweight Express server that relays drawing events between connected clients. Deployed separately (Heroku).

When you draw, each mouse/touch move emits a stroke event (start point, end point, color, line width) over WebSocket. The server broadcasts it to every other connected client. Coordinates are normalized to a 0–1 scale so drawings render consistently across different screen sizes.

There is no server-side canvas state. Each client maintains its own canvas independently. This means new clients joining mid-session see a blank canvas — the app is designed for synchronous collaboration where everyone starts together.

Drawings are saved as PNG snapshots. The canvas is exported to a data URL, converted to a buffer, and stored in MongoDB via GridFS (chunked binary storage). The gallery retrieves images by streaming them from GridFS through a Next.js API route.

## Tech stack

- Next.js 13 (Pages Router)
- React 18
- TypeScript
- Socket.IO (client + standalone server)
- MongoDB with GridFS
- Canvas API
- SCSS
- Vercel (frontend) + Heroku (WebSocket server)

## Running locally

### Prerequisites

- Node.js 19+
- A MongoDB instance (local or Atlas)

### Setup

1. Clone the repo:
   ```
   git clone https://github.com/ashaw315/draw-together-app.git
   cd draw-together-app
   ```

2. Install dependencies for both the Next.js app and the socket server:
   ```
   npm install
   cd server && npm install && cd ..
   ```

3. Create `.env.local` in the project root:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

4. Update the socket server URL in `pages/index.tsx` (line 17) to point to `localhost:4000` instead of the Heroku URL.

5. Start both processes:
   ```
   # Terminal 1 — socket server
   cd server && npm start

   # Terminal 2 — Next.js dev server
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
pages/
  index.tsx          # Main canvas/drawing page
  gallery.tsx        # Gallery page
  api/
    upload.ts        # Save and retrieve drawings (GridFS)
    upload/[fileId].ts
server/
  server.js          # Standalone Socket.IO relay server
database.ts          # MongoDB client connection
bucket.ts            # GridFS bucket initialization
mongodb.ts           # Aggregated DB exports
styles/
  app.scss           # Main styles
  globals.css        # Canvas and input resets
```

## Deployment

- **Frontend:** Deployed on Vercel. No special config needed beyond setting `MONGODB_URI` as an environment variable.
- **Socket server:** Deployed as a separate Node.js process. Needs its own hosting (currently Heroku). The client-side socket URL in `pages/index.tsx` must match the deployed server address.
