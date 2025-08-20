import { HttpService, type PagableResponse } from './api';

export interface User {
  id: number;
  username: string;
  role: string;
}

export const fetchUsers = async (page: number, pageSize: number): Promise<PagableResponse<User>> => {
  const response = await HttpService.getPagable<User>('/user', page, pageSize);
  return response;
};

export const createUser = async (userData: Omit<User, 'id'> & { password?: string }): Promise<User> => {
  const response = await HttpService.post<User>('/user', userData);
  return response;
};

export const updateUser = async (id: number, userData: Partial<Omit<User, 'id'>> & { password?: string }): Promise<User> => {
  const response = await HttpService.put<User>(`/user/${id}`, userData);
  return response;
};

export const deleteUser = async (id: number): Promise<void> => {
  await HttpService.delete<void>(`/user/${id}`);
};