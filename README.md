# shared-media-streaming
Shared Media Streaming Web App
A web app where two people can share a piece of media together

## MVP validation goal:
Can handle 10 users across the app.
Shared media playback + basic interaction

### Features:
- Storage upload
- Database and metadata storage
- Client media player
- Realtime media sync
- Chat
- Interface

### Depenedencies
Frontend: 
- React + Redux Toolkit (for app-wide state), 
- Zustand (for local/lightweight state), 
- TailwindCSS (for styling).

Backend: 
- Node.js + Express.js for APIs, 
- Socket.IO for real‑time media sync.

Database: 
- MongoDB (fast iteration for MVP). If relational features become essential, we can migrate or add PostgreSQL later.    

Storage:
- S3
