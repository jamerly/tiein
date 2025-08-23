import { HttpService, type PagableResponse } from './api';

export interface ChatHistory {
  id: number;
  chatBaseId: number;
  userId: number;
  userMessage: string;
  aiResponse: string;
  timestamp: string;
}

export const fetchChatHistory = async (chatBaseId: number | undefined, sessionId: string | undefined, page: number, pageSize: number): Promise<PagableResponse<ChatHistory>> => {
  let url = '';
  if (chatBaseId && sessionId) {
    url = `/chatbases/${chatBaseId}/sessions/${sessionId}/history`;
  } else if (chatBaseId) {
    url = `/chatbases/${chatBaseId}/history`; // Fetch all history for a specific chatbase
  } else {
    url = `/chatbases/history`; // Fetch all history across all chatbases
  }
  const response = await HttpService.getPagable<ChatHistory>(url, page, pageSize);
  return response;
};
