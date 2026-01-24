import { Router, Request, Response } from 'express';
import { createUser, loadUserFromMemory } from '../services/user.service.js';

const router = Router();

// GET /api/user/:userId - Validate user exists
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await loadUserFromMemory(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user_id: user.user_id, user_name: user.user_name });
  } catch (error) {
    console.error('Error validating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/user/create
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { user_name } = req.body;

    if (!user_name || typeof user_name !== 'string' || user_name.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    const userId = await createUser(user_name.trim());

    res.json({ user_id: userId });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
