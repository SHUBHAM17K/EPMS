import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all employees
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { department, role, managerId } = req.query;

    const whereClause: any = { isActive: true };
    if (department) whereClause.department = String(department);
    if (role) whereClause.role = String(role);
    if (managerId) whereClause.managerId = Number(managerId);

    const employees = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employeeId: true,
        department: true,
        designation: true,
        phone: true,
        linkedin: true,
        bio: true,
        profilePicture: true,
        joiningDate: true,
        managerId: true,
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST new employee (Admin only)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, role, department, designation, phone, linkedin, bio, profilePicture, managerId } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ message: 'Required fields: email, password, name, role' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    // Auto-generate employeeId if not provided
    const employeeId = req.body.employeeId || `AX-EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newEmployee = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        employeeId,
        department,
        designation,
        phone,
        linkedin,
        bio,
        profilePicture,
        managerId: managerId ? Number(managerId) : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employeeId: true,
        department: true,
        designation: true,
        phone: true,
        linkedin: true,
        bio: true,
        profilePicture: true,
        joiningDate: true,
        managerId: true,
      },
    });

    res.status(201).json(newEmployee);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update employee profile
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, department, designation, phone, linkedin, bio, profilePicture, managerId, password } = req.body;

    if (req.user?.role !== 'ADMIN' && req.user?.id !== Number(id)) {
      res.status(403).json({ message: 'Forbidden: Cannot edit other profiles' });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (department) updateData.department = department;
    if (designation) updateData.designation = designation;
    if (phone) updateData.phone = phone;
    if (linkedin) updateData.linkedin = linkedin;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    if (req.user?.role === 'ADMIN') {
      if (role) updateData.role = role;
      if (managerId !== undefined) {
        updateData.managerId = managerId ? Number(managerId) : null;
      }
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedEmployee = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employeeId: true,
        department: true,
        designation: true,
        phone: true,
        linkedin: true,
        bio: true,
        profilePicture: true,
        joiningDate: true,
        managerId: true,
      },
    });

    res.json(updatedEmployee);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
