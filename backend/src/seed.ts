import bcrypt from 'bcryptjs';
import prisma from './config/db.js';

async function main() {
  console.log('Seeding initial data...');

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const managerPassword = await bcrypt.hash('manager123', salt);
  const employeePassword = await bcrypt.hash('employee123', salt);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@epms.com' },
    update: {},
    create: {
      email: 'admin@epms.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      department: 'Executive',
    },
  });
  console.log('Admin seeded:', admin.email);

  // 2. Create Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@epms.com' },
    update: {},
    create: {
      email: 'manager@epms.com',
      password: managerPassword,
      name: 'Jane Doe',
      role: 'MANAGER',
      department: 'Engineering',
    },
  });
  console.log('Manager seeded:', manager.email);

  // 3. Create Employee
  const employee = await prisma.user.upsert({
    where: { email: 'employee@epms.com' },
    update: {},
    create: {
      email: 'employee@epms.com',
      password: employeePassword,
      name: 'John Smith',
      role: 'EMPLOYEE',
      department: 'Engineering',
      managerId: manager.id,
    },
  });
  console.log('Employee seeded:', employee.email);

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
  console.log('Sample project seeded:', project.name);

  // 5. Seed sample review
  await prisma.performanceReview.create({
    data: {
      employeeId: employee.id,
      reviewerId: manager.id,
      communication: 4,
      technical: 5,
      delivery: 4,
      teamwork: 4,
      leadership: 3,
      overallScore: 4.0,
      comments: 'Excellent technical implementation skills and great teamwork in the current sprint.',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
  });

  await prisma.performanceReview.create({
    data: {
      employeeId: employee.id,
      reviewerId: manager.id,
      communication: 5,
      technical: 5,
      delivery: 5,
      teamwork: 4,
      leadership: 4,
      overallScore: 4.6,
      comments: 'Outstanding progress in lead-like behaviors and project milestone completions.',
      createdAt: new Date(),
    },
  });
  console.log('Sample reviews seeded.');

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
