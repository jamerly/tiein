import { HttpService, type PagableResponse } from './api';

export interface ChatBaseInstance {
  id: number;
  name: string;
  rolePrompt: string;
  greeting: string;
  appId: string;
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

export const regenerateAppId = async (id: number): Promise<ChatBaseInstance> => {
  const response = await HttpService.patch<ChatBaseInstance>(`/mcp/chatbases/${id}/regenerate-appid`, {});
  return response;
};

export const fetchWelcomeMessage = async (appId: string, language: string): Promise<string> => {
  const responseData = await HttpService.get<string>(`/chatbases/init?appId=${appId}&language=${language}`);

  let accumulatedResponse = '';
  // The responseData is a string that looks like concatenated JSON objects
  // Example: {"chunk":"こんにちは"}{"chunk":"、"}[DONE]
  // We need to parse each object and extract the "chunk" value.

  // Split the string by "}{" to get individual JSON objects, then add back the braces
  const jsonStrings = responseData.split('}{').map((s, index, arr) => {
    if (index === 0) return s + '}';
    if (index === arr.length - 1) return '{' + s;
    return '{' + s + '}';
  });

  for (const jsonStr of jsonStrings) {
    try {
      // Handle the [DONE] marker
      if (jsonStr.trim() === '[DONE]') {
        break;
      }
      const parsed = JSON.parse(jsonStr);
      if (parsed.chunk) {
        accumulatedResponse += parsed.chunk;
      }
    } catch (e) {
      console.error('Error parsing welcome message chunk:', jsonStr, e);
      // If parsing fails, it might be a non-JSON part or an error.
      // For now, we'll just skip it or handle as needed.
    }
  }
  return accumulatedResponse;
};
