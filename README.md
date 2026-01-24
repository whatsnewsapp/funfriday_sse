# Fun Friday SSE - Real-time Multiplayer Quiz Game

A real-time multiplayer quiz application built with TypeScript, featuring Server-Sent Events (SSE) for real-time communication instead of WebSockets.

## Technology Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** - Web framework
- **Server-Sent Events (SSE)** - Real-time updates
- **MongoDB** - Question database (NoSQL, document-based)
- **In-Memory Storage** - Fast session and party state management
- **Docker** - Containerization

### Frontend
- **React 18** with **TypeScript**
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **EventSource API** - SSE client

## Architecture Overview

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │─────────►│   Backend    │◄────────│   MongoDB    │
│   (React)    │  HTTP    │  (Express)   │  NoSQL  │ (Questions)  │
│              │  POST    │   + SSE      │         │              │
└──────┬───────┘         └──────┬───────┘         └──────────────┘
       │                         │
       │ SSE (EventSource)       │ In-Memory Maps
       └─────────────────────────┤ (Parties/Users)
                                 ▼
```

### Communication Model

**Client → Server (HTTP POST):**
- User registration
- Party creation/joining
- Game start
- Answer submission

**Server → Client (SSE):**
- New question events
- Question timeout events
- Game over events
- Player left events

## Port Configuration

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3000
- **MongoDB**: localhost:27017
- **Mongo Express**: http://localhost:8081

### Mongo Express (Database Viewer)

Mongo Express is a web-based MongoDB admin interface included in the Docker Compose setup. Use it to browse collections, view/edit documents, and run queries.

- **URL**: http://localhost:8081
- **No authentication required** (disabled for local development)
- Navigate to `quizdb` → `questions` to view the quiz questions

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation & Running

1. Clone the repository:
```bash
cd ~/code
cd funfriday_sse
```

2. Start all services:
```bash
docker-compose up --build
```

3. Wait for services to start (approximately 20-30 seconds)

4. Access the application:
- Frontend: http://localhost:5174
- Backend Health Check: http://localhost:3000/health

### Stopping the Application

```bash
# Stop services
docker-compose down

# Stop and remove all data (including database)
docker-compose down -v
```

## API Endpoints

### User Management

**POST /api/user/create**
```json
Request:
{
  "user_name": "string"
}

Response:
{
  "user_id": "uuid"
}
```

### Party Management

**POST /api/party/init** - Create a new party
```json
Request:
{
  "player_id": "uuid",
  "category": "string",
  "rounds": number,
  "timeout": number
}

Response:
{
  "party_id": "uuid"
}
```

**GET /api/party** - List all parties
```json
Response:
{
  "parties": [
    {
      "party_id": "uuid",
      "creator": "uuid",
      "creator_name": "string",
      "category": "string",
      "rounds": number,
      "timeout": number,
      "participants": number,
      "state": "waiting_for_players" | "in_progress" | "ended_successfully"
    }
  ]
}
```

**GET /api/party/:partyId** - Get party details
```json
Response:
{
  "party_id": "uuid",
  "creator_id": "uuid",
  "state": "string",
  "rounds": number,
  "timeout": number,
  "category": "string",
  "participants": [
    { "user_id": "uuid", "user_name": "string" }
  ]
}
```

**POST /api/party/:partyId/join** - Join a party
```json
Request:
{
  "user_id": "uuid"
}

Response:
{
  "message": "string",
  "game_id": "uuid"
}
```

**GET /api/party/categories/list** - Get available categories
```json
Response:
{
  "categories": ["History", "Science", ...]
}
```

### Game Actions

**POST /api/party/:partyId/start** - Start the game (creator only)
```json
Request:
{
  "user_id": "uuid"
}

Response:
{
  "message": "Game started successfully"
}
```

**POST /api/party/:partyId/answer** - Submit an answer
```json
Request:
{
  "user_id": "uuid",
  "answer": "string"
}

Response:
{
  "success": true,
  "correct": boolean,
  "message": "string"
}
```

### Server-Sent Events

**GET /api/party/:partyId/events?user_id=:userId** - SSE connection

**Event Types:**
- `connected` - Connection established
- `new_question` - New question available
- `question_timeout` - Question time expired
- `game_over` - Quiz completed
- `player_left` - Player disconnected

**Example Event:**
```
data: {"event":"new_question","data":{"round":1,"total_rounds":5,"question":"What is...?","choices":["A","B","C","D"],"timeout":30}}
```

## Development

### Hot Reloading with Docker

The source code directories are mounted as volumes in the Docker containers, enabling hot reloading during development:

```yaml
# From docker-compose.yml
backend:
  volumes:
    - ./backend/src:/app/src      # Backend source mounted

frontend:
  volumes:
    - ./frontend/src:/app/src     # Frontend source mounted
