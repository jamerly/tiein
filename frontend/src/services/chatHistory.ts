import { HttpService, type PagableResponse } from './api';

export interface ChatHistory {
  id: number;
  chatBaseId: number;
  userId: number;
  userMessage: string;
  aiResponse: string;
  timestamp: string;
}

export const fetchChatHistory = async (page: number, pageSize: number): Promise<PagableResponse<ChatHistory>> => {
  const response = await HttpService.getPagable<ChatHistory>('/mcp/chat-history', page, pageSize);
  return response;
};

export const fetchChatHistoryByChatBaseId = async (chatBaseId: number, page: number, pageSize: number): Promise<PagableResponse<ChatHistory>> => {
  const response = await HttpService.getPagable<ChatHistory>(`/mcp/chat-history/chatbase/${chatBaseId}`, page, pageSize);
  return response;
};
