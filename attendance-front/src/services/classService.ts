import api from './api';

export interface Class {
  id: number;
  name: string;
  subject: string;
  total_students: number;
  teacher_id: number;
  teacher?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateClassRequest {
  name: string;
  subject: string;
  total_students: number;
}

export interface UpdateClassRequest {
  name?: string;
  subject?: string;
  total_students?: number;
}

export const classService = {
  async getAll(): Promise<Class[]> {
    const response = await api.get('/classes');
    return response.data;
  },

  async getById(id: number): Promise<Class> {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  async create(classData: CreateClassRequest): Promise<Class> {
    const response = await api.post('/classes', classData);
    return response.data;
  },

  async update(id: number, classData: UpdateClassRequest): Promise<Class> {
    const response = await api.put(`/classes/${id}`, classData);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/classes/${id}`);
  },
};
