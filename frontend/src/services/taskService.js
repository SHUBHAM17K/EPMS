import api from './api';

// Retrieve all tasks
export const getTasksAPI = async () => {
  const response = await api.get('/api/tasks');
  return response.data;
};

// Create a new task
export const createTaskAPI = async (title) => {
  const response = await api.post('/api/tasks', { title });
  return response.data;
};

// Mark a task as done
export const updateTaskDoneAPI = async (id) => {
  const response = await api.patch(`/api/tasks/${id}/done`);
  return response.data;
};

// Delete a task permanently
export const deleteTaskAPI = async (id) => {
  const response = await api.delete(`/api/tasks/${id}`);
  return response.data;
};
