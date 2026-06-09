import { Router, Response } from 'express';
import prisma from '../config/db.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST a new competency review (Admin & Manager only)
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviewerId = req.user?.id;
    const { employeeId, reviewType, communication, technical, delivery, teamwork, leadership, kpiScore, comments } = req.body;

    if (!reviewerId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!employeeId || !reviewType || !communication || !technical || !delivery || !teamwork || !leadership) {
      res.status(400).json({ message: 'All ratings are required' });
      return;
    }

    // Validate limit checks
    const ratings = [communication, technical, delivery, teamwork, leadership];
    if (ratings.some(r => typeof r !== 'number' || r < 1 || r > 5)) {
      res.status(400).json({ message: 'All ratings must be integers between 1 and 5' });
      return;
    }

    const overallScore = Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2));
    const finalKpiScore = kpiScore ? Number(kpiScore) : (overallScore * 20); // Fallback: overall score scale to 100

    const review = await prisma.performanceReview.create({
      data: {
        employeeId: Number(employeeId),
        reviewerId: reviewerId,
        reviewType: String(reviewType),
        communication,
        technical,
        delivery,
        teamwork,
        leadership,
        kpiScore: finalKpiScore,
        overallScore,
        comments,
      },
      include: {
        reviewer: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json(review);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET historical evaluations for an employee
router.get('/target/:employee_id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employee_id } = req.params;
    const requesterId = req.user?.id;
    const role = req.user?.role;

    const empId = Number(employee_id);

    if (role === 'EMPLOYEE' && requesterId !== empId) {
      res.status(403).json({ message: 'Forbidden: Cannot access other employees reviews' });
      return;
    }

    const reviews = await prisma.performanceReview.findMany({
      where: { employeeId: empId },
      include: {
        reviewer: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
