import { HttpService, type PagableResponse } from './api';

export interface ChatHistory {
  id: number;
  chatBaseId: number;
  userId: number;
  userMessage: string;
  aiResponse: string;
  timestamp: string;
}

export const fetchChatHistory = async (chatId:number,sessionId:string,page: number, pageSize: number): Promise<PagableResponse<ChatHistory>> => {
  const response = await HttpService.getPagable<ChatHistory>(`/chatbases/${chatId}/sessions/${sessionId}/history`, page, pageSize);
  return response;
};
