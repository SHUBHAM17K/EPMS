import express from 'express';
import { getTasks, createTask, updateTaskDone, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to protect all routes defined below
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id/done')
  .patch(updateTaskDone);

router.route('/:id')
  .delete(deleteTask);

export default router;
