import { Router, Request, Response } from 'express';
import { createParty, loadPartyFromCache, getAllParties, addParticipant } from '../services/party.service.js';
import { getQuestionsByBank, getQuestionCountByBank } from '../services/question.service.js';
import { getAvailableBanks, getBankById, markBankAsUsed } from '../services/bank.service.js';
import { loadUserFromCache, setUserParty, getAllUsers } from '../services/user.service.js';
import { broadcastToParty } from '../sse/event-broadcaster.js';

const router = Router();

// POST /api/party/init
router.post('/init', async (req: Request, res: Response) => {
  try {
    const { player_id, bank_id, rounds, timeout } = req.body;

    // Validation
    if (!player_id || !bank_id || !rounds || !timeout) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (typeof rounds !== 'number' || rounds < 1 || rounds > 50) {
      return res.status(400).json({ error: 'Invalid rounds (must be 1-50)' });
    }

    if (typeof timeout !== 'number' || timeout < 5 || timeout > 300) {
      return res.status(400).json({ error: 'Invalid timeout (must be 5-300 seconds)' });
    }

    // Check if user exists
    const user = await loadUserFromCache(player_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Look up the bank
    const bank = await getBankById(bank_id);
    if (!bank) {
      return res.status(404).json({ error: 'Bank not found' });
    }

    // Load questions from the bank
    const questions = await getQuestionsByBank(bank_id, rounds);

    // Use bank title as the category display name
    const category = bank.title;

    // Create party
    const partyId = await createParty(player_id, category, rounds, timeout, questions);

    // Mark bank as used
    await markBankAsUsed(bank_id);

    // Update user's current party
    await setUserParty(player_id, partyId);

    res.json({ party_id: partyId });
  } catch (error: any) {
    console.error('Error initializing party:', error);
    if (error.message?.includes('Insufficient questions')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/parties
router.get('/', async (req: Request, res: Response) => {
  try {
    const parties = await getAllParties();
    res.json({ parties });
  } catch (error) {
    console.error('Error getting parties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/party/banks/list — must be before /:partyId to avoid matching "banks" as a partyId
router.get('/banks/list', async (req: Request, res: Response) => {
  try {
    const banks = await getAvailableBanks();

    // Enrich each bank with its question count
    const banksWithCounts = await Promise.all(
      banks.map(async (bank) => ({
        bankId: bank.bankId,
        title: bank.title,
        description: bank.description,
        questionCount: await getQuestionCountByBank(bank.bankId),
      }))
    );

    res.json({ banks: banksWithCounts });
  } catch (error) {
    console.error('Error getting banks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/party/:partyId
router.get('/:partyId', async (req: Request, res: Response) => {
  try {
    const { partyId } = req.params;

    const party = await loadPartyFromCache(partyId);
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const users = await getAllUsers();
    const participants = party.participants.map((userId) => ({
      user_id: userId,
      user_name: users[userId]?.user_name || 'Unknown',
    }));

    res.json({
      party_id: partyId,
      creator_id: party.creator,
      state: party.state,
      rounds: party.rounds,
      timeout: party.timeout,
      category: party.category,
      participants,
    });
  } catch (error) {
    console.error('Error getting party:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/party/:partyId/join
router.post('/:partyId/join', async (req: Request, res: Response) => {
  try {
    const { partyId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    const party = await loadPartyFromCache(partyId);
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    if (party.state !== 'waiting_for_players') {
      return res.status(400).json({ error: 'Cannot join party - game already started' });
    }

    const user = await loadUserFromCache(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (party.participants.includes(user_id)) {
      return res.status(400).json({ error: 'User already in party' });
    }

    await addParticipant(partyId, user_id);
    await setUserParty(user_id, partyId);

    // Broadcast to other participants that someone joined
    await broadcastToParty(partyId, {
      event: 'player_joined',
      data: {
        user_id: user_id,
        user_name: user.user_name,
      },
    });

    res.json({ message: 'Joined party successfully', game_id: party.game_id });
  } catch (error) {
    console.error('Error joining party:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
