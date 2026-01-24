import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { initializeMemoryStore } from './config/memory.js';

// Import routes
import userRoutes from './routes/user.routes.js';
import partyRoutes from './routes/party.routes.js';
import gameRoutes from './routes/game.routes.js';
import eventsRoutes from './routes/events.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5174',
  credentials: true,
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/user', userRoutes);
app.use('/api/party', partyRoutes);
app.use('/api/party', gameRoutes);
app.use('/api/party', eventsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Fun Friday SSE Backend...\n');

    // Connect to database and initialize storage
    console.log('📦 Connecting to database...');
    await connectDatabase();
    await initializeMemoryStore();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`   http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