```

- **Backend**: Uses `tsx watch` - changes to files in `backend/src/` automatically restart the server
- **Frontend**: Uses Vite's HMR - changes to files in `frontend/src/` instantly reflect in the browser

**Note**: Changes to `package.json`, `Dockerfile`, or `docker-compose.yml` require a container restart:
```bash
docker compose down && docker compose up --build
```

### IDE Setup (TypeScript Support)

The `node_modules` directories exist only inside the Docker containers. For your IDE to provide TypeScript types, autocomplete, and error checking, install dependencies locally:

```bash
cd backend && npm install
cd ../frontend && npm install
```

This creates local `node_modules` folders that your IDE uses for IntelliSense. The application still runs using the container's dependencies.

### Running Without Docker

**Backend:**
```bash
cd backend
npm install
# Create .env file (copy from .env.example)
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Database (MongoDB):**
```bash
# Start only database service
docker-compose up db
```

### Project Structure

```
funfriday_sse/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & Redis configuration
│   │   ├── models/         # TypeScript interfaces
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── sse/            # SSE connection management
│   │   └── server.ts       # Express app entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/            # HTTP client & API functions
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks (useSSE, useUser)
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── database/
│   ├── schema.sql          # Database schema
│   ├── init-db.sh          # Initialization script
│   ├── questions.json      # Quiz questions
│   └── Dockerfile
└── docker-compose.yml
```

## How to Play

1. **Register**: Enter your name on the landing page
2. **Create or Join**:
   - Click "Create Party" to start a new quiz
   - Or join an existing party from the lobby list
3. **Wait**: In the waiting room, wait for the host to start
4. **Play**: Answer questions as they appear, submit before time runs out
5. **Compete**: See live scores after each question
6. **Win**: View final rankings at game end

## Features

- Real-time multiplayer quiz gameplay
- Server-Sent Events for efficient one-way streaming
- Category-based questions
- Configurable rounds and timeouts
- Live scoring and leaderboards
- Automatic timer-based question progression
- Graceful handling of player disconnections
- Session persistence across page refreshes

## Technical Highlights

### SSE vs WebSocket

This implementation uses **Server-Sent Events (SSE)** instead of WebSockets:

**Advantages:**
- Simpler protocol (HTTP-based)
- Automatic browser reconnection
- Works through most proxies/firewalls
- Native EventSource API in browsers
- Sufficient for server-to-client streaming

**Trade-offs:**
- One-way communication (server → client)
- HTTP POST used for client → server
- Text-based only (JSON encoded)

### State Management

- **In-Memory Maps**: Fast storage for active parties and user sessions (JavaScript Maps)
- **MongoDB**: Persistent storage for quiz questions (NoSQL document store)
- **SSE Connection Pool**: Tracks active client connections per party

### Game Flow

1. Party created → Questions pre-loaded from DB
2. SSE connections established when players join
3. Creator starts game → First question broadcast via SSE
4. Timer starts on client and server
5. Players submit answers via HTTP POST
6. Timeout triggers → Scores broadcast via SSE
7. Next question after 3-second delay
8. After all rounds → Final scores broadcast

## Troubleshooting

### Services won't start
```bash
# Check if ports are already in use
lsof -i :3000
lsof -i :5174
lsof -i :27017

# Stop and clean everything
docker-compose down -v
docker-compose up --build
```

### Cannot connect to SSE
- Check browser console for errors
- Verify backend is running: http://localhost:3000/health
- Check CORS settings in backend/.env
- Check backend logs: `docker logs funfriday_sse_backend`

### Questions not loading
- Verify database initialized: `docker logs funfriday_sse_db`
- Check questions.json was copied correctly
- Verify init-mongo.js ran successfully
- Check MongoDB: `docker exec -it funfriday_sse_db mongosh -u quizuser -p quizpassword --eval "use quizdb; db.questions.countDocuments()"`

### Data lost on restart
- **Expected behavior**: Party and user data stored in-memory is lost when backend restarts
- This is by design - game state is ephemeral
- For persistent data, only questions are stored in MongoDB

## Testing

### Manual Testing

1. **User Registration**:
   - Open http://localhost:5174
   - Enter username → Should store in localStorage and backend memory
   - Backend logs should show user creation

2. **Party Creation**:
   - Create party with History, 5 rounds, 30s timeout
   - Should redirect to waiting room
   - Backend logs should show party initialization

3. **Multiplayer**:
   - Open incognito window, register second user
   - Join party from lobby
   - First user starts quiz
   - Both should see questions simultaneously

4. **SSE Connection**:
   - Open browser DevTools → Network → EventStream
   - Should see active SSE connection
   - Close tab → Other players should see "player_left" event

## License

MIT

## Credits

Built with TypeScript, React, Express, and MongoDB.
Implements Server-Sent Events for real-time communication.
Uses in-memory storage for fast game state management.
