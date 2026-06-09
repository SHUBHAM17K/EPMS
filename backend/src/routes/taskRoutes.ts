import { Router, Response } from 'express';
import prisma from '../config/db.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all tasks
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { status, priority, projectId } = req.query;

    const whereClause: any = {};

    // Employees only see their assigned tasks
    if (role === 'EMPLOYEE') {
      whereClause.assigneeId = userId;
    }

    if (status) whereClause.status = String(status);
    if (priority) whereClause.priority = String(priority);
    if (projectId) whereClause.projectId = Number(projectId);

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, department: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST create a task (Admin & Manager)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body;

    if (!title || !priority || !dueDate || !assigneeId) {
      res.status(400).json({ message: 'Required fields: title, priority, dueDate, assigneeId' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'PENDING',
        priority,
        dueDate: new Date(dueDate),
        projectId: projectId ? Number(projectId) : null,
        assigneeId: Number(assigneeId),
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update task status / progress
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, description, title, dueDate } = req.body;

    const task = await prisma.task.findUnique({ where: { id: Number(id) } });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Employees can only update status of their assigned tasks
    if (req.user?.role === 'EMPLOYEE' && task.assigneeId !== req.user?.id) {
      res.status(403).json({ message: 'Forbidden: Cannot edit other employee tasks' });
      return;
    }

    const updateData: any = {};
    if (status) updateData.status = status;

    // Managers/Admins can modify metadata
    if (req.user?.role !== 'EMPLOYEE') {
      if (priority) updateData.priority = priority;
      if (description !== undefined) updateData.description = description;
      if (title) updateData.title = title;
      if (dueDate) updateData.dueDate = new Date(dueDate);
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
