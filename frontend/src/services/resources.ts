import { HttpService, type PagableResponse } from './api';

export interface Resource {
  id: number;
  uri: string;
  content: string;
  contentType: string;
  description?: string;
  groupIds: number[]; // Added groupIds
}

export const fetchResources = async (page: number, pageSize: number, groupIds?: number[]): Promise<PagableResponse<Resource>> => {
  let url = '/mcp/resources';
  const params = new URLSearchParams();

  if (groupIds && groupIds.length > 0) {
    groupIds.forEach(id => params.append('groupIds', id.toString())); // Append each ID as a separate parameter
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await HttpService.getPagable<Resource>(url, page, pageSize);
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