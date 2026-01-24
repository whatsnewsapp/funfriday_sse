import { Router, Request, Response } from 'express';
import { startGame, submitAnswer } from '../services/game.service.js';
import { loadPartyFromRedis } from '../services/party.service.js';
import { loadUserFromRedis } from '../services/user.service.js';

const router = Router();

// POST /api/party/:partyId/start
router.post('/:partyId/start', async (req: Request, res: Response) => {
  try {
    const { partyId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    const party = await loadPartyFromRedis(partyId);
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    // Only creator can start the game
    if (party.creator !== user_id) {
      return res.status(403).json({ error: 'Only party creator can start the game' });
    }

    if (party.state !== 'waiting_for_players') {
      return res.status(400).json({ error: 'Game already started or ended' });
    }

    if (party.participants.length === 0) {
      return res.status(400).json({ error: 'No participants in party' });
    }

    await startGame(partyId);

    res.json({ message: 'Game started successfully' });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/party/:partyId/answer
router.post('/:partyId/answer', async (req: Request, res: Response) => {
  try {
    const { partyId } = req.params;
    const { user_id, answer } = req.body;

    if (!user_id || !answer) {
      return res.status(400).json({ error: 'Missing user_id or answer' });
    }

    const party = await loadPartyFromRedis(partyId);
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    if (party.state !== 'in_progress') {
      return res.status(400).json({ error: 'Game not in progress' });
    }

    if (!party.current_question) {
      return res.status(400).json({ error: 'No active question' });
    }

    const user = await loadUserFromRedis(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!party.participants.includes(user_id)) {
      return res.status(403).json({ error: 'User not in party' });
    }

    const result = await submitAnswer(partyId, user_id, answer);

    res.json({
      success: true,
      correct: result.correct,
      message: result.correct ? 'Correct answer!' : 'Incorrect answer'
    });
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
