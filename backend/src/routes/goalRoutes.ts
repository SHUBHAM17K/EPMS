import { Router, Response } from 'express';
import prisma from '../config/db.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all goals
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { targetUserId } = req.query;

    const whereClause: any = {};

    if (role === 'EMPLOYEE') {
      whereClause.userId = userId;
    } else if (targetUserId) {
      whereClause.userId = Number(targetUserId);
    }

    const goals = await prisma.goal.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json(goals);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST create goal
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, completion, dueDate, userId } = req.body;

    if (!title || !dueDate || !userId) {
      res.status(400).json({ message: 'Required fields: title, dueDate, userId' });
      return;
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        completion: completion ? Number(completion) : 0,
        dueDate: new Date(dueDate),
        userId: Number(userId),
      },
    });

    res.status(201).json(goal);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update goal completion
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { completion, title, description, dueDate } = req.body;

    const goal = await prisma.goal.findUnique({ where: { id: Number(id) } });
    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return;
    }

    if (req.user?.role === 'EMPLOYEE' && goal.userId !== req.user?.id) {
      res.status(403).json({ message: 'Forbidden: Cannot edit other employee goals' });
      return;
    }

    const updateData: any = {};
    if (completion !== undefined) updateData.completion = Number(completion);

    if (req.user?.role !== 'EMPLOYEE') {
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate) updateData.dueDate = new Date(dueDate);
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.json(updatedGoal);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
