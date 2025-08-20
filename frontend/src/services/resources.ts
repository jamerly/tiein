import { HttpService, type PagableResponse } from './api';

export interface Resource {
  id: number;
  uri: string;
  content: string;
  contentType: string;
  description?: string;
}

export const fetchResources = async (page: number, pageSize: number): Promise<PagableResponse<Resource>> => {
  const response = await HttpService.getPagable<Resource>('/mcp/resources', page, pageSize);
  return response;
};

export const createResource = async (resourceData: Omit<Resource, 'id'>): Promise<Resource> => {
  const response = await HttpService.post<Resource>('/mcp/resources', resourceData);
  return response;
};

export const updateResource = async (id: number, resourceData: Resource): Promise<Resource> => {
  const response = await HttpService.put<Resource>(`/mcp/resources/${id}`, resourceData);
  return response;
};

export const deleteResource = async (id: number): Promise<void> => {
  await HttpService.delete<void>(`/mcp/resources/${id}`);
};