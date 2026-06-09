import bcrypt from 'bcryptjs';
import prisma from './config/db.js';

async function main() {
  console.log('Seeding initial data...');

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const managerPassword = await bcrypt.hash('manager123', salt);
  const employeePassword = await bcrypt.hash('employee123', salt);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@epms.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      employeeId: 'AX-ADMIN-01',
      department: 'Executive',
      designation: 'Director of Operations',
      phone: '+1 (555) 019-2834',
      linkedin: 'https://linkedin.com/in/admin-axiora',
      bio: 'Managing organization structure, users, and policy tracking at Axiora.',
    },
  });

  // 2. Create Manager
  const manager = await prisma.user.create({
    data: {
      email: 'manager@epms.com',
      password: managerPassword,
      name: 'Jane Doe',
      role: 'MANAGER',
      employeeId: 'AX-MGR-02',
      department: 'Engineering',
      designation: 'Engineering Manager',
      phone: '+1 (555) 014-9988',
      linkedin: 'https://linkedin.com/in/jane-doe-axiora',
      bio: 'Leading the software development and quality teams at Axiora.',
    },
  });

  // 3. Create Employee
  const employee = await prisma.user.create({
    data: {
      email: 'employee@epms.com',
      password: employeePassword,
      name: 'John Smith',
      role: 'EMPLOYEE',
      employeeId: 'AX-EMP-03',
      department: 'Engineering',
      designation: 'Senior Developer',
      phone: '+1 (555) 012-3344',
      linkedin: 'https://linkedin.com/in/john-smith-axiora',
      bio: 'React and Node.js fullstack developer building enterprise platforms.',
      managerId: manager.id,
    },
  });

  // 4. Create a Project
  const project = await prisma.project.create({
    data: {
      name: 'Project Antigravity',
      description: 'Building autonomous coding agents for next-gen development workflows.',
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date(),
      members: {
        createMany: {
          data: [
            { userId: manager.id, role: 'LEAD' },
            { userId: employee.id, role: 'MEMBER' },
          ],
        },
      },
    },
  });

  // 5. Create Goals for Goal Management
  await prisma.goal.createMany({
    data: [
      {
        title: 'Optimize Database Indexing',
        description: 'Improve response times for heavy historical review queries.',
        completion: 75.0,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days out
        userId: employee.id,
      },
      {
        title: 'Deploy Production Build V1',
        description: 'Push verified build components to staging and complete load runs.',
        completion: 10.0,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days out
        userId: employee.id,
      }
    ]
  });

  // 6. Create Tasks for Task Management & Alert triggers
  await prisma.task.createMany({
    data: [
      {
        title: 'Design Authentication Controllers',
        description: 'Complete JWT cookies and router mappings.',
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assigneeId: employee.id,
      },
      {
        title: 'Verify UI Contrast Ratios',
        description: 'Check high accessibility metrics on form inputs.',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // OVERDUE
        projectId: project.id,
        assigneeId: employee.id,
      },
      {
        title: 'Implement SVG Dashboards',
        description: 'Refactor chart components to React 19 rules.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // APPROACHING DEADLINE (12 hours)
        projectId: project.id,
        assigneeId: employee.id,
      }
    ]
  });

  // 7. Seed Appraisal Reviews
  await prisma.performanceReview.create({
    data: {
      employeeId: employee.id,
      reviewerId: manager.id,
      reviewType: 'MONTHLY',
      communication: 4,
      technical: 5,
      delivery: 4,
      teamwork: 4,
      leadership: 3,
      kpiScore: 88.0,
      overallScore: 4.0,
      comments: 'Excellent technical implementation skills and great teamwork in the current sprint.',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.performanceReview.create({
    data: {
      employeeId: employee.id,
      reviewerId: manager.id,
      reviewType: 'QUARTERLY',
      communication: 5,
      technical: 5,
      delivery: 5,
      teamwork: 4,
      leadership: 4,
      kpiScore: 94.0,
      overallScore: 4.6,
      comments: 'Outstanding progress in lead-like behaviors and project milestone completions.',
      createdAt: new Date(),
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
