import { Router, Response } from 'express';
import prisma from '../config/db.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check-in
router.post('/check-in', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const now = new Date();
    const checkDate = getLocalDateString(now);

    // Verify duplicate checks
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_checkDate: {
          userId: userId,
          checkDate: checkDate,
        },
      },
    });

    if (existing) {
      res.status(400).json({ message: 'Already checked in today' });
      return;
    }

    const record = await prisma.attendance.create({
      data: {
        userId: userId,
        checkDate: checkDate,
        checkIn: now,
      },
    });

    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Check-out
router.put('/check-out', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const now = new Date();
    const checkDate = getLocalDateString(now);

    const record = await prisma.attendance.findUnique({
      where: {
        userId_checkDate: {
          userId: userId,
          checkDate: checkDate,
        },
      },
    });

    if (!record) {
      res.status(404).json({ message: 'No check-in record found for today' });
      return;
    }

    if (record.checkOut) {
      res.status(400).json({ message: 'Already checked out today' });
      return;
    }

    const checkInTime = new Date(record.checkIn).getTime();
    const checkOutTime = now.getTime();
    const diffMs = checkOutTime - checkInTime;
    const hoursWorked = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: now,
        hoursWorked: hoursWorked,
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET active status for current user (check-in / check-out state)
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const checkDate = getLocalDateString(new Date());

    const record = await prisma.attendance.findUnique({
      where: {
        userId_checkDate: {
          userId: userId,
          checkDate: checkDate,
        },
      },
    });

    res.json(record || null);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET organization-wide or user-specific attendance records
router.get('/matrix', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetUserId } = req.query;
    const role = req.user?.role;
    const requestUserId = req.user?.id;

    let whereClause: any = {};

    // Standard employees can only fetch their own attendance matrix
    if (role === 'EMPLOYEE') {
      whereClause.userId = requestUserId;
    } else if (targetUserId) {
      whereClause.userId = Number(targetUserId);
    }

    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
      orderBy: { checkIn: 'desc' },
    });

    res.json(records);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
