import { HttpService, type PagableResponse } from './api';

export interface ChatBaseInstance {
  id: number;
  name: string;
  rolePrompt: string;
  status: 'active' | 'inactive';
  groupIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatBasePayload extends Omit<ChatBaseInstance, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}
export interface UpdateChatBasePayload extends Omit<ChatBaseInstance, 'createdAt' | 'updatedAt'> {}

export const fetchChatBaseInstances = async (page: number, pageSize: number): Promise<PagableResponse<ChatBaseInstance>> => {
  const response = await HttpService.getPagable<ChatBaseInstance>('/mcp/chatbases', page, pageSize);
  return response;
};

export const createChatBaseInstance = async (payload: CreateChatBasePayload): Promise<ChatBaseInstance> => {
  const response = await HttpService.post<ChatBaseInstance>('/mcp/chatbases', payload);
  return response;
};

export const updateChatBaseInstance = async (id: number, payload: UpdateChatBasePayload): Promise<ChatBaseInstance> => {
  const response = await HttpService.put<ChatBaseInstance>(`/mcp/chatbases/${id}`, payload);
  return response;
};

export const deleteChatBaseInstance = async (id: number): Promise<void> => {
  await HttpService.delete<void>(`/mcp/chatbases/${id}`);
};

export const updateChatBaseInstanceStatus = async (id: number, status: 'active' | 'inactive'): Promise<ChatBaseInstance> => {
  const response = await HttpService.patch<ChatBaseInstance>(`/mcp/chatbases/${id}/status`, { status });
  return response;
};
