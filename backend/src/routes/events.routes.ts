import { Router, Request, Response } from 'express';
import { addConnection, removeConnection } from '../sse/connection-manager.js';
import { sendSSEMessage, broadcastToParty } from '../sse/event-broadcaster.js';
import { loadPartyFromRedis, removeParticipant } from '../services/party.service.js';
import { loadUserFromRedis } from '../services/user.service.js';

const router = Router();

// GET /api/party/:partyId/events (SSE endpoint)
router.get('/:partyId/events', async (req: Request, res: Response) => {
  const { partyId } = req.params;
  const { user_id } = req.query;

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid user_id' });
  }

  // Validate party exists
  const party = await loadPartyFromRedis(partyId);
  if (!party) {
    return res.status(404).json({ error: 'Party not found' });
  }

  // Validate user exists and is in party
  const user = await loadUserFromRedis(user_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!party.participants.includes(user_id)) {
    return res.status(403).json({ error: 'User not in party' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Add connection to manager
  addConnection(partyId, user_id, res);

  // Send connection confirmation
  sendSSEMessage({ event: 'connected', data: { party_id: partyId } }, res);

  // Setup heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (error) {
      clearInterval(heartbeatInterval);
    }
  }, 30000); // Every 30 seconds

  // Handle client disconnect
  req.on('close', async () => {
    clearInterval(heartbeatInterval);
    removeConnection(partyId, user_id);

    // Remove participant from party
    await removeParticipant(partyId, user_id);

    // Notify other participants
    await broadcastToParty(partyId, {
      event: 'player_left',
      data: {
        user_id: user_id,
        user_name: user.user_name,
      },
    });

    res.end();
  });
});

export default router;
