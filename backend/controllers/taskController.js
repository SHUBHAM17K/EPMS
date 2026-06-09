import Task from '../models/Task.js';

// @desc    Get user tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error(`Error in getTasks: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = await Task.create({
      title: title.trim(),
      userId: req.user.id,
      status: 'pending',
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(`Error in createTask: ${error.message}`);
    res.status(500).json({ message: 'Server error while creating task' });
  }
};

// @desc    Update task status to done
// @route   PATCH /api/tasks/:id/done
// @access  Private
export const updateTaskDone = async (req, res) => {
  try {
    const taskId = req.params.id;

    // Find task
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify task owner
    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    task.status = 'done';
    const updatedTask = await task.save();

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(`Error in updateTaskDone: ${error.message}`);
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    // Find task
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify task owner
    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();

    res.status(200).json({ message: 'Task removed successfully', id: taskId });
  } catch (error) {
    console.error(`Error in deleteTask: ${error.message}`);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};
