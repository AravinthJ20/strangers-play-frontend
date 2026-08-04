# Green Lynk — Interview Presentation Script

Use this file as a speaking script and demo checklist. Read sentences as written (or adapt) when presenting.

---

## 1) One-line Elevator Pitch

"Green Lynk is a connection-first chat platform that starts conversations through consented requests and supports rich media, groups, and invite-driven growth."

(Short pause. Then:) "Today I'll show the product, the architecture, and a few technical decisions I made."

---

## 2) Demo Flow — What I'll show (one-sentence prompts to speak while doing each step)

1. "I'll open the app so you can see the launch landing and sign-in flows." — run frontend and backend.
2. "Next I'll show the People feed where users can swipe or click to express interest or ignore." — navigate to People page and demonstrate left/right drag + buttons.
3. "I'll open a chat to show messages, media uploads, and group interactions." — open a chat and share/send an image or short text.
4. "Finally, I'll show where the server and sockets come together to handle real-time events." — point to server.js / socketManager.js and explain.

---

## 3) Commands to Run Locally (say these while running them)

- Start backend (in another terminal):

```bash
cd green-lynk-backend
npm install   # only if dependencies not installed
npm start
```

- Start frontend:

```bash
cd green-lynk-frontend
npm install   # only if dependencies not installed
npm start
```

Say: "I run the backend and frontend locally so I can demonstrate the live features and changes quickly."

---

## 4) Architecture — short spoken explanation (30–60s)

- "The app is a standard web SPA with a Node/Express backend and MongoDB for persistence."
- "Real-time functionality is handled by a lightweight socket manager (socket/socketManager.js) — it broadcasts events like new messages and presence."
- "The frontend is React-based and organized into small components for pages and shared UI; media and uploads are routed through a server-side storage util which currently stores in `uploads/chat-media/`."

(If asked for tech stack: React, Node/Express, MongoDB, WebSockets, simple file storage.)

---

## 5) Key Features to Highlight (say while demoing)

- Connection-first flow: "Users must accept requests before opening private chat — this reduces spam and improves user comfort." Point to People/Requests flows.
- Rich messages & media: "Supports images and attachments in chats." Demonstrate an image upload.
- Lightweight, modular socket layer: "SocketManager centralizes broadcasts and subscriptions to keep components simple." Open file to show design.
- Simple, practical UI decisions: "Cards, swipes, and clear call-to-actions prioritize quick interactions." Show People card and drag actions.

---

## 6) Implementation Highlights & Decisions (speak for 60–90s)

- "I encapsulated the People card and drag interactions into a `PeopleCard` component to keep the page stateless and reusable — this makes it easier to test and reuse in other screens."
- "For UX, images are centered with `object-position: center` and containers use `aspect-ratio` to ensure consistent cropping across devices." Show CSS snippet if asked.
- "I picked a minimal socket layer to keep server-side logic focused and avoid overengineering — scalable pieces (e.g., message persistence) are easy to separate later."

---

## 7) Challenges & How I Solved Them (be ready to answer)

- Challenge: image cropping/portrait framing.
  - How I solved it: used `object-fit: cover` + `object-position: center` and tuned container aspect ratio and max-height.
- Challenge: swipe gestures that must work on touch + mouse.
  - How I solved it: used Pointer Events (`onPointerDown`, `onPointerMove`, `onPointerUp`) with threshold-based actions and fallbacks for buttons.
- Challenge: keeping components small and testable.
  - How I solved it: extracted `PeopleCard` component and moved drag logic into it; page comp handles data fetching only.

---

## 8) Metrics / Success Criteria to Mention

- UX success: reduce time-to-connect — e.g., average time from view to interest click < 20s (demo metric you can mention as target).
- Reliability: socket reconnection and message persistence.
- Future A/B or telemetry: measure acceptance rate of invites, average conversation length, and media upload success rate.

---

## 9) Potential Follow-up Questions & Suggested Answers

- Q: "Why MongoDB?"
  - A: "Flexible document model fits user/profile records and message payloads; easy to iterate quickly during product discovery."
- Q: "How would you scale sockets?"
  - A: "Introduce pub/sub via Redis or a message broker and move socket instances behind a load balancer; persist critical events to an event store."
- Q: "How secure are uploads?"
  - A: "Currently stored on disk in `uploads/` for simplicity; in production we'd use signed URLs with S3 (or similar), virus scanning, and strict content-type checks."

---

## 10) Closing Script (30s)

"That's Green Lynk — a lightweight, connection-first chat experience that focuses on consent and delightful interactions. I'm happy to walk through code, demonstrate another flow, or answer any questions you have about design or implementation."

---

## 11) Presentation Tips (quick)

- Practice the demo steps once before the interview so you avoid environment hiccups.
- Keep the demo under 8 minutes — you want time for questions.
- If something breaks, narrate the intent and show the relevant code instead of trying to force it to run.

---

## 12) Files to Point Reviewers To (optional speaking lines)

- Frontend main: `src/App.js`, `src/components/PeoplePage.js`, `src/components/PeopleCard.js`, `src/styles.css`
- Backend main: `server.js`, `socket/socketManager.js`, `controllers/` and `routes/`


---

If you'd like, I can also generate a short one-slide summary or a printable 1-page handout with these talking points. Want that as a PDF or MD? 
