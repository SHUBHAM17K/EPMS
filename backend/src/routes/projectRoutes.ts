import { Router, Response } from 'express';
import prisma from '../config/db.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all projects (access-filtered by role with tasks)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    let projects;

    if (role === 'ADMIN') {
      projects = await prisma.project.findMany({
        include: {
          tasks: true,
          members: {
            include: {
              user: {
                select: { id: true, name: true, role: true, email: true },
              },
            },
          },
        },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
        include: {
          tasks: true,
          members: {
            include: {
              user: {
                select: { id: true, name: true, role: true, email: true },
              },
            },
          },
        },
      });
    }

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST new project (Admin or Manager)
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, status, priority, startDate, endDate, members, tasks } = req.body;

    if (!name || !status || !priority || !startDate) {
      res.status(400).json({ message: 'Required fields: name, status, priority, startDate' });
      return;
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status,
        priority,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    // Create assignments if provided
    if (members && Array.isArray(members)) {
      const memberData = members.map((m: { userId: number; role: string }) => ({
        projectId: project.id,
        userId: Number(m.userId),
        role: m.role || 'MEMBER',
      }));

      await prisma.projectMember.createMany({
        data: memberData,
      });
    }

    // Create project tasks/milestones if provided
    if (tasks && Array.isArray(tasks)) {
      const taskData = tasks.map((t: string) => ({
        projectId: project.id,
        title: t,
        completed: false,
      }));

      await prisma.projectTask.createMany({
        data: taskData,
      });
    }

    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        tasks: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    res.status(201).json(fullProject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle project task completion status
router.put('/:projectId/tasks/:taskId/toggle', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId, taskId } = req.params;

    const task = await prisma.projectTask.findUnique({
      where: { id: Number(taskId) },
    });

    if (!task || task.projectId !== Number(projectId)) {
      res.status(404).json({ message: 'Project task not found' });
      return;
    }

    const updatedTask = await prisma.projectTask.update({
      where: { id: task.id },
      data: {
        completed: !task.completed,
      },
    });

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
