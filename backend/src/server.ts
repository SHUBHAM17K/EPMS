import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/reviews', reviewRoutes);

app.get('/api/v1', (req: Request, res: Response) => {
  res.json({ message: 'Employee Performance Management System API is running...' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `API Route not found - ${req.originalUrl}` });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5050;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on all interfaces (0.0.0.0) on port ${PORT}`);
});
