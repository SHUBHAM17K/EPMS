import api from './api';

// Call backend login endpoint
export const loginAPI = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

// Call backend registration endpoint
export const registerAPI = async (name, email, password) => {
  const response = await api.post('/api/auth/register', { name, email, password });
  return response.data;
};
