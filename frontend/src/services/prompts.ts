import { HttpService, type PagableResponse } from './api';

export interface Prompt {
  id: number;
  name: string;
  content: string;
  description?: string;
  inputSchemaJson?: string;
  outputSchemaJson?: string;
}

export const fetchPrompts = async (page: number, pageSize: number): Promise<PagableResponse<Prompt>> => {
  const response = await HttpService.getPagable<Prompt>('/mcp/prompts', page, pageSize);
  return response;
};

export const createPrompt = async (promptData: Omit<Prompt, 'id'>): Promise<Prompt> => {
  const response = await HttpService.post<Prompt>('/mcp/prompts', promptData);
  return response;
};

export const updatePrompt = async (id: number, promptData: Prompt): Promise<Prompt> => {
  const response = await HttpService.put<Prompt>(`/mcp/prompts/${id}`, promptData);
  return response;
};

export const deletePrompt = async (id: number): Promise<void> => {
  await HttpService.delete<void>(`/mcp/prompts/${id}`);
};