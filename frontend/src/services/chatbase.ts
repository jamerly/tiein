import { HttpService, type PagableResponse } from './api';

export interface ChatBaseInstance {
  id: number;
  name: string;
  rolePrompt: string;
  greeting: string;
  appId: string;
  status: 'active' | 'inactive';
  groupIds: number[];
  requireAuth: boolean;
  authUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatBasePayload extends Omit<ChatBaseInstance, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'appId'> {}
export interface UpdateChatBasePayload extends Omit<ChatBaseInstance, 'createdAt' | 'updatedAt'> {}

export const fetchChatBaseInstances = async (page: number, pageSize: number): Promise<PagableResponse<ChatBaseInstance>> => {
  const response = await HttpService.getPagable<ChatBaseInstance>('/chatbases', page, pageSize);
  return response;
};

export const createChatBaseInstance = async (payload: CreateChatBasePayload): Promise<ChatBaseInstance> => {
  const response = await HttpService.post<ChatBaseInstance>('/chatbases', payload);
  return response;
};

export const updateChatBaseInstance = async (id: number, payload: UpdateChatBasePayload): Promise<ChatBaseInstance> => {
  const response = await HttpService.put<ChatBaseInstance>(`/chatbases/${id}`, payload);
  return response;
};

export const deleteChatBaseInstance = async (id: number): Promise<void> => {
  await HttpService.delete<void>(`/chatbases/${id}`);
};

export const updateChatBaseInstanceStatus = async (id: number, status: 'active' | 'inactive'): Promise<ChatBaseInstance> => {
  const response = await HttpService.patch<ChatBaseInstance>(`/chatbases/${id}/status`, { status });
  return response;
};

export const regenerateAppId = async (id: number): Promise<ChatBaseInstance> => {
  const response = await HttpService.patch<ChatBaseInstance>(`/chatbases/${id}/regenerate-appid`, {});
  return response;
};

export interface Session {
  id: string;
  title: string | null;
  startTime: string;
  userId: string;
  chatBaseId: number;
}

export const queryChatBaseSessions = async (id:number | null,page: number, pageSize: number): Promise<PagableResponse<Session>> => {
  const response = await HttpService.getPagable<Session>(`/chatbases/${id}/sessions`, page, pageSize);
  return response;
};