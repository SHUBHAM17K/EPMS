import { Router, Response } from 'express';
import prisma from '../config/db.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all projects (access-filtered by role)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    let projects;

    if (role === 'ADMIN') {
      // Admins see all projects
      projects = await prisma.project.findMany({
        include: {
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
      // Employees & Managers see projects they are assigned to
      projects = await prisma.project.findMany({
        where: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
        include: {
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
    const { name, description, status, priority, startDate, endDate, members } = req.body;

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

    // If members are specified, create allocations in junction table
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

    // Fetch the complete created project with members
    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
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

// PUT update project & member allocations (Admin or Manager)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, priority, startDate, endDate, members } = req.body;

    const projectId = Number(id);

    // Update basic project data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    // Update members if provided
    if (members && Array.isArray(members)) {
      // Remove old members first
      await prisma.projectMember.deleteMany({
        where: { projectId: projectId },
      });

      // Insert new members list
      const memberData = members.map((m: { userId: number; role: string }) => ({
        projectId: projectId,
        userId: Number(m.userId),
        role: m.role || 'MEMBER',
      }));

      await prisma.projectMember.createMany({
        data: memberData,
      });
    }

    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    res.json(updatedProject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
